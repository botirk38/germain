import { isToolUIPart, getToolName } from "ai";
import type { AttacheUIMessage } from "./agent";
import { evaluateCaseOutputSchema, type EvaluateCaseOutput } from "../tools/evaluate-case";
import { reviewAndPrepareOutputSchema, type ReviewAndPrepareOutput } from "../tools/review-and-prepare";
import { runRiskReviewOutputSchema, type RunRiskReviewOutput } from "../tools/run-risk-review";
import { monitorCaseOutputSchema, type MonitorCaseOutput } from "../tools/monitor-case";
import { uploadDocumentsOutputSchema, type UploadDocumentsOutput } from "../tools/upload-documents";
import { uploadDocumentOutputSchema, type UploadDocumentOutput } from "../tools/upload-documents";
import { submitApplicationOutputSchema, type SubmitApplicationOutput } from "../tools/submit-application";
import { approveSubmissionOutputSchema, type ApproveSubmissionOutput } from "../tools/submit-application";

// ---------------------------------------------------------------------------
// Case status workflow
// ---------------------------------------------------------------------------

export type CaseStatus =
  | "intake"
  | "route_selected"
  | "checklist_ready"
  | "documents_reviewed"
  | "form_ready"
  | "pack_ready"
  | "review_passed"
  | "appointment_set"
  | "fees_paid"
  | "submitted"
  | "awaiting_biometrics"
  | "processing"
  | "decision_ready";

export const WORKFLOW_STEPS: { key: CaseStatus; label: string; oddsContribution: number }[] = [
  { key: "intake", label: "Eligibility", oddsContribution: 0 },
  { key: "route_selected", label: "Visa Route", oddsContribution: 5 },
  { key: "checklist_ready", label: "Checklist", oddsContribution: 0 },
  { key: "documents_reviewed", label: "Documents", oddsContribution: 25 },
  { key: "form_ready", label: "Application", oddsContribution: 15 },
  { key: "pack_ready", label: "Supporting Pack", oddsContribution: 10 },
  { key: "review_passed", label: "Risk Review", oddsContribution: 15 },
  { key: "appointment_set", label: "Appointment", oddsContribution: 5 },
  { key: "fees_paid", label: "Fees", oddsContribution: 0 },
  { key: "submitted", label: "Submitted", oddsContribution: 10 },
  { key: "awaiting_biometrics", label: "Biometrics", oddsContribution: 0 },
  { key: "processing", label: "Processing", oddsContribution: 0 },
  { key: "decision_ready", label: "Decision", oddsContribution: 15 },
];

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type DocumentType =
  | "passport"
  | "photo"
  | "bank_statement"
  | "employment_letter"
  | "insurance"
  | "hotel_booking"
  | "flight_itinerary"
  | "invitation_letter"
  | "property_deed"
  | "marriage_certificate"
  | "birth_certificate";

export type AttacheDocument = {
  id: string;
  name: string;
  type: DocumentType;
  status: "missing" | "uploaded" | "needs_review" | "verified" | "rejected";
  extractedData?: Record<string, string>;
  riskFlags?: string[];
};

export type Recommendation = {
  id: string;
  issue: string;
  fix: string;
  impact: number;
  resolved: boolean;
  category: "funds" | "ties" | "employment" | "travel" | "insurance" | "consistency" | "completeness";
};

export type TimelineEvent = {
  title: string;
  description: string;
  time: string;
  status?: "pending" | "complete" | "alert";
};

export type AttacheCase = {
  id: string;
  visaType: string;
  destinationCountry: string;
  status: CaseStatus;
  approvalLikelihood: number;
  recommendations: Recommendation[];
  applicant: {
    fullName?: string;
    nationality?: string;
    passportNumber?: string;
    dateOfBirth?: string;
    residenceCountry?: string;
    employmentStatus?: "employed" | "self_employed" | "student" | "unemployed" | "retired";
    employer?: string;
    jobTitle?: string;
    monthlyIncome?: number;
    propertyOwned?: boolean;
    familyInHomeCountry?: boolean;
  };
  travel: {
    purpose?: "tourism" | "business" | "study" | "work" | "family_visit" | "transit";
    arrivalDate?: string;
    departureDate?: string;
    destinationCity?: string;
    hotelAddress?: string;
    invitingParty?: string;
    previousVisits?: number;
  };
  financials: {
    bankBalance?: number;
    tripBudget?: number;
    coverageRatio?: number;
    salaryCreditsConsistent?: boolean;
  };
  documents: AttacheDocument[];
  missingFields: string[];
  riskFlags: string[];
  formCompletion: number;
  referenceNumber?: string;
  appointments: {
    type: "biometrics" | "interview";
    date: string;
    time: string;
    location: string;
    confirmed: boolean;
  }[];
  fees: {
    visaFee: number;
    serviceFee: number;
    vacFee: number;
    total: number;
    paid: boolean;
  };
  embassyFollowUps: {
    type: "rfe" | "biometrics_scheduled" | "admin_processing" | "decision";
    description: string;
    deadline?: string;
    responded: boolean;
  }[];
  timeline: TimelineEvent[];
};

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const BASE_APPROVAL_LIKELIHOOD = 35;

export const initialCaseState: AttacheCase = {
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
  fees: { visaFee: 0, serviceFee: 0, vacFee: 0, total: 0, paid: false },
  embassyFollowUps: [],
  timeline: [],
};

// ---------------------------------------------------------------------------
// Case derivation — fold tool outputs into case state
// ---------------------------------------------------------------------------

function calculateApprovalLikelihood(
  base: number,
  recommendations: Recommendation[],
  status: CaseStatus,
): number {
  const resolvedImpact = recommendations
    .filter((r) => r.resolved)
    .reduce((sum, r) => sum + r.impact, 0);

  const statusBonus: Record<CaseStatus, number> = {
    intake: 0, route_selected: 5, checklist_ready: 5,
    documents_reviewed: 25, form_ready: 40, pack_ready: 50,
    review_passed: 65, appointment_set: 70, fees_paid: 70,
    submitted: 80, awaiting_biometrics: 80, processing: 85,
    decision_ready: 100,
  };

  return Math.min(99, Math.max(20, base + resolvedImpact + (statusBonus[status] || 0)));
}

function deriveNextStatus(
  current: CaseStatus,
  toolName: string,
  monitorStatus?: string,
): CaseStatus {
  const statusFlow: Record<string, CaseStatus> = {
    evaluateCase: "checklist_ready",
    uploadDocuments: "documents_reviewed",
    reviewAndPrepare: "pack_ready",
    runRiskReview: "review_passed",
    submitApplication: "submitted",
    approveSubmission: "submitted",
    monitorCase: monitorStatus === "rfe_issued"
      ? "awaiting_biometrics"
      : monitorStatus === "decision_made"
        ? "decision_ready"
        : "processing",
  };

  return statusFlow[toolName] || current;
}

function applyEvaluateCase(state: AttacheCase, output: EvaluateCaseOutput): Partial<AttacheCase> {
  return {
    visaType: output.visaType,
    destinationCountry: output.consulate.split(" ")[0] || state.destinationCountry,
    approvalLikelihood: output.baseLikelihood,
    fees: {
      visaFee: output.fees.visa,
      serviceFee: output.fees.service,
      vacFee: output.fees.vac,
      total: output.fees.total,
      paid: false,
    },
    documents: output.requiredDocuments.map((doc, i) => ({
      id: `doc-${i}`,
      name: doc.description,
      type: doc.type as AttacheDocument["type"],
      status: "missing" as const,
    })),
  };
}

function applyUploadDocuments(state: AttacheCase, output: UploadDocumentsOutput): Partial<AttacheCase> {
  const byType = new Map(output.documents.map((u) => [u.type, u]));
  return {
    documents: state.documents.map((d) =>
      byType.has(d.type)
        ? { ...d, status: "uploaded" as const, name: byType.get(d.type)?.name || d.name }
        : d
    ),
  };
}

function applyUploadDocument(state: AttacheCase, output: UploadDocumentOutput): Partial<AttacheCase> {
  return {
    documents: state.documents.map((d) =>
      d.type === output.document.type
        ? { ...d, status: "uploaded" as const, name: output.document.name || d.name }
        : d
    ),
  };
}

function applyReviewAndPrepare(state: AttacheCase, output: ReviewAndPrepareOutput): Partial<AttacheCase> {
  const reviewByType = new Map(output.documentReviews.map((r) => [r.type, r]));
  const documents = state.documents.map((d) => {
    const review = reviewByType.get(d.type);
    return review
      ? { ...d, status: review.status as AttacheDocument["status"], extractedData: review.extractedFields, riskFlags: review.issues.map((i) => i.message) }
      : d;
  });

  const existingIds = new Set(state.recommendations.map((r) => r.id));
  const freshRecs = (output.recommendations as Recommendation[]).filter((r) => !existingIds.has(r.id));

  return {
    documents,
    recommendations: [...state.recommendations, ...freshRecs],
    formCompletion: output.formData ? 100 : state.formCompletion,
    applicant: {
      ...state.applicant,
      fullName: output.formData.fullName || state.applicant.fullName,
      nationality: output.formData.nationality || state.applicant.nationality,
    },
    travel: {
      ...state.travel,
      purpose: (output.formData.purposeOfTravel as AttacheCase["travel"]["purpose"]) || state.travel.purpose,
      arrivalDate: output.formData.arrivalDate || state.travel.arrivalDate,
      departureDate: output.formData.departureDate || state.travel.departureDate,
      destinationCity: output.formData.destinationCity || state.travel.destinationCity,
    },
  };
}

function applyRunRiskReview(state: AttacheCase, output: RunRiskReviewOutput): Partial<AttacheCase> {
  const existingIds = new Set(state.recommendations.map((r) => r.id));
  const newRecs = (output.finalRecommendations as Recommendation[]).filter((r) => !existingIds.has(r.id));
  return { recommendations: [...state.recommendations, ...newRecs] };
}

function applySubmitApplication(state: AttacheCase, output: SubmitApplicationOutput): Partial<AttacheCase> {
  const refNum = output.referenceNumber || `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const appointments = output.appointmentDetails
    ? [...state.appointments, {
        type: "biometrics" as const,
        date: output.appointmentDetails.date,
        time: output.appointmentDetails.time,
        location: output.appointmentDetails.location,
        confirmed: true,
      }]
    : state.appointments;
  return {
    referenceNumber: refNum,
    fees: { ...state.fees, paid: true },
    appointments,
    timeline: [...state.timeline, { title: "Application Submitted", description: `Reference: ${refNum}`, time: new Date().toISOString(), status: "complete" as const }],
  };
}

function applyApproveSubmission(state: AttacheCase, output: ApproveSubmissionOutput): Partial<AttacheCase> {
  if (!output.approved) return {};
  return {
    timeline: [...state.timeline, {
      title: "Submission Approved by User",
      description: output.userNote || "User approved the application for submission.",
      time: new Date().toISOString(),
      status: "complete" as const,
    }],
  };
}

function applyMonitorCase(state: AttacheCase, output: MonitorCaseOutput): Partial<AttacheCase> {
  if (output.status === "rfe_issued" && output.rfeDetails) {
    return {
      embassyFollowUps: [...state.embassyFollowUps, {
        type: "rfe" as const,
        description: output.rfeDetails.explanation || "Additional documents required",
        deadline: output.rfeDetails.deadline,
        responded: false,
      }],
    };
  }
  if (output.status === "biometrics_scheduled") {
    return {
      embassyFollowUps: [...state.embassyFollowUps, {
        type: "biometrics_scheduled" as const,
        description: output.summary || "Biometrics appointment scheduled",
        responded: true,
      }],
    };
  }
  if (output.status === "decision_made" && output.decision) {
    return {
      timeline: [...state.timeline, {
        title: output.decision.outcome === "approved" ? "Visa Approved" : "Decision Received",
        description: `Outcome: ${output.decision.outcome}`,
        time: new Date().toISOString(),
        status: output.decision.outcome === "approved" ? "complete" as const : "alert" as const,
      }],
    };
  }
  return {};
}

type ToolOutputParser = {
  schema: { safeParse: (data: unknown) => { success: boolean; data?: unknown } };
  apply: (state: AttacheCase, output: never) => Partial<AttacheCase>;
  getMonitorStatus?: (output: never) => string | undefined;
};

const TOOL_PARSERS: Record<string, ToolOutputParser> = {
  evaluateCase: { schema: evaluateCaseOutputSchema, apply: applyEvaluateCase as ToolOutputParser["apply"] },
  uploadDocuments: { schema: uploadDocumentsOutputSchema, apply: applyUploadDocuments as ToolOutputParser["apply"] },
  uploadDocument: { schema: uploadDocumentOutputSchema, apply: applyUploadDocument as ToolOutputParser["apply"] },
  reviewAndPrepare: { schema: reviewAndPrepareOutputSchema, apply: applyReviewAndPrepare as ToolOutputParser["apply"] },
  runRiskReview: { schema: runRiskReviewOutputSchema, apply: applyRunRiskReview as ToolOutputParser["apply"] },
  submitApplication: { schema: submitApplicationOutputSchema, apply: applySubmitApplication as ToolOutputParser["apply"] },
  approveSubmission: { schema: approveSubmissionOutputSchema, apply: applyApproveSubmission as ToolOutputParser["apply"] },
  monitorCase: {
    schema: monitorCaseOutputSchema,
    apply: applyMonitorCase as ToolOutputParser["apply"],
    getMonitorStatus: ((output: MonitorCaseOutput) => output.status) as ToolOutputParser["getMonitorStatus"],
  },
};

export function deriveCase(messages: AttacheUIMessage[]): AttacheCase {
  const allParts = messages.flatMap((message) =>
    message.role === "assistant" ? (message.parts ?? []) : [],
  );

  const state = allParts.reduce<AttacheCase>((currentState, part) => {
    if (!isToolUIPart(part)) return currentState;
    if (part.state !== "output-available" || part.output == null) return currentState;

    const toolName = getToolName(part);
    const parser = TOOL_PARSERS[toolName];
    if (!parser) return currentState;

    const result = parser.schema.safeParse(part.output);
    if (!result.success) return currentState;

    const parsed = result.data as never;
    const updates = parser.apply(currentState, parsed);
    const monitorStatus = parser.getMonitorStatus?.(parsed);
    const updatedState = { ...currentState, ...updates };
    const nextStatus = deriveNextStatus(updatedState.status, toolName, monitorStatus);

    return nextStatus === updatedState.status
      ? updatedState
      : { ...updatedState, status: nextStatus };
  }, { ...initialCaseState });

  return {
    ...state,
    approvalLikelihood: calculateApprovalLikelihood(BASE_APPROVAL_LIKELIHOOD, state.recommendations, state.status),
  };
}

export function getCurrentStepIndex(status: CaseStatus): number {
  const order: CaseStatus[] = [
    "intake", "route_selected", "checklist_ready", "documents_reviewed",
    "form_ready", "pack_ready", "review_passed", "appointment_set",
    "fees_paid", "submitted", "awaiting_biometrics", "processing", "decision_ready",
  ];
  return order.indexOf(status);
}
