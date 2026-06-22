import { defineTool } from "eve/tools";
import { z } from "zod";
import { createDocumentRequirements, getVisaCaseView } from "@/lib/db/queries";
import { activeVisaCase, documentTypeSchema } from "../lib/state";

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
  case_view: z.unknown(),
});

export default defineTool({
  description:
    "Create durable document upload slots. Use when the UI should ask the applicant for one or more documents.",
  inputSchema,
  outputSchema,
  async execute({ document_types, reason, guidance }, ctx) {
    const current = activeVisaCase.get();
    const clerkUserId = ctx.session.auth.current?.attributes.userId;
    const clerkOrgId = ctx.session.auth.current?.attributes.orgId;

    if (typeof clerkUserId !== "string") {
      throw new Error("No authenticated user found for this Eve session.");
    }
    if (!current.visaCaseId) {
      throw new Error("Load a visa case before requesting documents.");
    }
    const caseView = await getVisaCaseView({
      clerkUserId,
      clerkOrgId: typeof clerkOrgId === "string" ? clerkOrgId : null,
      visaCaseId: current.visaCaseId,
    });
    if (!caseView) throw new Error("Visa case not found for the authenticated user.");

    const existingTypes = new Set(caseView.documentRequirements.map((requirement) => requirement.documentType));
    const requested = document_types.filter((type) => !existingTypes.has(type));

    const requirements = await createDocumentRequirements(
      {
        clerkUserId,
        clerkOrgId: typeof clerkOrgId === "string" ? clerkOrgId : null,
        visaCaseId: current.visaCaseId,
      },
      requested.map((documentType) => ({ documentType, reason, guidance })),
    );
    const nextCaseView = await getVisaCaseView({
      clerkUserId,
      clerkOrgId: typeof clerkOrgId === "string" ? clerkOrgId : null,
      visaCaseId: current.visaCaseId,
    });

    return {
      requested_types: requested,
      reason,
      guidance,
      total_pending: caseView.documentRequirements.length + requirements.length,
      case_view: nextCaseView,
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
