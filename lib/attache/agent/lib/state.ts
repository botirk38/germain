import { defineState } from "eve/context";
import { z } from "zod";

export const caseStatusSchema = z.enum([
  "intake",
  "route_selected",
  "checklist_ready",
  "documents_reviewed",
  "form_ready",
  "pack_ready",
  "review_passed",
  "appointment_set",
  "fees_paid",
  "preparing_submission",
  "submitted",
  "awaiting_biometrics",
  "processing",
  "decision_ready",
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
  "missing",
  "requested",
  "uploaded",
  "needs_review",
  "verified",
  "rejected",
]);

export const profileFieldSchema = z.object({
  fullName: z.string().trim().min(1).max(160).optional(),
  nationality: z.string().trim().min(1).max(80).optional(),
  residenceCountry: z.string().trim().min(1).max(80).optional(),
  residenceCity: z.string().trim().min(1).max(80).optional(),
  employmentStatus: employmentStatusSchema.optional(),
  employer: z.string().trim().min(1).max(160).optional(),
  jobTitle: z.string().trim().min(1).max(120).optional(),
  monthlyIncome: z.number().min(0).max(1_000_000).optional(),
  destinationCountry: z.string().trim().min(1).max(80).optional(),
  purpose: travelPurposeSchema.optional(),
  arrivalDate: z.string().date().optional(),
  departureDate: z.string().date().optional(),
  destinationCity: z.string().trim().min(1).max(80).optional(),
  familyInHomeCountry: z.boolean().optional(),
  propertyOwned: z.boolean().optional(),
  previousRefusals: z.boolean().optional(),
});

export type CaseStatus = z.infer<typeof caseStatusSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;
export type TravelPurpose = z.infer<typeof travelPurposeSchema>;
export type ProfileFields = z.infer<typeof profileFieldSchema>;

export type Document = {
  readonly id: string;
  readonly type: DocumentType;
  readonly name: string;
  readonly status: DocumentStatus;
  readonly storageKey?: string;
  readonly extractedData?: Record<string, string>;
  readonly riskFlags?: readonly string[];
};

export type TimelineEvent = {
  readonly title: string;
  readonly description: string;
  readonly time: string;
  readonly status?: "pending" | "complete" | "alert";
};

export type CaseState = {
  readonly id: string;
  readonly visaType: string;
  readonly destinationCountry: string;
  readonly status: CaseStatus;
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
  readonly documents: readonly Document[];
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

export type OnboardingState = {
  readonly collectedFields: ProfileFields;
  readonly requestedDocuments: readonly DocumentType[];
  readonly completed: boolean;
};

export function initialCaseState(): CaseState {
  return {
    id: `case-${Date.now()}`,
    visaType: "",
    destinationCountry: "",
    status: "intake",
    approvalLikelihood: 35,
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
}

export function initialOnboardingState(): OnboardingState {
  return { collectedFields: {}, requestedDocuments: [], completed: false };
}

export const caseState = defineState<CaseState>("attache.case", initialCaseState);
export const onboardingState = defineState<OnboardingState>("attache.onboarding", initialOnboardingState);

export function missingRequiredFields(profile: ProfileFields): string[] {
  const required: Array<keyof ProfileFields> = [
    "fullName",
    "nationality",
    "residenceCountry",
    "residenceCity",
    "employmentStatus",
    "destinationCountry",
    "purpose",
    "arrivalDate",
    "departureDate",
  ];
  return required.filter((key) => profile[key] === undefined || profile[key] === null || profile[key] === "");
}
