import { z } from "zod";

export const onboardingSchema = z.object({
  passportOriginalFilename: z.string().trim().min(1, "Passport filename is required.").max(240),
  passportStorageKey: z.string().url("Passport upload URL is required.").optional(),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingData = z.output<typeof onboardingSchema>;

export const onboardingDefaults = {
  passportOriginalFilename: "",
} satisfies OnboardingInput;
