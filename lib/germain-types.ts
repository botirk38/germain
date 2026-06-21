// Visa agency workflow statuses
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

export type GermainDocument = {
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
  impact: number; // percentage points of approval likelihood
  resolved: boolean;
  category: "funds" | "ties" | "employment" | "travel" | "insurance" | "consistency" | "completeness";
};

export type GermainTimelineEvent = {
  title: string;
  description: string;
  time: string;
  status?: "pending" | "complete" | "alert";
};

export type GermainCase = {
  id: string;
  visaType: string;
  destinationCountry: string;
  status: CaseStatus;
  // Core acceptance metric
  approvalLikelihood: number; // 0-100, base 35% + resolved recommendation impacts
  recommendations: Recommendation[];
  // Applicant profile
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
  // Travel details
  travel: {
    purpose?: "tourism" | "business" | "study" | "work" | "family_visit" | "transit";
    arrivalDate?: string;
    departureDate?: string;
    destinationCity?: string;
    hotelAddress?: string;
    invitingParty?: string;
    previousVisits?: number;
  };
  // Financials
  financials: {
    bankBalance?: number;
    tripBudget?: number;
    coverageRatio?: number; // bankBalance / tripBudget
    salaryCreditsConsistent?: boolean;
  };
  // Documents and risk
  documents: GermainDocument[];
  missingFields: string[];
  riskFlags: string[];
  formCompletion: number;
  // Processing
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
  // Embassy/VAC follow-ups
  embassyFollowUps: {
    type: "rfe" | "biometrics_scheduled" | "admin_processing" | "decision";
    description: string;
    deadline?: string;
    responded: boolean;
  }[];
  timeline: GermainTimelineEvent[];
};


