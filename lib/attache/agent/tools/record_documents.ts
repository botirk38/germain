import { defineTool } from "eve/tools";
import { z } from "zod";
import { caseState, documentTypeSchema } from "../lib/state";

const inputSchema = z.object({
  documents: z.array(
    z.object({
      type: documentTypeSchema,
      name: z.string().trim().min(1).max(240),
      storage_key: z.string().trim().min(1).max(500).optional(),
    }),
  ).min(1),
});

const outputSchema = z.object({
  recorded: z.array(documentTypeSchema),
  remaining_requested: z.array(documentTypeSchema),
  case_state: z.unknown(),
});

export default defineTool({
  description:
    "Persist metadata for documents that were received from the applicant. This does not inspect document contents.",
  inputSchema,
  outputSchema,
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
    const remainingRequested = nextDocuments
      .filter((document) => document.status === "requested")
      .map((document) => document.type);

    caseState.update((s) => ({
      ...s,
      documents: nextDocuments,
      status: s.status === "checklist_ready" && remainingRequested.length === 0 ? "documents_reviewed" : s.status,
    }));

    return {
      recorded: documents.map((d) => d.type),
      remaining_requested: remainingRequested,
      case_state: caseState.get(),
    };
  },
  toModelOutput(output) {
    return {
      type: "json",
      value: {
        recorded: output.recorded,
        remaining_requested: output.remaining_requested,
      },
    };
  },
});
