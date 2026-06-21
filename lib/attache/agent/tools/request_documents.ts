import { defineTool } from "eve/tools";
import { z } from "zod";
import { caseState, documentTypeSchema, onboardingState } from "../lib/state";

const inputSchema = z.object({
  document_types: z.array(documentTypeSchema).min(1).describe("The document types to request from the user."),
  reason: z.string().trim().min(1).max(600).describe("Why these documents are needed."),
  guidance: z.string().trim().min(1).max(800).optional().describe("What makes a good upload."),
});

const outputSchema = z.object({
  requested_types: z.array(documentTypeSchema),
  reason: z.string(),
  guidance: z.string().optional(),
  total_pending: z.number(),
  case_state: z.unknown(),
});

export default defineTool({
  description:
    "Create durable document upload slots. Use when the UI should ask the applicant for one or more documents.",
  inputSchema,
  outputSchema,
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
      status: s.status === "intake" || s.status === "route_selected" ? "checklist_ready" : s.status,
    }));

    onboardingState.update((s) => ({
      ...s,
      requestedDocuments: [...new Set([...s.requestedDocuments, ...requested])],
    }));

    return {
      requested_types: requested,
      reason,
      guidance,
      total_pending: current.documents.length + newDocs.length,
      case_state: caseState.get(),
    };
  },
  toModelOutput(output) {
    return {
      type: "json",
      value: {
        requested_types: output.requested_types,
        reason: output.reason,
        guidance: output.guidance,
        total_pending: output.total_pending,
      },
    };
  },
});
