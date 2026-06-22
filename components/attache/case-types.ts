export type CaseStatus =
  | "intake_started"
  | "intake_completed"
  | "route_assessed"
  | "checklist_generated"
  | "documents_requested"
  | "documents_partially_received"
  | "documents_received"
  | "document_review_in_progress"
  | "document_review_failed"
  | "document_review_passed"
  | "case_strengthening"
  | "application_pack_prepared"
  | "portal_draft_requested"
  | "portal_draft_ready"
  | "final_submission_requested"
  | "submitted"
  | "biometrics_requested"
  | "additional_documents_requested"
  | "processing"
  | "decision_ready"
  | "closed";

export type CandidateStatus =
  | "getting_started"
  | "building_plan"
  | "waiting_for_documents"
  | "reviewing_documents"
  | "strengthening_case"
  | "preparing_application"
  | "waiting_for_approval"
  | "submitted"
  | "monitoring_decision"
  | "action_needed"
  | "completed";

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

export type DocumentStatus =
  | "requested"
  | "uploaded"
  | "processing"
  | "needs_review"
  | "verified"
  | "rejected";

export type EmploymentStatus =
  | "employed"
  | "self_employed"
  | "student"
  | "unemployed"
  | "retired";

export type TravelPurpose =
  | "tourism"
  | "business"
  | "study"
  | "work"
  | "family_visit"
  | "transit";

export type RecommendationCategory =
  | "funds"
  | "ties"
  | "employment"
  | "travel"
  | "insurance"
  | "consistency"
  | "completeness";

export type Recommendation = {
  readonly id: string;
  readonly issue: string;
  readonly fix: string;
  readonly impact: number;
  readonly resolved: boolean;
  readonly category: RecommendationCategory;
};

export type CandidateAction = {
  readonly id: string;
  readonly type: string;
  readonly status: "open" | "completed" | "cancelled";
  readonly title: string;
  readonly description?: string;
  readonly ctaLabel?: string;
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

export type Document = {
  readonly id: string;
  readonly type: DocumentType;
  readonly name: string;
  readonly status: DocumentStatus;
  readonly storageKey?: string;
  readonly extractedData?: Record<string, unknown>;
  readonly riskFlags?: readonly string[];
};

export type TimelineEvent = {
  readonly title: string;
  readonly description: string;
  readonly time: string;
  readonly status?: "pending" | "complete" | "alert";
};

export type FollowUp = {
  readonly type: "rfe" | "biometrics_scheduled" | "admin_processing" | "decision";
  readonly description: string;
  readonly deadline?: string;
  readonly responded: boolean;
};

export type CaseState = {
  readonly id: string;
  readonly visaCaseId?: string;
  readonly visaType: string;
  readonly destinationCountry: string;
  readonly status: CaseStatus;
  readonly candidateStatus: CandidateStatus;
  readonly approvalLikelihood: number;
  readonly recommendations: readonly Recommendation[];
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
  readonly financials: {
    readonly bankBalance?: number;
    readonly tripBudget?: number;
    readonly coverageRatio?: number;
    readonly salaryCreditsConsistent?: boolean;
  };
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
  readonly embassyFollowUps: readonly FollowUp[];
  readonly timeline: readonly TimelineEvent[];
};

export type ProfileFields = {
  readonly fullName?: string;
  readonly nationality?: string;
  readonly residenceCountry?: string;
  readonly residenceCity?: string;
  readonly employmentStatus?: EmploymentStatus;
  readonly employer?: string;
  readonly jobTitle?: string;
  readonly monthlyIncome?: number;
  readonly destinationCountry?: string;
  readonly purpose?: TravelPurpose;
  readonly arrivalDate?: string;
  readonly departureDate?: string;
  readonly destinationCity?: string;
  readonly familyInHomeCountry?: boolean;
  readonly propertyOwned?: boolean;
  readonly previousRefusals?: boolean;
};
