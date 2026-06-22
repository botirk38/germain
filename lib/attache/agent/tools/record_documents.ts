import { defineTool } from "eve/tools";
import { z } from "zod";
import { recordDocument } from "@/lib/db/queries";
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
  async execute({ documents }, ctx) {
    const current = caseState.get();
    const clerkUserId = ctx.session.auth.current?.attributes.userId;
    const clerkOrgId = ctx.session.auth.current?.attributes.orgId;

    if (typeof clerkUserId !== "string") {
      throw new Error("No authenticated user found for this Eve session.");
    }
    if (!current.visaCaseId) {
      throw new Error("Load a visa case before recording documents.");
    }
    const visaCaseId = current.visaCaseId;

    const recordedDocuments = await Promise.all(
      documents.map((document) => {
        const originalFilename = document.name;
        if (!originalFilename) throw new Error("Document filename is required.");

        return recordDocument(
          {
            clerkUserId,
            clerkOrgId: typeof clerkOrgId === "string" ? clerkOrgId : null,
            visaCaseId,
          },
          {
            documentType: document.type,
            originalFilename,
            storageKey: document.storage_key,
          },
        );
      }),
    );

    const addedDocuments = recordedDocuments.filter(
      (document): document is NonNullable<(typeof recordedDocuments)[number]> => document !== null,
    );
    const recordedTypes = addedDocuments.map((document) => document.documentType);
    const recordedTypeSet = new Set(recordedTypes);
    const remainingRequested = current.documentRequirements
      .filter((requirement) => requirement.status === "requested" && !recordedTypeSet.has(requirement.type))
      .map((requirement) => requirement.type);

    caseState.update((s) => ({
      ...s,
      documents: [
        ...s.documents,
        ...addedDocuments.map((document) => ({
          id: document.id,
          type: document.documentType,
          name: document.originalFilename,
          status: document.status,
          storageKey: document.storageKey ?? undefined,
        })),
      ],
      documentRequirements: s.documentRequirements.map((requirement) =>
        recordedTypeSet.has(requirement.type) ? { ...requirement, status: "satisfied" as const } : requirement,
      ),
      status: remainingRequested.length === 0 ? "documents_received" : "documents_partially_received",
      candidateStatus: remainingRequested.length === 0 ? "reviewing_documents" : "waiting_for_documents",
    }));

    return {
      recorded: recordedTypes,
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
