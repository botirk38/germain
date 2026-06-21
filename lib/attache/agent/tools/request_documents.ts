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
type Document = { readonly id: string; readonly type: DocumentType; readonly name: string; readonly status: "requested" | "uploaded" };
type CaseState = { readonly documents: readonly Document[]; readonly status: string } & Record<string, unknown>;
type OnboardingState = { readonly requestedDocuments: readonly DocumentType[] } & Record<string, unknown>;

function initialCaseState(): CaseState {
  return { id: `case-${Date.now()}`, documents: [], status: "intake" };
}

function initialOnboardingState(): OnboardingState {
  return { collectedFields: {}, requestedDocuments: [], completed: false };
}

const caseState = defineState<CaseState>("attache.case", initialCaseState);
const onboardingState = defineState<OnboardingState>("attache.onboarding", initialOnboardingState);

const inputSchema = z.object({
  document_types: z.array(documentTypeSchema).describe("The document types to request from the user."),
  reason: z.string().describe("Why these documents are needed."),
  guidance: z
    .string()
    .optional()
    .describe("Specific guidance on what makes a good upload."),
});

export default defineTool({
  description:
    "Record a request for one or more documents. Updates the case state so the UI can show upload " +
    "slots. After calling this, explain what is needed and wait for the user to upload files. " +
    "When the user provides files, call record_documents to update the case state.",
  inputSchema,
  async execute({ document_types, reason, guidance }) {
    const current = caseState.get();
    const existingTypes = new Set(current.documents.map((d) => d.type));
    const requested = document_types.filter((type) => !existingTypes.has(type));

    const now = Date.now();
    const newDocs = requested.map((type, index) => ({
      id: `doc-${now}-${index}`,
      type,
      name: "",
      status: "requested" as const,
    }));

    caseState.update((s) => ({
      ...s,
      documents: [...s.documents, ...newDocs],
      status:
        s.status === "intake" || s.status === "route_selected"
          ? "checklist_ready"
          : s.status,
    }));

    onboardingState.update((s) => ({
      ...s,
      requestedDocuments: [...s.requestedDocuments, ...requested],
    }));

    return {
      requested_types: requested,
      reason,
      guidance,
      total_pending: current.documents.length + newDocs.length,
      case_state: caseState.get(),
    };
  },
});
