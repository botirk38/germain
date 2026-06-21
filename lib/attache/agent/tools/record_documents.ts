import { defineTool } from "eve/tools";
import { defineState } from "eve/context";
import { z } from "zod";

const documentTypeSchema = z.enum([
  "passport",
  "photo",
  "bank_statement",
  "employment_letter",
  "insurance",
  "hotel_booking",
  "flight_itinerary",
  "invitation_letter",
  "property_deed",
  "marriage_certificate",
  "birth_certificate",
]);

type DocumentType = z.infer<typeof documentTypeSchema>;
type Document = {
  readonly id: string;
  readonly type: DocumentType;
  readonly name: string;
  readonly status: "requested" | "uploaded";
  readonly storageKey?: string;
};
type CaseState = { readonly documents: readonly Document[]; readonly status: string } & Record<string, unknown>;

function initialCaseState(): CaseState {
  return { id: `case-${Date.now()}`, documents: [], status: "intake" };
}

const caseState = defineState<CaseState>("attache.case", initialCaseState);

const inputSchema = z.object({
  documents: z.array(
    z.object({
      type: documentTypeSchema,
      name: z.string(),
      storage_key: z.string().optional(),
    }),
  ),
});

export default defineTool({
  description:
    "Record documents the user has uploaded. Call this immediately when the user provides files, " +
    "either in bulk or one at a time. Existing documents of the same type are updated.",
  inputSchema,
  async execute({ documents }) {
    const current = caseState.get();
    const now = Date.now();
    const updates = new Map(current.documents.map((d) => [d.type, d]));

    for (const [index, doc] of documents.entries()) {
      const existing = updates.get(doc.type);
      if (existing) {
        updates.set(doc.type, {
          ...existing,
          name: doc.name,
          status: "uploaded",
          storageKey: doc.storage_key ?? existing.storageKey,
        });
      } else {
        updates.set(doc.type, {
          id: `doc-${now}-${index}`,
          type: doc.type,
          name: doc.name,
          status: "uploaded",
          storageKey: doc.storage_key,
        });
      }
    }

    const nextDocuments = [...updates.values()];

    caseState.update((s) => ({
      ...s,
      documents: nextDocuments,
      status: s.status === "checklist_ready" ? "documents_reviewed" : s.status,
    }));

    return {
      recorded: documents.map((d) => d.type),
      case_state: caseState.get(),
    };
  },
});
