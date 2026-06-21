import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  caseState,
  missingRequiredFields,
  onboardingState,
  profileFieldSchema,
  type CaseState,
  type ProfileFields,
} from "../lib/state";

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

const inputSchema = z.object({
  fields: profileFieldSchema.refine(
    (fields) => !fields.arrivalDate || !fields.departureDate || fields.departureDate > fields.arrivalDate,
    { message: "departureDate must be after arrivalDate" },
  ),
});

const outputSchema = z.object({
  saved: z.boolean(),
  saved_fields: z.array(z.string()),
  remaining_fields: z.array(z.string()),
  is_complete: z.boolean(),
  case_state: z.unknown(),
  onboarding_state: z.unknown(),
});

export default defineTool({
  description:
    "Persist validated onboarding profile fields into durable case state. Use for state writes only, not for eligibility reasoning.",
  inputSchema,
  outputSchema,
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
      saved_fields: savedFields,
      remaining_fields: remainingFields,
      is_complete: isComplete,
      case_state: caseState.get(),
      onboarding_state: onboardingState.get(),
    };
  },
  toModelOutput(output) {
    return {
      type: "json",
      value: {
        saved: output.saved,
        saved_fields: output.saved_fields,
        remaining_fields: output.remaining_fields,
        is_complete: output.is_complete,
      },
    };
  },
});
