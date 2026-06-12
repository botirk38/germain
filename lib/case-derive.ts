import { isToolUIPart, getToolName } from "ai";
import type { GermainUIMessage } from "./agents/germain";
import type { GermainCase, Recommendation, CaseStatus, GermainDocument, GermainTimelineEvent } from "./germain-types";
// Types are inferred from usage, no explicit import needed

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
  // Sum impacts of resolved recommendations
  const resolvedImpact = recommendations
    .filter((r) => r.resolved)
    .reduce((sum, r) => sum + r.impact, 0);

  // Status-based bonuses
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
    assessEligibility: "route_selected",
    recommendVisaRoute: "checklist_ready",
    buildChecklist: "checklist_ready",
    uploadDocuments: "documents_reviewed",
    reviewDocuments: "documents_reviewed",
    generateApplication: "form_ready",
    prepareSupportingPack: "pack_ready",
    runRiskReview: "review_passed",
    bookAppointment: "appointment_set",
    payFees: "fees_paid",
    submitFiling: "submitted",
    trackEmbassyUpdates: toolOutput.status === "rfe_issued" ? "awaiting_biometrics" : "processing",
    trackDecision: "decision_ready",
    provideMissingInsurance: "processing",
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
    case "assessEligibility": {
      if (output.eligible) {
        updates.visaType = output.visaType as string;
        updates.destinationCountry = output.destinationCountry as string;
        updates.approvalLikelihood = output.baseLikelihood as number;
      }
      break;
    }

    case "recommendVisaRoute": {
      updates.fees = {
        ...state.fees,
        visaFee: output.visaFee as number,
        total: output.visaFee as number,
      };
      break;
    }

    case "buildChecklist": {
      // Convert checklist to document stubs
      const required = (output.requiredDocuments as Array<{ type: string; description: string; critical: boolean }>) || [];
      updates.documents = required.map((doc, i) => ({
        id: `doc-${i}`,
        name: doc.description,
        type: doc.type as GermainDocument["type"],
        status: "missing" as const,
      }));
      break;
    }

    case "uploadDocuments": {
      // Fold the user's uploaded files into the checklist stubs so the
      // DOCUMENTS panel reflects what was attached (status: uploaded).
      const uploaded =
        (output.documents as Array<{ type: string; name?: string }>) || [];
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

    case "reviewDocuments": {
      const docId = output.documentId as string;
      const recommendations = (output.recommendations as Recommendation[]) || [];

      // Update document status
      updates.documents = state.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: output.verificationStatus as GermainDocument["status"],
              extractedData: output.extractedFields as Record<string, string>,
              riskFlags: (output.issues as Array<{ message: string }>)?.map((i) => i.message) || [],
            }
          : d
      );

      // Merge new recommendations
      const existingIds = new Set(state.recommendations.map((r) => r.id));
      const newRecs = recommendations.filter((r) => !existingIds.has(r.id));
      updates.recommendations = [...state.recommendations, ...newRecs];

      // Update financials from bank statement
      if (output.extractedFields && (output.extractedFields as Record<string, string>).balance) {
        const balance = parseFloat((output.extractedFields as Record<string, string>).balance);
        updates.financials = {
          ...state.financials,
          bankBalance: balance,
          coverageRatio: state.financials.tripBudget ? balance / state.financials.tripBudget : undefined,
        };
      }
      break;
    }

    case "generateApplication": {
      const formData = output.formData as Record<string, string>;
      updates.applicant = {
        ...state.applicant,
        fullName: formData.fullName,
        nationality: formData.nationality,
        passportNumber: formData.passportNumber,
      };
      updates.travel = {
        ...state.travel,
        purpose: formData.purposeOfTravel as GermainCase["travel"]["purpose"],
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
      };
      updates.formCompletion = 100;
      break;
    }

    case "prepareSupportingPack": {
      // Supporting pack is ready - no state changes needed, just status advance
      break;
    }

    case "runRiskReview": {
      const finalRecs = (output.finalRecommendations as Recommendation[]) || [];
      const existingIds = new Set(state.recommendations.map((r) => r.id));
      const newRecs = finalRecs.filter((r) => !existingIds.has(r.id));
      updates.recommendations = [...state.recommendations, ...newRecs];
      break;
    }

    case "bookAppointment": {
      updates.appointments = [
        ...(state.appointments || []),
        {
          type: output.appointmentType as "biometrics" | "interview",
          date: output.date as string,
          time: output.time as string,
          location: output.location as string,
          confirmed: true,
        },
      ];
      break;
    }

    case "payFees": {
      updates.fees = {
        ...state.fees,
        paid: true,
      };
      break;
    }

    case "submitFiling": {
      updates.referenceNumber = `GER-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      updates.timeline = [
        ...(state.timeline || []),
        {
          title: "Application Submitted",
          description: `Reference: ${updates.referenceNumber}`,
          time: new Date().toISOString(),
          status: "complete",
        },
      ];
      break;
    }

    case "trackEmbassyUpdates": {
      if (output.status === "rfe_issued") {
        updates.embassyFollowUps = [
          ...(state.embassyFollowUps || []),
          {
            type: "rfe",
            description: (output.rfeDetails as { explanation: string })?.explanation || "Additional documents required",
            deadline: output.deadline as string,
            responded: false,
          },
        ];
      } else if (output.status === "awaiting_biometrics") {
        updates.embassyFollowUps = [
          ...(state.embassyFollowUps || []),
          {
            type: "biometrics_scheduled",
            description: output.message as string,
            responded: true,
          },
        ];
      }
      break;
    }

    case "provideMissingInsurance": {
      // Mark RFE as responded
      updates.embassyFollowUps = state.embassyFollowUps.map((f) =>
        f.type === "rfe" ? { ...f, responded: true } : f
      );
      break;
    }

    case "trackDecision": {
      updates.timeline = [
        ...(state.timeline || []),
        {
          title: output.decision === "approved" ? "Visa Approved" : "Decision Received",
          description: output.nextSteps as string,
          time: new Date().toISOString(),
          status: output.decision === "approved" ? "complete" : "alert",
        } as GermainTimelineEvent,
      ];
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
