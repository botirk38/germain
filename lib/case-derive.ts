import { isToolUIPart, getToolName } from "ai";
import type { GermainUIMessage } from "./agents/germain";
import type { GermainCase, Recommendation, CaseStatus, GermainDocument, GermainTimelineEvent } from "./germain-types";

const BASE_APPROVAL_LIKELIHOOD = 35;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasRecordOutput(
  part: NonNullable<GermainUIMessage["parts"]>[number]
): part is Extract<NonNullable<GermainUIMessage["parts"]>[number], { state: "output-available" }> & {
  output: Record<string, unknown>;
} {
  return isToolUIPart(part) && part.state === "output-available" && isRecord(part.output);
}

// Default empty case state
export const initialCaseState: GermainCase = {
  id: `case-${Date.now()}`,
  visaType: "",
  destinationCountry: "",
  status: "intake",
  approvalLikelihood: BASE_APPROVAL_LIKELIHOOD,
  recommendations: [],
  applicant: {},
  travel: {},
  financials: {},
  documents: [],
  missingFields: [],
  riskFlags: [],
  formCompletion: 0,
  appointments: [],
  fees: {
    visaFee: 0,
    serviceFee: 0,
    vacFee: 0,
    total: 0,
    paid: false,
  },
  embassyFollowUps: [],
  timeline: [],
};

// Calculate approval likelihood from base + resolved recommendations
function calculateApprovalLikelihood(
  base: number,
  recommendations: Recommendation[],
  status: CaseStatus
): number {
  const resolvedImpact = recommendations
    .filter((r) => r.resolved)
    .reduce((sum, r) => sum + r.impact, 0);

  const statusBonus: Record<CaseStatus, number> = {
    intake: 0,
    route_selected: 5,
    checklist_ready: 5,
    documents_reviewed: 25,
    form_ready: 40,
    pack_ready: 50,
    review_passed: 65,
    appointment_set: 70,
    fees_paid: 70,
    submitted: 80,
    awaiting_biometrics: 80,
    processing: 85,
    decision_ready: 100,
  };

  const total = base + resolvedImpact + (statusBonus[status] || 0);
  return Math.min(99, Math.max(20, total));
}

// Derive next status based on current status and tool output
function deriveNextStatus(
  current: CaseStatus,
  toolName: string,
  toolOutput: Record<string, unknown>
): CaseStatus {
  const statusFlow: Record<string, CaseStatus> = {
    evaluateCase: "checklist_ready",
    uploadDocuments: "documents_reviewed",
    reviewAndPrepare: "pack_ready",
    runRiskReview: "review_passed",
    submitApplication: "submitted",
    approveSubmission: "submitted",
    monitorCase: toolOutput.status === "rfe_issued"
      ? "awaiting_biometrics"
      : toolOutput.status === "decision_made"
        ? "decision_ready"
        : "processing",
  };

  return statusFlow[toolName] || current;
}

// Fold a single tool output into case state
function applyToolOutput(
  state: GermainCase,
  toolName: string,
  output: Record<string, unknown>
): Partial<GermainCase> {
  const updates: Partial<GermainCase> = {};

  switch (toolName) {
    case "evaluateCase": {
      updates.visaType = output.visaType as string;
      updates.destinationCountry = (output.fees as Record<string, unknown>)
        ? state.destinationCountry
        : "";

      if (output.baseLikelihood) {
        updates.approvalLikelihood = output.baseLikelihood as number;
      }

      // Set fees from evaluateCase
      const fees = output.fees as Record<string, number> | undefined;
      if (fees) {
        updates.fees = {
          visaFee: fees.visa ?? 0,
          serviceFee: fees.service ?? 0,
          vacFee: fees.vac ?? 0,
          total: fees.total ?? 0,
          paid: false,
        };
      }

      // Set documents from checklist
      const required = (output.requiredDocuments as Array<{ type: string; description: string; critical: boolean }>) || [];
      updates.documents = required.map((doc, i) => ({
        id: `doc-${i}`,
        name: doc.description,
        type: doc.type as GermainDocument["type"],
        status: "missing" as const,
      }));

      // Capture destination country
      if (output.consulate) {
        const consulateStr = output.consulate as string;
        // Extract destination country from consulate string if available
        updates.destinationCountry = consulateStr.split(" ")[0] || state.destinationCountry;
      }

      break;
    }

    case "uploadDocuments": {
      const uploaded = (output.documents as Array<{ type: string; name?: string }>) || [];
      if (uploaded.length) {
        const byType = new Map(uploaded.map((u) => [u.type, u]));
        updates.documents = state.documents.map((d) =>
          byType.has(d.type)
            ? { ...d, status: "uploaded" as const, name: byType.get(d.type)?.name || d.name }
            : d
        );
      }
      break;
    }

    case "uploadDocument": {
      const doc = output.document as { type: string; name?: string } | undefined;
      if (doc) {
        updates.documents = state.documents.map((d) =>
          d.type === doc.type
            ? { ...d, status: "uploaded" as const, name: doc.name || d.name }
            : d
        );
      }
      break;
    }

    case "reviewAndPrepare": {
      // Update documents from review results
      const reviews = (output.documentReviews as Array<{
        type: string;
        status: string;
        extractedFields: Record<string, string>;
        issues: Array<{ message: string }>;
      }>) || [];

      if (reviews.length) {
        const reviewByType = new Map(reviews.map((r) => [r.type, r]));
        updates.documents = state.documents.map((d) => {
          const review = reviewByType.get(d.type);
          if (review) {
            return {
              ...d,
              status: review.status as GermainDocument["status"],
              extractedData: review.extractedFields,
              riskFlags: review.issues.map((i) => i.message),
            };
          }
          return d;
        });
      }

      // Merge recommendations
      const newRecs = (output.recommendations as Recommendation[]) || [];
      const existingIds = new Set(state.recommendations.map((r) => r.id));
      const freshRecs = newRecs.filter((r) => !existingIds.has(r.id));
      updates.recommendations = [...state.recommendations, ...freshRecs];

      // Update form completion
      updates.formCompletion = output.formData ? 100 : state.formCompletion;

      // Update applicant from form data
      const formData = output.formData as Record<string, string> | undefined;
      if (formData) {
        updates.applicant = {
          ...state.applicant,
          fullName: formData.fullName || state.applicant.fullName,
          nationality: formData.nationality || state.applicant.nationality,
        };
        updates.travel = {
          ...state.travel,
          purpose: (formData.purposeOfTravel as GermainCase["travel"]["purpose"]) || state.travel.purpose,
          arrivalDate: formData.arrivalDate || state.travel.arrivalDate,
          departureDate: formData.departureDate || state.travel.departureDate,
          destinationCity: formData.destinationCity || state.travel.destinationCity,
        };
      }

      break;
    }

    case "runRiskReview": {
      const finalRecs = (output.finalRecommendations as Recommendation[]) || [];
      const existingIds = new Set(state.recommendations.map((r) => r.id));
      const newRecs = finalRecs.filter((r) => !existingIds.has(r.id));
      updates.recommendations = [...state.recommendations, ...newRecs];
      break;
    }

    case "submitApplication": {
      const refNum = (output.referenceNumber as string) || `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      updates.referenceNumber = refNum;
      updates.fees = { ...state.fees, paid: true };

      // Appointment details
      const appointment = output.appointmentDetails as Record<string, string> | undefined;
      if (appointment) {
        updates.appointments = [
          ...state.appointments,
          {
            type: "biometrics" as const,
            date: appointment.date,
            time: appointment.time,
            location: appointment.location,
            confirmed: true,
          },
        ];
      }

      updates.timeline = [
        ...(state.timeline || []),
        {
          title: "Application Submitted",
          description: `Reference: ${refNum}`,
          time: new Date().toISOString(),
          status: "complete",
        },
      ];
      break;
    }

    case "approveSubmission": {
      if (output.approved) {
        updates.timeline = [
          ...(state.timeline || []),
          {
            title: "Submission Approved by User",
            description: (output.userNote as string) || "User approved the application for submission.",
            time: new Date().toISOString(),
            status: "complete",
          },
        ];
      }
      break;
    }

    case "monitorCase": {
      if (output.status === "rfe_issued" && output.rfeDetails) {
        const rfe = output.rfeDetails as { explanation: string; deadline?: string };
        updates.embassyFollowUps = [
          ...(state.embassyFollowUps || []),
          {
            type: "rfe" as const,
            description: rfe.explanation || "Additional documents required",
            deadline: rfe.deadline,
            responded: false,
          },
        ];
      } else if (output.status === "biometrics_scheduled") {
        updates.embassyFollowUps = [
          ...(state.embassyFollowUps || []),
          {
            type: "biometrics_scheduled" as const,
            description: (output.summary as string) || "Biometrics appointment scheduled",
            responded: true,
          },
        ];
      } else if (output.status === "decision_made" && output.decision) {
        const decision = output.decision as Record<string, unknown>;
        updates.timeline = [
          ...(state.timeline || []),
          {
            title: decision.outcome === "approved" ? "Visa Approved" : "Decision Received",
            description: `Outcome: ${decision.outcome as string}`,
            time: new Date().toISOString(),
            status: decision.outcome === "approved" ? "complete" : "alert",
          } as GermainTimelineEvent,
        ];
      }
      break;
    }


  }

  return updates;
}

// Main derive function: fold all tool outputs from messages into case state
export function deriveCase(messages: GermainUIMessage[]): GermainCase {
  const state = messages
    .flatMap((message) => (message.role === "assistant" ? message.parts ?? [] : []))
    .filter(hasRecordOutput)
    .reduce<GermainCase>((currentState, part) => {
      const toolName = getToolName(part);
      const output = part.output;
      const updatedState = { ...currentState, ...applyToolOutput(currentState, toolName, output) };
      const nextStatus = deriveNextStatus(updatedState.status, toolName, output);

      return nextStatus === updatedState.status
        ? updatedState
        : { ...updatedState, status: nextStatus };
    }, { ...initialCaseState });

  return {
    ...state,
    approvalLikelihood: calculateApprovalLikelihood(
    BASE_APPROVAL_LIKELIHOOD,
    state.recommendations,
    state.status
    ),
  };
}

// Get current step index for UI progress
export function getCurrentStepIndex(status: CaseStatus): number {
  const order: CaseStatus[] = [
    "intake",
    "route_selected",
    "checklist_ready",
    "documents_reviewed",
    "form_ready",
    "pack_ready",
    "review_passed",
    "appointment_set",
    "fees_paid",
    "submitted",
    "awaiting_biometrics",
    "processing",
    "decision_ready",
  ];
  return order.indexOf(status);
}
