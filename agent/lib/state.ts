import { defineState } from "eve/context";
import { z } from "zod";

export const caseStatusSchema = z.enum([
  "intake_started",
  "intake_completed",
  "route_assessed",
  "checklist_generated",
  "documents_requested",
  "documents_partially_received",
  "documents_received",
  "document_review_in_progress",
  "document_review_failed",
  "document_review_passed",
  "case_strengthening",
  "application_pack_prepared",
  "portal_draft_requested",
  "portal_draft_ready",
  "final_submission_requested",
  "submitted",
  "biometrics_requested",
  "additional_documents_requested",
  "processing",
  "decision_ready",
  "closed",
]);

export const candidateStatusSchema = z.enum([
  "getting_started",
  "building_plan",
  "waiting_for_documents",
  "reviewing_documents",
  "strengthening_case",
  "preparing_application",
  "waiting_for_approval",
  "submitted",
  "monitoring_decision",
  "action_needed",
  "completed",
]);

export const employmentStatusSchema = z.enum([
  "employed",
  "self_employed",
  "student",
  "unemployed",
  "retired",
]);

export const travelPurposeSchema = z.enum([
  "tourism",
  "business",
  "study",
  "work",
  "family_visit",
  "transit",
]);

export const documentTypeSchema = z.enum([
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

export const documentStatusSchema = z.enum([
  "requested",
  "uploaded",
  "processing",
  "needs_review",
  "verified",
  "rejected",
]);

export type CaseStatus = z.infer<typeof caseStatusSchema>;
export type CandidateStatus = z.infer<typeof candidateStatusSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;
export type TravelPurpose = z.infer<typeof travelPurposeSchema>;

export type CandidateAction = {
  readonly id: string;
  readonly type: string;
  readonly status: "open" | "completed" | "cancelled";
  readonly title: string;
  readonly description?: string;
  readonly ctaLabel?: string;
};

export type Document = {
  readonly id: string;
  readonly type: DocumentType;
  readonly name: string;
  readonly status: DocumentStatus;
  readonly storageKey?: string;
  readonly extractedData?: Record<string, unknown>;
  readonly riskFlags?: readonly string[];
};

export type DocumentRequirement = {
  readonly id: string;
  readonly type: DocumentType;
  readonly label: string;
  readonly reason: string;
  readonly guidance?: string;
  readonly required: boolean;
  readonly status: "requested" | "satisfied" | "waived" | "rejected";
};

export type TimelineEvent = {
  readonly title: string;
  readonly description: string;
  readonly time: string;
  readonly status?: "pending" | "complete" | "alert";
};

export type CaseState = {
  readonly id: string;
  readonly visaCaseId?: string;
  readonly visaType: string;
  readonly destinationCountry: string;
  readonly status: CaseStatus;
  readonly candidateStatus: CandidateStatus;
  readonly approvalLikelihood: number;
  readonly recommendations: readonly unknown[];
  readonly applicant: {
    readonly fullName?: string;
    readonly nationality?: string;
    readonly passportNumber?: string;
    readonly dateOfBirth?: string;
    readonly residenceCountry?: string;
    readonly residenceCity?: string;
    readonly employmentStatus?: EmploymentStatus;
    readonly employer?: string;
    readonly jobTitle?: string;
    readonly monthlyIncome?: number;
    readonly propertyOwned?: boolean;
    readonly familyInHomeCountry?: boolean;
    readonly previousRefusals?: boolean;
  };
  readonly travel: {
    readonly purpose?: TravelPurpose;
    readonly arrivalDate?: string;
    readonly departureDate?: string;
    readonly destinationCity?: string;
    readonly hotelAddress?: string;
    readonly invitingParty?: string;
    readonly previousVisits?: number;
  };
  readonly financials: Record<string, unknown>;
  readonly documentRequirements: readonly DocumentRequirement[];
  readonly documents: readonly Document[];
  readonly candidateActions: readonly CandidateAction[];
  readonly missingFields: readonly string[];
  readonly riskFlags: readonly string[];
  readonly formCompletion: number;
  readonly referenceNumber?: string;
  readonly portalUrl?: string;
  readonly browserUseSessionId?: string;
  readonly submissionPreview?: {
    readonly liveViewUrl: string;
    readonly status: "completed" | "partial" | "failed";
    readonly formFieldsFilled: number;
    readonly referenceNumber?: string;
    readonly appointmentDate?: string;
    readonly appointmentTime?: string;
    readonly appointmentLocation?: string;
    readonly confirmationCode?: string;
    readonly paymentConfirmation?: string;
    readonly errors?: readonly string[];
  };
  readonly appointments: readonly {
    readonly type: "biometrics" | "interview";
    readonly date: string;
    readonly time: string;
    readonly location: string;
    readonly confirmed: boolean;
  }[];
  readonly fees: {
    readonly visaFee: number;
    readonly serviceFee: number;
    readonly vacFee: number;
    readonly total: number;
    readonly paid: boolean;
  };
  readonly embassyFollowUps: readonly unknown[];
  readonly timeline: readonly TimelineEvent[];
};

export function initialCaseState(): CaseState {
  return {
    id: `case-${Date.now()}`,
    visaType: "",
    destinationCountry: "",
    status: "intake_started",
    candidateStatus: "getting_started",
    approvalLikelihood: 35,
    recommendations: [],
    applicant: {},
    travel: {},
    financials: {},
    documentRequirements: [],
    documents: [],
    candidateActions: [],
    missingFields: [],
    riskFlags: [],
    formCompletion: 0,
    appointments: [],
    fees: { visaFee: 0, serviceFee: 0, vacFee: 0, total: 0, paid: false },
    embassyFollowUps: [],
    timeline: [],
  };
}

export const caseState = defineState<CaseState>("attache.case", initialCaseState);
