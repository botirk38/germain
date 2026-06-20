import { tool, type ToolExecutionOptions } from "ai";
import { z } from "zod";

// Schengen visa-required nationalities (simplified representative list)
const VISA_REQUIRED_COUNTRIES = new Set([
  "Afghanistan", "Algeria", "Angola", "Bangladesh", "Belarus", "Cameroon",
  "China", "Congo", "Cuba", "Egypt", "Ethiopia", "Ghana", "India", "Indonesia",
  "Iran", "Iraq", "Jordan", "Kenya", "Lebanon", "Libya", "Mali", "Morocco",
  "Myanmar", "Nepal", "Nigeria", "Pakistan", "Philippines", "Russia",
  "Saudi Arabia", "Senegal", "Somalia", "South Africa", "Sri Lanka", "Sudan",
  "Syria", "Thailand", "Tunisia", "Turkey", "Ukraine", "Vietnam", "Yemen",
  "Zimbabwe",
]);

// Visa-exempt nationalities (Schengen short stay)
const VISA_EXEMPT_COUNTRIES = new Set([
  "USA", "United States", "Canada", "Australia", "New Zealand", "Japan",
  "South Korea", "Brazil", "Argentina", "Chile", "Mexico", "United Kingdom",
  "UK", "Singapore", "Malaysia", "Israel", "UAE", "United Arab Emirates",
]);

// Fee schedules by destination (EUR)
const FEE_SCHEDULES: Record<string, { visa: number; service: number; vac: number }> = {
  Germany: { visa: 80, service: 20, vac: 12 },
  France: { visa: 80, service: 25, vac: 15 },
  Italy: { visa: 80, service: 20, vac: 10 },
  Spain: { visa: 80, service: 22, vac: 12 },
  Netherlands: { visa: 80, service: 18, vac: 10 },
  // Default Schengen
  default: { visa: 80, service: 20, vac: 12 },
};

// Processing times by destination
const PROCESSING_TIMES: Record<string, string> = {
  Germany: "10-15 business days",
  France: "7-15 business days",
  Italy: "10-20 business days",
  Spain: "10-15 business days",
  default: "10-15 business days",
};

// Employment scoring
const EMPLOYMENT_SCORES: Record<string, number> = {
  employed: 45,
  self_employed: 40,
  student: 35,
  retired: 30,
  unemployed: 20,
};

// Base documents by visa category
const BASE_DOCUMENTS: Record<string, Array<{ type: string; description: string; critical: boolean }>> = {
  tourist: [
    { type: "passport", description: "Valid passport (6+ months validity, 2 blank pages)", critical: true },
    { type: "photo", description: "Recent passport photo 35x45mm, white background", critical: true },
    { type: "insurance", description: "Travel insurance (minimum 30,000 EUR coverage)", critical: true },
    { type: "bank_statement", description: "Bank statements (last 3 months)", critical: true },
    { type: "employment_letter", description: "Employment verification letter with salary", critical: true },
    { type: "hotel_booking", description: "Hotel reservation or invitation letter", critical: true },
    { type: "flight_itinerary", description: "Flight reservation (round trip)", critical: false },
  ],
  business: [
    { type: "passport", description: "Valid passport (6+ months validity, 2 blank pages)", critical: true },
    { type: "photo", description: "Recent passport photo 35x45mm, white background", critical: true },
    { type: "insurance", description: "Travel insurance (minimum 30,000 EUR coverage)", critical: true },
    { type: "bank_statement", description: "Bank statements (last 3 months)", critical: true },
    { type: "employment_letter", description: "Employment verification letter", critical: true },
    { type: "invitation_letter", description: "Business invitation from host company", critical: true },
    { type: "flight_itinerary", description: "Flight reservation (round trip)", critical: false },
  ],
  student: [
    { type: "passport", description: "Valid passport (6+ months validity, 2 blank pages)", critical: true },
    { type: "photo", description: "Recent passport photo 35x45mm, white background", critical: true },
    { type: "insurance", description: "Travel insurance (minimum 30,000 EUR coverage)", critical: true },
    { type: "bank_statement", description: "Bank statements or sponsor letter", critical: true },
    { type: "invitation_letter", description: "University admission letter", critical: true },
    { type: "flight_itinerary", description: "Flight reservation", critical: false },
  ],
  work: [
    { type: "passport", description: "Valid passport (6+ months validity, 2 blank pages)", critical: true },
    { type: "photo", description: "Recent passport photo 35x45mm, white background", critical: true },
    { type: "insurance", description: "Travel insurance (minimum 30,000 EUR coverage)", critical: true },
    { type: "bank_statement", description: "Bank statements (last 3 months)", critical: true },
    { type: "employment_letter", description: "Employment contract from host country employer", critical: true },
  ],
  family: [
    { type: "passport", description: "Valid passport (6+ months validity, 2 blank pages)", critical: true },
    { type: "photo", description: "Recent passport photo 35x45mm, white background", critical: true },
    { type: "insurance", description: "Travel insurance (minimum 30,000 EUR coverage)", critical: true },
    { type: "bank_statement", description: "Bank statements or sponsor letter", critical: true },
    { type: "invitation_letter", description: "Invitation letter from family member", critical: true },
    { type: "marriage_certificate", description: "Proof of family relationship", critical: true },
    { type: "flight_itinerary", description: "Flight reservation", critical: false },
  ],
  transit: [
    { type: "passport", description: "Valid passport (6+ months validity)", critical: true },
    { type: "photo", description: "Recent passport photo 35x45mm", critical: true },
    { type: "flight_itinerary", description: "Confirmed onward flight ticket", critical: true },
  ],
};

const PURPOSE_TO_CATEGORY: Record<string, string> = {
  tourism: "tourist",
  business: "business",
  study: "student",
  work: "work",
  family_visit: "family",
  transit: "transit",
};

export const evaluateCaseTool = tool({
  description: "Evaluate visa eligibility, select the correct visa route, and generate a tailored document checklist. This is the first tool to call for any new visa case. Replaces assessEligibility + recommendVisaRoute + buildChecklist.",
  inputSchema: z.object({
    nationality: z.string().describe("Applicant nationality / passport country"),
    residenceCountry: z.string().describe("Current country of residence"),
    residenceCity: z.string().describe("Current city of residence for consulate jurisdiction"),
    purpose: z.enum(["tourism", "business", "study", "work", "family_visit", "transit"]),
    destinationCountry: z.string().describe("Destination country for visa"),
    travelDates: z.object({
      arrival: z.string(),
      departure: z.string(),
    }),
    employmentStatus: z.enum(["employed", "self_employed", "student", "unemployed", "retired"]),
    previousRefusals: z.boolean(),
    familyInHomeCountry: z.boolean(),
    propertyOwned: z.boolean(),
  }),
  outputSchema: z.object({
    eligible: z.boolean(),
    visaType: z.string(),
    visaCategory: z.enum(["tourist", "business", "student", "work", "family", "transit"]),
    consulate: z.string(),
    processingTime: z.string(),
    fees: z.object({
      visa: z.number(),
      service: z.number(),
      vac: z.number(),
      total: z.number(),
    }),
    baseLikelihood: z.number(),
    reasoning: z.string(),
    requiredDocuments: z.array(z.object({
      type: z.string(),
      description: z.string(),
      critical: z.boolean(),
    })),
    optionalDocuments: z.array(z.string()),
  }),
  execute: async (input, _options: ToolExecutionOptions) => {
    const {
      nationality, residenceCountry, residenceCity, purpose,
      destinationCountry, employmentStatus, previousRefusals,
      familyInHomeCountry, propertyOwned,
    } = input;

    // Eligibility assessment
    const needsVisa = VISA_REQUIRED_COUNTRIES.has(nationality);
    const isExempt = VISA_EXEMPT_COUNTRIES.has(nationality);

    // For transit, some nationalities don't need airport transit visa
    const eligible = purpose === "transit" ? true : (needsVisa || !isExempt || true);

    // Visa type determination
    const category = PURPOSE_TO_CATEGORY[purpose] || "tourist";
    const visaType = purpose === "transit"
      ? "Airport Transit Visa (A-type)"
      : purpose === "work" || purpose === "study"
        ? `National Visa (D-type) — ${purpose}`
        : `Schengen Short-Stay Visa (C-type) — ${purpose}`;

    // Employment score
    const employmentScore = EMPLOYMENT_SCORES[employmentStatus] ?? 30;

    // Refusal penalty
    const refusalPenalty = previousRefusals ? -15 : 0;

    // Ties bonus
    const tiesBonus = (familyInHomeCountry ? 5 : 0) + (propertyOwned ? 5 : 0);

    // Base likelihood
    const baseLikelihood = Math.min(65, Math.max(15, employmentScore + refusalPenalty + tiesBonus));

    // Consulate jurisdiction
    const consulate = `${destinationCountry} Consulate, ${residenceCity}`;

    // Fees
    const feeSchedule = FEE_SCHEDULES[destinationCountry] ?? FEE_SCHEDULES.default;
    const fees = {
      ...feeSchedule,
      total: feeSchedule.visa + feeSchedule.service + feeSchedule.vac,
    };

    // Processing time
    const processingTime = PROCESSING_TIMES[destinationCountry] ?? PROCESSING_TIMES.default;

    // Documents
    const requiredDocuments = [...(BASE_DOCUMENTS[category] ?? BASE_DOCUMENTS.tourist)];

    // Add employment-specific documents
    if (employmentStatus === "self_employed") {
      requiredDocuments.push({
        type: "property_deed",
        description: "Business registration certificate",
        critical: true,
      });
    }

    // Optional documents
    const optionalDocuments: string[] = [];
    if (propertyOwned) {
      optionalDocuments.push("Property deed (strengthens ties to home country)");
    }
    if (!familyInHomeCountry) {
      optionalDocuments.push("Proof of intent to return (property deed, ongoing education enrollment)");
    }
    if (previousRefusals) {
      optionalDocuments.push("Explanation letter addressing previous refusal");
      optionalDocuments.push("Additional evidence of ties to home country");
    }

    // Reasoning
    const reasons: string[] = [];
    reasons.push(`${nationality} passport holders ${needsVisa ? "require" : "may require"} a visa for ${destinationCountry}.`);
    reasons.push(`Employment status (${employmentStatus}) contributes a base score of ${employmentScore}.`);
    if (previousRefusals) reasons.push("Previous visa refusal applies a -15 penalty. Additional documentation recommended.");
    if (familyInHomeCountry) reasons.push("Family ties in home country strengthen the case (+5).");
    if (propertyOwned) reasons.push("Property ownership in home country strengthens ties (+5).");
    reasons.push(`Jurisdiction: ${residenceCity}, ${residenceCountry}.`);

    return {
      eligible,
      visaType,
      visaCategory: category as "tourist" | "business" | "student" | "work" | "family" | "transit",
      consulate,
      processingTime,
      fees,
      baseLikelihood,
      reasoning: reasons.join(" "),
      requiredDocuments,
      optionalDocuments,
    };
  },
});
