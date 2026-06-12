import { z } from "zod";

// 12-step visa agency + VAC workflow
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
  status: "missing" | "uploaded" | "needs_review" | "verified";
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

// Tool output schemas (Zod) for type-safe tool results
export const EligibilityOutputSchema = z.object({
  eligible: z.boolean(),
  visaType: z.string(),
  destinationCountry: z.string(),
  baseLikelihood: z.number(),
  reasoning: z.string(),
  nextStep: z.literal("recommendVisaRoute"),
});

export const VisaRouteOutputSchema = z.object({
  visaCategory: z.enum(["tourist", "business", "student", "work", "family", "transit"]),
  consulate: z.string(),
  processingTime: z.string(),
  visaFee: z.number(),
  requirements: z.array(z.string()),
  oddsBoost: z.number(),
  nextStep: z.literal("buildChecklist"),
});

export const ChecklistOutputSchema = z.object({
  requiredDocuments: z.array(z.object({
    type: z.string(),
    description: z.string(),
    critical: z.boolean(),
  })),
  optionalDocuments: z.array(z.string()),
  estimatedCompletionDays: z.number(),
  nextStep: z.literal("uploadDocuments"),
});

export const DocumentReviewOutputSchema = z.object({
  documentId: z.string(),
  extractedFields: z.record(z.string()),
  verificationStatus: z.enum(["verified", "needs_review", "rejected"]),
  issues: z.array(z.object({
    severity: z.enum(["critical", "warning", "info"]),
    message: z.string(),
    impact: z.number(), // negative impact on approval odds
  })),
  recommendations: z.array(z.object({
    id: z.string(),
    issue: z.string(),
    fix: z.string(),
    impact: z.number(),
    category: z.enum(["funds", "ties", "employment", "travel", "insurance", "consistency", "completeness"]),
  })),
});

export const ApplicationOutputSchema = z.object({
  formData: z.record(z.string()),
  consistencyCheck: z.object({
    passed: z.boolean(),
    mismatches: z.array(z.string()),
  }),
  estimatedApprovalOdds: z.number(),
  nextStep: z.literal("prepareSupportingPack"),
});

export const SupportingPackOutputSchema = z.object({
  coverLetter: z.string(),
  itinerary: z.string(),
  proofOfTies: z.array(z.string()),
  oddsBoost: z.number(),
  nextStep: z.literal("runRiskReview"),
});

export const RiskReviewOutputSchema = z.object({
  riskScore: z.number(), // 0-100, lower is better
  categoryScores: z.record(z.number()),
  finalRecommendations: z.array(z.object({
    id: z.string(),
    issue: z.string(),
    fix: z.string(),
    impact: z.number(),
    category: z.enum(["funds", "ties", "employment", "travel", "insurance", "consistency", "completeness"]),
  })),
  approvalLikelihood: z.number(),
  readyToSubmit: z.boolean(),
  nextStep: z.union([z.literal("bookAppointment"), z.literal("resolveIssues")]),
});

export const AppointmentOutputSchema = z.object({
  appointmentType: z.enum(["biometrics", "interview"]),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  confirmationCode: z.string(),
  whatToBring: z.array(z.string()),
  oddsBoost: z.number(),
  nextStep: z.literal("payFees"),
});

export const EmbassyUpdateOutputSchema = z.object({
  status: z.enum(["awaiting_biometrics", "rfe_issued", "admin_processing", "decision_made"]),
  message: z.string(),
  actionRequired: z.boolean(),
  deadline: z.string().optional(),
  rfeDetails: z.object({
    missingItem: z.string(),
    explanation: z.string(),
  }).optional(),
});

export const DecisionOutputSchema = z.object({
  decision: z.enum(["approved", "refused", "additional_processing"]),
  referenceNumber: z.string(),
  validityPeriod: z.string().optional(),
  entries: z.enum(["single", "double", "multiple"]).optional(),
  refusalReasons: z.array(z.string()).optional(),
  nextSteps: z.string(),
});

export type EligibilityOutput = z.infer<typeof EligibilityOutputSchema>;
export type VisaRouteOutput = z.infer<typeof VisaRouteOutputSchema>;
export type ChecklistOutput = z.infer<typeof ChecklistOutputSchema>;
export type DocumentReviewOutput = z.infer<typeof DocumentReviewOutputSchema>;
export type ApplicationOutput = z.infer<typeof ApplicationOutputSchema>;
export type SupportingPackOutput = z.infer<typeof SupportingPackOutputSchema>;
export type RiskReviewOutput = z.infer<typeof RiskReviewOutputSchema>;
export type AppointmentOutput = z.infer<typeof AppointmentOutputSchema>;
export type EmbassyUpdateOutput = z.infer<typeof EmbassyUpdateOutputSchema>;
export type DecisionOutput = z.infer<typeof DecisionOutputSchema>;
