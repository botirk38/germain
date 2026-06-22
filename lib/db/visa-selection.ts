import { z } from "zod";

export const enabledVisaOptions = [
  {
    countryCode: "FR",
    countryName: "France",
    flag: "🇫🇷",
    visaType: "schengen_short_stay_visitor",
    travelPurpose: "tourism",
    title: "Schengen short-stay visitor",
    description: "For tourism, family visits, and short private stays across the Schengen area.",
  },
] as const;

const enabledVisaTypeValues = enabledVisaOptions.map((option) => option.visaType) as [
  typeof enabledVisaOptions[number]["visaType"],
];

export const visaSelectionSchema = z.object({
  destinationCountry: z.enum(["France"]),
  visaType: z.enum(enabledVisaTypeValues),
});

export type VisaSelectionInput = z.infer<typeof visaSelectionSchema>;

export function findEnabledVisaOption(input: VisaSelectionInput) {
  return enabledVisaOptions.find(
    (option) => option.countryName === input.destinationCountry && option.visaType === input.visaType,
  );
}
