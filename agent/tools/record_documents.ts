import { defineTool } from "eve/tools";
import { z } from "zod";
import { getVisaCaseView, recordDocument } from "@/lib/db/queries";
import { activeVisaCase, documentTypeSchema } from "../lib/state";

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
  case_view: z.unknown(),
});

export default defineTool({
  description:
    "Persist metadata for documents that were received from the applicant. This does not inspect document contents.",
  inputSchema,
  outputSchema,
  async execute({ documents }, ctx) {
    const current = activeVisaCase.get();
    const clerkUserId = ctx.session.auth.current?.attributes.userId;
    const clerkOrgId = ctx.session.auth.current?.attributes.orgId;

    if (typeof clerkUserId !== "string") {
      throw new Error("No authenticated user found for this Eve session.");
    }
    if (!current.visaCaseId) {
      throw new Error("Load a visa case before recording documents.");
    }
    const visaCaseId = current.visaCaseId;
    const owner = {
      clerkUserId,
      clerkOrgId: typeof clerkOrgId === "string" ? clerkOrgId : null,
      visaCaseId,
    };
    const caseView = await getVisaCaseView(owner);
    if (!caseView) throw new Error("Visa case not found for the authenticated user.");

    const recordedDocuments = await Promise.all(
      documents.map((document) => {
        const originalFilename = document.name;
        if (!originalFilename) throw new Error("Document filename is required.");
        if (document.storage_key && !document.storage_key.startsWith(`documents/${clerkUserId}/`)) {
          throw new Error("Document storage key does not belong to the authenticated user.");
        }

        return recordDocument(
          owner,
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
    const remainingRequested = caseView.documentRequirements
      .filter((requirement) => requirement.status === "requested" && !recordedTypeSet.has(requirement.documentType))
      .map((requirement) => requirement.documentType);
    const nextCaseView = await getVisaCaseView(owner);

    return {
      recorded: recordedTypes,
      remaining_requested: remainingRequested,
      case_view: nextCaseView,
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
