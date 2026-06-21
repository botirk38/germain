import { defineTool } from "eve/tools";
import { defineState } from "eve/context";
import { z } from "zod";

const employmentStatusSchema = z.enum(["employed", "self_employed", "student", "unemployed", "retired"]);
const travelPurposeSchema = z.enum(["tourism", "business", "study", "work", "family_visit", "transit"]);

const profileFieldSchema = z.object({
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  residenceCountry: z.string().optional(),
  residenceCity: z.string().optional(),
  employmentStatus: employmentStatusSchema.optional(),
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  monthlyIncome: z.number().optional(),
  destinationCountry: z.string().optional(),
  purpose: travelPurposeSchema.optional(),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  destinationCity: z.string().optional(),
  familyInHomeCountry: z.boolean().optional(),
  propertyOwned: z.boolean().optional(),
  previousRefusals: z.boolean().optional(),
});

type ProfileFields = z.infer<typeof profileFieldSchema>;

type CaseState = {
  readonly id: string;
  readonly visaType: string;
  readonly destinationCountry: string;
  readonly status: string;
  readonly approvalLikelihood: number;
  readonly recommendations: readonly unknown[];
  readonly applicant: {
    readonly fullName?: string;
    readonly nationality?: string;
    readonly residenceCountry?: string;
    readonly residenceCity?: string;
    readonly employmentStatus?: z.infer<typeof employmentStatusSchema>;
    readonly employer?: string;
    readonly jobTitle?: string;
    readonly monthlyIncome?: number;
    readonly propertyOwned?: boolean;
    readonly familyInHomeCountry?: boolean;
    readonly previousRefusals?: boolean;
  };
  readonly travel: {
    readonly purpose?: z.infer<typeof travelPurposeSchema>;
    readonly arrivalDate?: string;
    readonly departureDate?: string;
    readonly destinationCity?: string;
  };
  readonly financials: Record<string, unknown>;
  readonly documents: readonly unknown[];
  readonly missingFields: readonly string[];
  readonly riskFlags: readonly string[];
  readonly formCompletion: number;
  readonly appointments: readonly unknown[];
  readonly fees: { readonly visaFee: number; readonly serviceFee: number; readonly vacFee: number; readonly total: number; readonly paid: boolean };
  readonly embassyFollowUps: readonly unknown[];
  readonly timeline: readonly unknown[];
};

type OnboardingState = {
  readonly collectedFields: ProfileFields;
  readonly requestedDocuments: readonly string[];
  readonly completed: boolean;
};

function initialCaseState(): CaseState {
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

function initialOnboardingState(): OnboardingState {
  return { collectedFields: {}, requestedDocuments: [], completed: false };
}

const caseState = defineState<CaseState>("attache.case", initialCaseState);
const onboardingState = defineState<OnboardingState>("attache.onboarding", initialOnboardingState);

function buildCaseFromProfile(existing: CaseState, profile: ProfileFields): Partial<CaseState> {
  return {
    applicant: {
      ...existing.applicant,
      fullName: profile.fullName ?? existing.applicant.fullName,
      nationality: profile.nationality ?? existing.applicant.nationality,
      residenceCountry: profile.residenceCountry ?? existing.applicant.residenceCountry,
      residenceCity: profile.residenceCity ?? existing.applicant.residenceCity,
      employmentStatus: profile.employmentStatus ?? existing.applicant.employmentStatus,
      employer: profile.employer ?? existing.applicant.employer,
      jobTitle: profile.jobTitle ?? existing.applicant.jobTitle,
      monthlyIncome: profile.monthlyIncome ?? existing.applicant.monthlyIncome,
      propertyOwned: profile.propertyOwned ?? existing.applicant.propertyOwned,
      familyInHomeCountry: profile.familyInHomeCountry ?? existing.applicant.familyInHomeCountry,
      previousRefusals: profile.previousRefusals ?? existing.applicant.previousRefusals,
    },
    travel: {
      ...existing.travel,
      purpose: profile.purpose ?? existing.travel.purpose,
      arrivalDate: profile.arrivalDate ?? existing.travel.arrivalDate,
      departureDate: profile.departureDate ?? existing.travel.departureDate,
      destinationCity: profile.destinationCity ?? existing.travel.destinationCity,
    },
    destinationCountry: profile.destinationCountry ?? existing.destinationCountry,
  };
}

function missingRequiredFields(profile: ProfileFields): string[] {
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
  return required.filter((key) => profile[key] === undefined || profile[key] === null);
}

const inputSchema = z.object({
  fields: profileFieldSchema,
});

export default defineTool({
  description:
    "Save a batch of validated profile fields collected during onboarding. " +
    "Call this after gathering a group of related fields. Updates both onboarding and case state.",
  inputSchema,
  async execute({ fields }) {
    const onboarding = onboardingState.get();
    const merged = { ...onboarding.collectedFields, ...fields };

    onboardingState.update((s) => ({ ...s, collectedFields: merged }));

    caseState.update((s) => ({ ...s, ...buildCaseFromProfile(s, merged) }));

    const savedFields = Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key]) => key);

    const remainingFields = missingRequiredFields(merged);
    const isComplete = remainingFields.length === 0;

    if (isComplete) {
      onboardingState.update((s) => ({ ...s, completed: true }));
      caseState.update((s) => ({
        ...s,
        status: s.status === "intake" ? "route_selected" : s.status,
      }));
    }

    return {
      saved: true,
      savedFields,
      remainingFields,
      isComplete,
      case_state: caseState.get(),
      onboarding_state: onboardingState.get(),
    };
  },
});
