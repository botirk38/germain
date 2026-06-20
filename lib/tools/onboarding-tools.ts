import { tool } from "ai";
import { z } from "zod";

const profileFieldSchema = z.object({
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  residenceCountry: z.string().optional(),
  residenceCity: z.string().optional(),
  employmentStatus: z.enum(["employed", "self_employed", "student", "unemployed", "retired"]).optional(),
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  monthlyIncome: z.number().optional(),
  destinationCountry: z.string().optional(),
  purpose: z.enum(["tourism", "business", "study", "work", "family_visit", "transit"]).optional(),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  destinationCity: z.string().optional(),
  familyInHomeCountry: z.boolean().optional(),
  propertyOwned: z.boolean().optional(),
  previousRefusals: z.boolean().optional(),
});

export type ProfileFields = z.infer<typeof profileFieldSchema>;

export const saveProfileTool = tool({
  description: "Save a batch of validated profile fields collected from the conversation. Call this after gathering a group of related fields.",
  inputSchema: z.object({
    fields: profileFieldSchema,
  }),
  outputSchema: z.object({
    saved: z.boolean(),
    savedFields: z.array(z.string()),
    remainingFields: z.array(z.string()),
  }),
  execute: async ({ fields }) => {
    // Determine which fields were provided
    const savedFields = Object.entries(fields)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k]) => k);

    const allRequired = [
      "fullName", "nationality", "residenceCountry", "residenceCity",
      "employmentStatus", "destinationCountry", "purpose",
      "arrivalDate", "departureDate",
    ];

    const remaining = allRequired.filter((f) => !savedFields.includes(f));

    return {
      saved: true,
      savedFields,
      remainingFields: remaining,
    };
  },
});

const requestDocumentOutputSchema = z.object({
  uploaded: z.boolean(),
  documentType: z.string(),
  fileName: z.string(),
});

export const requestDocumentTool = tool({
  description: "Prompt the user to upload a document. Renders a file upload interface and waits for the user to attach the file.",
  inputSchema: z.object({
    documentType: z.enum(["passport", "photo", "bank_statement", "employment_letter", "insurance"]),
    reason: z.string().describe("Brief explanation of why this document is needed"),
  }),
  outputSchema: requestDocumentOutputSchema,
  // No execute — client-side UI tool
});

export const completeOnboardingTool = tool({
  description: "Mark the onboarding as complete. Call this once all key profile fields have been collected. Returns a summary and triggers redirect to the main console.",
  inputSchema: z.object({
    profileSummary: z.record(z.unknown()).describe("Summary of all collected profile fields"),
  }),
  outputSchema: z.object({
    completed: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ profileSummary }) => {
    // In production: save to Clerk user.publicMetadata.onboarded = true
    // and store full profile in user.publicMetadata.profile
    void profileSummary;
    return {
      completed: true,
      message: "Profile complete. Redirecting to the console.",
    };
  },
});

export const onboardingTools = {
  saveProfile: saveProfileTool,
  requestDocument: requestDocumentTool,
  completeOnboarding: completeOnboardingTool,
};

export type OnboardingTools = typeof onboardingTools;
export type RequestDocumentOutput = z.infer<typeof requestDocumentOutputSchema>;
