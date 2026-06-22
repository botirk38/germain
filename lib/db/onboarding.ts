import { z } from "zod";

const optionalText = z.union([z.literal(""), z.string().trim().min(1).max(160)]).optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalIncome = z.union([z.literal(""), z.coerce.number().min(0).max(1_000_000)]).optional()
  .transform((value) => (value === "" ? undefined : value));

export const onboardingSchema = z.object({
  applicantFullName: z.string().trim().min(1, "Full legal name is required.").max(160),
  applicantNationality: z.string().trim().min(1, "Passport country is required.").max(80),
  applicantResidenceCountry: z.string().trim().min(1, "Country of residence is required.").max(80),
  applicantResidenceCity: z.string().trim().min(1, "Residence city is required.").max(80),
  applicantEmploymentStatus: z.enum(["employed", "self_employed", "student", "unemployed", "retired"], {
    message: "Employment status is required.",
  }),
  applicantEmployer: optionalText,
  applicantJobTitle: optionalText,
  applicantMonthlyIncome: optionalIncome,
  destinationCountry: z.string().trim().min(1, "Destination country is required.").max(80),
  destinationCity: optionalText,
  travelPurpose: z.enum(["tourism", "business", "study", "work", "family_visit", "transit"], {
    message: "Travel purpose is required.",
  }),
  arrivalDate: z.string().date("Arrival date is required."),
  departureDate: z.string().date("Departure date is required."),
  familyInHomeCountry: z.boolean(),
  propertyOwned: z.boolean(),
  previousRefusals: z.boolean(),
}).refine((data) => data.departureDate > data.arrivalDate, {
  message: "Departure must be after arrival.",
  path: ["departureDate"],
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingData = z.output<typeof onboardingSchema>;

export const onboardingDefaults = {
  applicantFullName: "",
  applicantNationality: "",
  applicantResidenceCountry: "",
  applicantResidenceCity: "",
  applicantEmploymentStatus: undefined,
  applicantEmployer: "",
  applicantJobTitle: "",
  applicantMonthlyIncome: "",
  destinationCountry: "",
  destinationCity: "",
  travelPurpose: undefined,
  arrivalDate: "",
  departureDate: "",
  familyInHomeCountry: false,
  propertyOwned: false,
  previousRefusals: false,
};
