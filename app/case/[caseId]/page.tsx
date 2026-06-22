import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { initialCaseState } from "@/components/attache/initial-states";
import type { CaseState, Recommendation } from "@/components/attache/case-types";
import { CaseComposer } from "@/components/pages/case/case-composer";
import { CaseConversation } from "@/components/pages/case/case-conversation";
import { CaseError } from "@/components/pages/case/case-error";
import { CaseHeader } from "@/components/pages/case/case-header";
import { CaseMobileSummary } from "@/components/pages/case/case-mobile-summary";
import { CasePageProvider } from "@/components/pages/case/case-page-provider";
import { CaseSidebar } from "@/components/pages/case/case-sidebar";
import { getVisaCaseProjection } from "@/lib/db/queries";

type VisaCaseProjection = NonNullable<Awaited<ReturnType<typeof getVisaCaseProjection>>>;

function isRecommendation(value: unknown): value is Recommendation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.issue === "string" &&
    typeof candidate.fix === "string" &&
    typeof candidate.impact === "number" &&
    typeof candidate.resolved === "boolean" &&
    typeof candidate.category === "string"
  );
}

function recommendationsFromAssessment(value: unknown): readonly Recommendation[] {
  return Array.isArray(value) ? value.filter(isRecommendation) : [];
}

function caseStateFromProjection(projection: VisaCaseProjection): CaseState {
  const base = initialCaseState();
  const { visaCase, intake, latestAssessment, documentRequirements, documents, candidateActions, caseSubmission, visibleEvents } = projection;

  return {
    ...base,
    id: visaCase.id,
    visaCaseId: visaCase.id,
    visaType: latestAssessment?.visaType ?? base.visaType,
    destinationCountry: visaCase.destinationCountry,
    status: visaCase.internalStatus,
    candidateStatus: visaCase.candidateStatus,
    approvalLikelihood: latestAssessment?.approvalLikelihood ?? base.approvalLikelihood,
    recommendations: recommendationsFromAssessment(latestAssessment?.recommendations),
    applicant: {
      ...base.applicant,
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
      ...base.travel,
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
    missingFields: latestAssessment?.missingFields ?? base.missingFields,
    riskFlags: latestAssessment?.riskFlags ?? base.riskFlags,
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
  };
}

export default async function VisaCasePage({ params }: { readonly params: Promise<{ readonly caseId: string }> }) {
  const { caseId } = await params;
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const projection = await getVisaCaseProjection({
    clerkUserId: userId,
    clerkOrgId: orgId,
    visaCaseId: caseId,
  });

  if (!projection) {
    notFound();
  }

  return (
    <CasePageProvider caseId={caseId} initialCaseState={caseStateFromProjection(projection)}>
      <div className="flex h-dvh overflow-hidden">
        <CaseSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <CaseHeader />
          <CaseMobileSummary />
          <CaseConversation />
          <CaseError />
          <CaseComposer />
        </main>
      </div>
    </CasePageProvider>
  );
}
