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
  | "preparing_submission"
  | "submitted"
  | "awaiting_biometrics"
  | "processing"
  | "decision_ready";

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
  | "missing"
  | "requested"
  | "uploaded"
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

export type FollowUp = {
  readonly type: "rfe" | "biometrics_scheduled" | "admin_processing" | "decision";
  readonly description: string;
  readonly deadline?: string;
  readonly responded: boolean;
};

export type CaseState = {
  readonly id: string;
  readonly visaType: string;
  readonly destinationCountry: string;
  readonly status: CaseStatus;
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

export type OnboardingState = {
  readonly collectedFields: ProfileFields;
  readonly requestedDocuments: readonly DocumentType[];
  readonly completed: boolean;
};
