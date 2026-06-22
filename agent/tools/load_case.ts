import { defineTool } from "eve/tools";
import { z } from "zod";
import { getVisaCaseProjection } from "@/lib/db/queries";
import { caseState } from "../lib/state";

const inputSchema = z.object({
  visa_case_id: z.string().uuid(),
});

const outputSchema = z.object({
  loaded: z.boolean(),
  visa_case_id: z.string().uuid(),
  case_state: z.unknown(),
});

export default defineTool({
  description: "Load the authenticated user's visa case from the database into the current agent session.",
  inputSchema,
  outputSchema,
  async execute({ visa_case_id }, ctx) {
    const userId = ctx.session.auth.current?.attributes.userId;
    const orgId = ctx.session.auth.current?.attributes.orgId;
    if (typeof userId !== "string") {
      throw new Error("No authenticated user found for this Eve session.");
    }

    const projection = await getVisaCaseProjection({
      clerkUserId: userId,
      clerkOrgId: typeof orgId === "string" ? orgId : null,
      visaCaseId: visa_case_id,
    });

    if (!projection) {
      throw new Error("Visa case not found for the authenticated user.");
    }

    const { visaCase, intake, latestAssessment, documentRequirements, documents, candidateActions, caseSubmission, visibleEvents } = projection;

    caseState.update((state) => ({
      ...state,
      id: visaCase.id,
      visaCaseId: visaCase.id,
      visaType: latestAssessment?.visaType ?? state.visaType,
      destinationCountry: visaCase.destinationCountry,
      status: visaCase.internalStatus,
      candidateStatus: visaCase.candidateStatus,
      approvalLikelihood: latestAssessment?.approvalLikelihood ?? state.approvalLikelihood,
      recommendations: latestAssessment?.recommendations ?? state.recommendations,
      applicant: {
        ...state.applicant,
        fullName: intake?.applicantFullName,
        nationality: intake?.applicantNationality,
        residenceCountry: intake?.applicantResidenceCountry,
        residenceCity: intake?.applicantResidenceCity,
        employmentStatus: intake?.applicantEmploymentStatus,
        employer: intake?.applicantEmployer ?? undefined,
        jobTitle: intake?.applicantJobTitle ?? undefined,
        monthlyIncome: intake?.applicantMonthlyIncome ?? undefined,
        propertyOwned: intake?.propertyOwned,
        familyInHomeCountry: intake?.familyInHomeCountry,
        previousRefusals: intake?.previousRefusals,
      },
      travel: {
        ...state.travel,
        purpose: visaCase.travelPurpose,
        arrivalDate: intake?.arrivalDate,
        departureDate: intake?.departureDate,
        destinationCity: intake?.destinationCity ?? undefined,
      },
      documentRequirements: documentRequirements.map((requirement) => ({
        id: requirement.id,
        type: requirement.documentType,
        label: requirement.label,
        reason: requirement.reason,
        guidance: requirement.guidance ?? undefined,
        required: requirement.required,
        status: requirement.status,
      })),
      documents: documents.map((document) => ({
        id: document.id,
        type: document.documentType,
        name: document.originalFilename,
        status: document.status,
        storageKey: document.storageKey ?? undefined,
      })),
      candidateActions: candidateActions.map((action) => ({
        id: action.id,
        type: action.actionType,
        status: action.status,
        title: action.title,
        description: action.description ?? undefined,
        ctaLabel: action.ctaLabel ?? undefined,
      })),
      missingFields: latestAssessment?.missingFields ?? state.missingFields,
      riskFlags: latestAssessment?.riskFlags ?? state.riskFlags,
      referenceNumber: visaCase.referenceNumber ?? caseSubmission?.referenceNumber ?? undefined,
      portalUrl: caseSubmission?.portalUrl ?? undefined,
      browserUseSessionId: caseSubmission?.browserUseSessionId ?? undefined,
      submissionPreview: caseSubmission?.liveViewUrl
        ? {
            liveViewUrl: caseSubmission.liveViewUrl,
            status: caseSubmission.submissionStatus === "failed" ? "failed" : "partial",
            formFieldsFilled: 0,
            ...(caseSubmission.referenceNumber ? { referenceNumber: caseSubmission.referenceNumber } : {}),
          }
        : undefined,
      timeline: visibleEvents.map((event) => ({
        title: event.eventType.replace(/_/g, " "),
        description: event.eventType.replace(/_/g, " "),
        time: event.createdAt.toISOString(),
        status: "complete",
      })),
    }));

    return { loaded: true, visa_case_id, case_state: caseState.get() };
  },
  toModelOutput(output) {
    return { type: "json", value: { loaded: output.loaded, visa_case_id: output.visa_case_id } };
  },
});
