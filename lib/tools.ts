import { tool, type ToolExecutionOptions } from "ai";
import { z } from "zod";

// ==================== SERVER-EXECUTE TOOLS ====================
// These tools execute on the server and return mocked structured data

export const assessEligibilityTool = tool({
  description: "Assess visa eligibility based on applicant profile and travel purpose. Returns eligibility status, recommended visa type, and base approval likelihood.",
  inputSchema: z.object({
    nationality: z.string().describe("Applicant nationality"),
    residenceCountry: z.string().describe("Current country of residence"),
    purpose: z.enum(["tourism", "business", "study", "work", "family_visit", "transit"]).describe("Purpose of travel"),
    destinationCountry: z.string().describe("Destination country for visa"),
    travelDates: z.object({
      arrival: z.string(),
      departure: z.string(),
    }).describe("Planned travel dates"),
    employmentStatus: z.enum(["employed", "self_employed", "student", "unemployed", "retired"]).describe("Current employment status"),
    previousRefusals: z.boolean().describe("Any previous visa refusals"),
  }),
  outputSchema: z.object({
    eligible: z.boolean(),
    visaType: z.string(),
    destinationCountry: z.string(),
    baseLikelihood: z.number(),
    reasoning: z.string(),
    nextStep: z.literal("recommendVisaRoute"),
  }),
  execute: async ({ nationality, purpose, destinationCountry, employmentStatus, previousRefusals }, _options: ToolExecutionOptions) => {
    // Mock logic: employed applicants to tourist destinations have better odds
    const baseScore = employmentStatus === "employed" ? 45 : 35;
    const refusalPenalty = previousRefusals ? -15 : 0;
    const baseLikelihood = Math.max(20, Math.min(60, baseScore + refusalPenalty));

    return {
      eligible: true,
      visaType: purpose === "tourism" ? "Schengen Tourist Visa (C-type)" : "Business Visa",
      destinationCountry,
      baseLikelihood,
      reasoning: `${nationality} passport holders with ${employmentStatus} status traveling for ${purpose} to ${destinationCountry} are generally eligible. ${previousRefusals ? "Previous refusal may require additional documentation." : ""}`,
      nextStep: "recommendVisaRoute" as const,
    };
  },
});

export const recommendVisaRouteTool = tool({
  description: "Recommend the specific visa route, consulate jurisdiction, and processing timeline. Returns visa category, consulate details, and odds boost.",
  inputSchema: z.object({
    visaType: z.string().describe("Type of visa determined from eligibility"),
    destinationCountry: z.string().describe("Destination country"),
    residenceCity: z.string().describe("Current city of residence for jurisdiction"),
  }),
  outputSchema: z.object({
    visaCategory: z.enum(["tourist", "business", "student", "work", "family", "transit"]),
    consulate: z.string(),
    processingTime: z.string(),
    visaFee: z.number(),
    requirements: z.array(z.string()),
    oddsBoost: z.number(),
    nextStep: z.literal("buildChecklist"),
  }),
  execute: async ({ visaType: _visaType, destinationCountry, residenceCity }, _options: ToolExecutionOptions) => {
    const consulate = destinationCountry === "Germany" ? `${residenceCity} German Consulate` : `${residenceCity} ${destinationCountry} Consulate`;

    return {
      visaCategory: "tourist" as const,
      consulate,
      processingTime: "10-15 business days",
      visaFee: 80,
      requirements: [
        "Valid passport (6+ months validity, 2 blank pages)",
        "Recent passport photo (35x45mm, white background)",
        "Travel insurance (€30,000 coverage)",
        "Proof of accommodation",
        "Proof of financial means",
        "Employment verification",
        "Flight reservation",
        "Bank statements (3 months)",
      ],
      oddsBoost: 5,
      nextStep: "buildChecklist" as const,
    };
  },
});

export const buildChecklistTool = tool({
  description: "Generate a tailored document checklist based on visa type, nationality, and profile. Returns required and optional documents with critical flags.",
  inputSchema: z.object({
    visaCategory: z.enum(["tourist", "business", "student", "work", "family", "transit"]),
    nationality: z.string(),
    employmentStatus: z.enum(["employed", "self_employed", "student", "unemployed", "retired"]),
    familyInHomeCountry: z.boolean().describe("Has family ties in home country"),
    propertyOwned: z.boolean().describe("Owns property in home country"),
  }),
  outputSchema: z.object({
    requiredDocuments: z.array(z.object({
      type: z.string(),
      description: z.string(),
      critical: z.boolean(),
    })),
    optionalDocuments: z.array(z.string()),
    estimatedCompletionDays: z.number(),
    nextStep: z.literal("uploadDocuments"),
  }),
  execute: async ({ employmentStatus, familyInHomeCountry, propertyOwned }, _options: ToolExecutionOptions) => {
    const optionalDocs: string[] = [];
    if (!familyInHomeCountry) optionalDocs.push("Proof of intent to return (property deed if owned)");
    if (employmentStatus === "self_employed") optionalDocs.push("Business registration certificate");
    if (propertyOwned) optionalDocs.push("Property deed (strengthens ties to home country)");

    return {
      requiredDocuments: [
        { type: "passport", description: "Valid passport (6+ months validity)", critical: true },
        { type: "photo", description: "Recent passport photo 35x45mm", critical: true },
        { type: "insurance", description: "Travel insurance (€30,000 coverage)", critical: true },
        { type: "bank_statement", description: "Bank statements (last 3 months)", critical: true },
        { type: "employment_letter", description: "Employment verification letter", critical: true },
        { type: "hotel_booking", description: "Hotel reservation or invitation", critical: true },
        { type: "flight_itinerary", description: "Flight reservation", critical: false },
      ],
      optionalDocuments: optionalDocs,
      estimatedCompletionDays: 5,
      nextStep: "uploadDocuments" as const,
    };
  },
});

export const reviewDocumentsTool = tool({
  description: "Review uploaded documents, extract fields, verify validity, identify issues with impact on approval odds, and generate recommendations.",
  inputSchema: z.object({
    documentType: z.enum(["passport", "bank_statement", "employment_letter", "insurance", "hotel_booking", "flight_itinerary", "invitation_letter", "property_deed"]),
    documentId: z.string(),
    tripBudget: z.number().describe("Estimated trip cost in USD"),
    monthlyIncome: z.number().optional(),
  }),
  outputSchema: z.object({
    documentId: z.string(),
    extractedFields: z.record(z.string()),
    verificationStatus: z.enum(["verified", "needs_review", "rejected"]),
    issues: z.array(z.object({
      severity: z.enum(["critical", "warning", "info"]),
      message: z.string(),
      impact: z.number(),
    })),
    recommendations: z.array(z.object({
      id: z.string(),
      issue: z.string(),
      fix: z.string(),
      impact: z.number(),
      category: z.enum(["funds", "ties", "employment", "travel", "insurance", "consistency", "completeness"]),
    })),
  }),
  execute: async ({ documentType, documentId, tripBudget, monthlyIncome }, _options: ToolExecutionOptions) => {
    // Mock extraction and verification
    const mockExtractions: Record<string, Record<string, string>> = {
      passport: { number: "X12345678", expiry: "2027-03-15", nationality: "USA" },
      bank_statement: { balance: "12500", currency: "USD", avgBalance: "11000" },
      employment_letter: { employer: "Acme Corp", position: "Senior Engineer", salary: "8500/month" },
      insurance: { coverage: "50000", validFrom: "2024-01-15", validUntil: "2024-02-15" },
      hotel_booking: { hotel: "Hilton Berlin", checkin: "2024-01-20", checkout: "2024-01-25" },
    };

    const issues: { severity: "critical" | "warning" | "info"; message: string; impact: number }[] = [];
    const recommendations: { id: string; issue: string; fix: string; impact: number; category: "funds" | "ties" | "employment" | "travel" | "insurance" | "consistency" | "completeness" }[] = [];

    if (documentType === "bank_statement") {
      const balance = 12500;
      const coverageRatio = balance / tripBudget;
      if (coverageRatio < 1.5) {
        issues.push({ severity: "warning", message: `Bank balance covers ${coverageRatio.toFixed(1)}x trip cost (recommended: 2x)`, impact: -14 });
        recommendations.push({ id: "rec-funds-1", issue: "Insufficient funds coverage", fix: "Add secondary bank account or reduce trip duration/budget", impact: 12, category: "funds" });
      }
      if (monthlyIncome && balance < monthlyIncome * 3) {
        issues.push({ severity: "warning", message: "Bank balance below 3 months income (weak financial stability signal)", impact: -6 });
        recommendations.push({ id: "rec-funds-2", issue: "Low balance relative to income", fix: "Explain large recent deposits or add savings account statement", impact: 6, category: "funds" });
      }
    }

    if (documentType === "employment_letter" && !monthlyIncome) {
      issues.push({ severity: "warning", message: "Employment letter missing salary details", impact: -6 });
      recommendations.push({ id: "rec-employ-1", issue: "Employment letter incomplete", fix: "Request updated letter with salary and leave approval", impact: 6, category: "employment" });
    }

    if (documentType === "insurance") {
      issues.push({ severity: "info", message: "Insurance coverage verified at €50,000", impact: 0 });
    }

    return {
      documentId,
      extractedFields: mockExtractions[documentType] || {},
      verificationStatus: issues.some(i => i.severity === "critical") ? "needs_review" : "verified",
      issues,
      recommendations,
    };
  },
});

export const generateApplicationTool = tool({
  description: "Generate the visa application form with fields populated from reviewed documents. Checks consistency and returns the form data.",
  inputSchema: z.object({
    // Loose + optional: a nested record(record(string)) made the model loop
    // trying to satisfy the shape. The case state already carries the real
    // extracted fields, so this is best-effort context only.
    extractedData: z
      .record(z.unknown())
      .optional()
      .describe("Optional map of documentType -> {field: value} extracted from documents"),
    visaCategory: z.enum(["tourist", "business", "student", "work", "family", "transit"]),
    destinationCountry: z.string(),
  }),
  outputSchema: z.object({
    formData: z.record(z.string()),
    consistencyCheck: z.object({
      passed: z.boolean(),
      mismatches: z.array(z.string()),
    }),
    estimatedApprovalOdds: z.number(),
    nextStep: z.literal("prepareSupportingPack"),
  }),
  execute: async ({ extractedData, visaCategory }, _options: ToolExecutionOptions) => {
    const data = (extractedData ?? {}) as Record<string, Record<string, string> | undefined>;
    const passport = data.passport ?? {};
    const bank = data.bank_statement ?? {};
    const employment = data.employment_letter ?? {};
    const hotel = data.hotel_booking ?? {};

    const formData = {
      fullName: passport.nationality === "USA" ? "John Doe" : "Applicant Name",
      passportNumber: passport.number || "",
      nationality: passport.nationality || "",
      dateOfBirth: "1985-06-15",
      purposeOfTravel: visaCategory,
      destinationAddress: hotel.hotel || "TBD",
      arrivalDate: "2024-01-20",
      departureDate: "2024-01-25",
      fundingSource: employment.employer ? "Employment income" : "Savings",
      occupation: employment.position || "",
      employerName: employment.employer || "",
    };

    const mismatches: string[] = [];
    if (bank.currency && bank.currency !== "EUR" && bank.currency !== "USD") {
      mismatches.push("Bank currency not in EUR/USD - may require conversion proof");
    }

    return {
      formData,
      consistencyCheck: {
        passed: mismatches.length === 0,
        mismatches,
      },
      estimatedApprovalOdds: 68,
      nextStep: "prepareSupportingPack" as const,
    };
  },
});

export const prepareSupportingPackTool = tool({
  description: "Generate supporting documents: cover letter, travel itinerary, and proof of ties. These strengthen the case and boost approval odds.",
  inputSchema: z.object({
    applicantProfile: z.object({
      fullName: z.string(),
      employmentStatus: z.string(),
      employer: z.string().optional(),
      familyInHomeCountry: z.boolean(),
      propertyOwned: z.boolean(),
    }),
    travelDetails: z.object({
      purpose: z.string(),
      destinationCity: z.string(),
      arrivalDate: z.string(),
      departureDate: z.string(),
      invitingParty: z.string().optional(),
    }),
    financialSummary: z.object({
      bankBalance: z.number(),
      monthlyIncome: z.number(),
      coverageRatio: z.number(),
    }),
  }),
  outputSchema: z.object({
    coverLetter: z.string(),
    itinerary: z.string(),
    proofOfTies: z.array(z.string()),
    oddsBoost: z.number(),
    nextStep: z.literal("runRiskReview"),
  }),
  execute: async ({ applicantProfile, travelDetails, financialSummary }, _options: ToolExecutionOptions) => {
    const coverLetter = `Dear Consul,

I am writing to apply for a Schengen visa for tourism purposes. I am a ${applicantProfile.employmentStatus} ${applicantProfile.employer ? `at ${applicantProfile.employer}` : ""} with strong ties to my home country including ${applicantProfile.familyInHomeCountry ? "family" : ""} ${applicantProfile.propertyOwned ? "and property ownership" : ""}.

My travel dates are ${travelDetails.arrivalDate} to ${travelDetails.departureDate}, and I have sufficient funds (coverage ratio: ${financialSummary.coverageRatio.toFixed(1)}x) for this trip.

I have traveled previously and always complied with visa conditions. I request you to grant me a visa for the requested period.

Sincerely,
${applicantProfile.fullName}`;

    const itinerary = `Day 1 (${travelDetails.arrivalDate}): Arrival in ${travelDetails.destinationCity}, check-in
Day 2: City center exploration, Brandenburg Gate
Day 3: Museum Island tour
Day 4: Day trip to Potsdam
Day 5 (${travelDetails.departureDate}): Departure`;

    const proofOfTies: string[] = [];
    if (applicantProfile.familyInHomeCountry) proofOfTies.push("Family ties: Spouse and children residing in home country");
    if (applicantProfile.propertyOwned) proofOfTies.push("Property: Home ownership documented");
    proofOfTies.push(`Employment: ${applicantProfile.employmentStatus} with return-to-work commitment`);

    return {
      coverLetter,
      itinerary,
      proofOfTies,
      oddsBoost: 10,
      nextStep: "runRiskReview" as const,
    };
  },
});

export const runRiskReviewTool = tool({
  description: "Final risk assessment before submission. Analyzes all factors, calculates final approval likelihood, identifies any remaining high-impact fixes.",
  inputSchema: z.object({
    caseData: z.record(z.unknown()).describe("Full case state including documents, financials, and previous recommendations"),
  }),
  outputSchema: z.object({
    riskScore: z.number(),
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
  }),
  execute: async ({ caseData }, _options: ToolExecutionOptions) => {
    // Mock risk assessment - in real app, this would analyze all case data
    void caseData; // Used in real implementation
    return {
      riskScore: 28,
      categoryScores: {
        funds: 75,
        ties: 80,
        employment: 85,
        travel: 90,
        insurance: 100,
        consistency: 95,
      },
      finalRecommendations: [
        { id: "rec-final-1", issue: "Bank balance could be stronger", fix: "Add savings account statement", impact: 8, category: "funds" },
        { id: "rec-final-2", issue: "Cover letter could emphasize ties more", fix: "Add property details to cover letter", impact: 5, category: "ties" },
      ],
      approvalLikelihood: 85,
      readyToSubmit: true,
      nextStep: "bookAppointment" as const,
    };
  },
});

export const bookAppointmentTool = tool({
  description: "Book VAC biometrics appointment. Returns appointment details and what to bring.",
  inputSchema: z.object({
    consulate: z.string(),
    preferredDateRange: z.object({ start: z.string(), end: z.string() }),
  }),
  outputSchema: z.object({
    appointmentType: z.enum(["biometrics", "interview"]),
    date: z.string(),
    time: z.string(),
    location: z.string(),
    confirmationCode: z.string(),
    whatToBring: z.array(z.string()),
    oddsBoost: z.number(),
    nextStep: z.literal("payFees"),
  }),
  execute: async ({ consulate }, _options: ToolExecutionOptions) => {
    return {
      appointmentType: "biometrics" as const,
      date: "2024-01-10",
      time: "10:30 AM",
      location: `${consulate} VAC - 123 Main St`,
      confirmationCode: "VAC-2024-01-10-X7K9M2",
      whatToBring: [
        "Passport (original)",
        "Appointment confirmation (printed)",
        "Visa application form (signed)",
        "Passport photo (if not uploaded)",
        "Document checklist (completed)",
      ],
      oddsBoost: 5,
      nextStep: "payFees" as const,
    };
  },
});

export const trackEmbassyUpdatesTool = tool({
  description: "Poll for embassy/VAC updates including RFEs, biometrics scheduling, and processing status. This is called after submission.",
  inputSchema: z.object({
    referenceNumber: z.string(),
    currentStatus: z.string(),
  }),
  outputSchema: z.object({
    status: z.enum(["awaiting_biometrics", "rfe_issued", "admin_processing", "decision_made"]),
    message: z.string(),
    actionRequired: z.boolean(),
    deadline: z.string().optional(),
    rfeDetails: z.object({
      missingItem: z.string(),
      explanation: z.string(),
    }).optional(),
  }),
  execute: async ({ referenceNumber: _referenceNumber, currentStatus }, _options: ToolExecutionOptions) => {
    // Simulate progression through states
    if (currentStatus === "submitted") {
      return {
        status: "awaiting_biometrics" as const,
        message: "Application received. Biometrics appointment required.",
        actionRequired: true,
      };
    }
    if (currentStatus === "awaiting_biometrics") {
      return {
        status: "rfe_issued" as const,
        message: "Request for Evidence issued - additional documentation required",
        actionRequired: true,
        deadline: "2024-01-20",
        rfeDetails: {
          missingItem: "Travel insurance policy document",
          explanation: "Submitted insurance certificate appears to be a booking confirmation, not the actual policy document. Please upload the full policy with coverage details.",
        },
      };
    }
    if (currentStatus === "processing") {
      return {
        status: "decision_made" as const,
        message: "Visa decision has been made. Passport ready for collection.",
        actionRequired: false,
      };
    }
    return {
      status: "admin_processing" as const,
      message: "Application under administrative processing.",
      actionRequired: false,
    };
  },
});

const trackDecisionInputSchema = z.object({
  referenceNumber: z.string(),
});

const trackDecisionOutputSchema = z.object({
  decision: z.enum(["approved", "refused", "additional_processing"]),
  referenceNumber: z.string(),
  validityPeriod: z.string().optional(),
  entries: z.enum(["single", "double", "multiple"]).optional(),
  refusalReasons: z.array(z.string()).optional(),
  nextSteps: z.string(),
});

type TrackDecisionInput = z.infer<typeof trackDecisionInputSchema>;
type TrackDecisionOutput = z.infer<typeof trackDecisionOutputSchema>;

export const trackDecisionTool = tool<TrackDecisionInput, TrackDecisionOutput>({
  description: "Retrieve final visa decision after processing is complete.",
  inputSchema: trackDecisionInputSchema,
  outputSchema: trackDecisionOutputSchema,
  execute: async ({ referenceNumber }, _options: ToolExecutionOptions) => {
    // Mock approval for demo
    return {
      decision: "approved" as const,
      referenceNumber,
      validityPeriod: "2024-01-15 to 2024-07-15",
      entries: "multiple" as const,
      nextSteps: "Collect passport from VAC with visa sticker. Check visa details match your travel dates. Keep supporting documents for border entry.",
    };
  },
});

// ==================== CLIENT-INTERACTION TOOLS ====================
// These tools have NO execute function - they render UI and wait for user action

const uploadDocumentsOutputSchema = z.object({
  success: z.boolean(),
  uploadedCount: z.number(),
  documents: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    status: z.literal("uploaded"),
  })),
});

const payFeesOutputSchema = z.object({
  success: z.boolean(),
  paymentRef: z.string(),
  amount: z.number(),
  paidAt: z.string(),
});

const submitFilingOutputSchema = z.object({
  success: z.boolean(),
  approved: z.boolean(),
  referenceNumber: z.string(),
  submittedAt: z.string(),
});

const provideMissingInsuranceOutputSchema = z.object({
  success: z.boolean(),
  documentId: z.string(),
  documentType: z.literal("insurance"),
  verified: z.boolean(),
});

export const uploadDocumentsTool = tool({
  description: "UI tool: Prompt user to upload required documents. Displays document uploader interface and waits for uploads.",
  inputSchema: z.object({
    requiredTypes: z.array(z.enum(["passport", "bank_statement", "employment_letter", "insurance", "hotel_booking", "flight_itinerary", "invitation_letter", "property_deed"])),
    criticalDocuments: z.array(z.string()).describe("Document types that are critical and must be uploaded"),
  }),
  outputSchema: uploadDocumentsOutputSchema,
  // No execute - client-side UI tool
});

export const payFeesTool = tool({
  description: "UI tool: Display fee breakdown and collect payment confirmation. Shows visa fee, service fee, VAC fee with mocked payment flow.",
  inputSchema: z.object({
    visaFee: z.number(),
    serviceFee: z.number(),
    vacFee: z.number(),
    total: z.number(),
  }),
  outputSchema: payFeesOutputSchema,
  // No execute - client-side UI tool
});

export const submitFilingTool = tool({
  description: "UI tool: HUMAN-IN-THE-LOOP approval gate. Display final application for user review and explicit approval before mock submission. Shows approval likelihood and requires explicit user confirmation.",
  inputSchema: z.object({
    applicationSummary: z.record(z.unknown()).describe("Summary of application for user review"),
    approvalLikelihood: z.number(),
    finalRecommendations: z.array(z.object({
      issue: z.string(),
      fix: z.string(),
      impact: z.number(),
    })),
  }),
  outputSchema: submitFilingOutputSchema,
  // No execute - client-side UI tool requiring user approval
});

export const provideMissingInsuranceTool = tool({
  description: "UI tool: RFE response loop. Display the embassy's request for missing insurance document and allow user to upload the corrected document.",
  inputSchema: z.object({
    rfeDetails: z.object({
      missingItem: z.string(),
      explanation: z.string(),
    }),
    deadline: z.string(),
  }),
  outputSchema: provideMissingInsuranceOutputSchema,
  // No execute - client-side UI tool for RFE response
});

// ==================== TOOL REGISTRY ====================

export const germainServerTools = {
  assessEligibility: assessEligibilityTool,
  recommendVisaRoute: recommendVisaRouteTool,
  buildChecklist: buildChecklistTool,
  reviewDocuments: reviewDocumentsTool,
  generateApplication: generateApplicationTool,
  prepareSupportingPack: prepareSupportingPackTool,
  runRiskReview: runRiskReviewTool,
  bookAppointment: bookAppointmentTool,
  trackEmbassyUpdates: trackEmbassyUpdatesTool,
  trackDecision: trackDecisionTool,
};

export const germainClientTools = {
  uploadDocuments: uploadDocumentsTool,
  payFees: payFeesTool,
  submitFiling: submitFilingTool,
  provideMissingInsurance: provideMissingInsuranceTool,
};

export const germainTools = {
  ...germainServerTools,
  ...germainClientTools,
};

export type GermainTools = typeof germainTools;
export type GermainClientToolName = keyof typeof germainClientTools;
export type UploadDocumentsOutput = z.infer<typeof uploadDocumentsOutputSchema>;
export type PayFeesOutput = z.infer<typeof payFeesOutputSchema>;
export type SubmitFilingOutput = z.infer<typeof submitFilingOutputSchema>;
export type ProvideMissingInsuranceOutput = z.infer<typeof provideMissingInsuranceOutputSchema>;

export type GermainClientToolResult =
  | { tool: "uploadDocuments"; toolCallId: string; output: UploadDocumentsOutput }
  | { tool: "payFees"; toolCallId: string; output: PayFeesOutput }
  | { tool: "submitFiling"; toolCallId: string; output: SubmitFilingOutput }
  | { tool: "provideMissingInsurance"; toolCallId: string; output: ProvideMissingInsuranceOutput };
