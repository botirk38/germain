import { tool, type ToolExecutionOptions } from "ai";
import { z } from "zod";

const documentInputSchema = z.object({
  type: z.string(),
  name: z.string(),
  storageKey: z.string().optional(),
});

const issueSchema = z.object({
  severity: z.enum(["critical", "warning", "info"]),
  message: z.string(),
  impact: z.number(),
});

const recommendationSchema = z.object({
  id: z.string(),
  issue: z.string(),
  fix: z.string(),
  impact: z.number(),
  category: z.enum(["funds", "ties", "employment", "travel", "insurance", "consistency", "completeness"]),
});

export const reviewAndPrepareOutputSchema = z.object({
  documentReviews: z.array(z.object({
    type: z.string(),
    status: z.enum(["verified", "needs_review", "rejected"]),
    extractedFields: z.record(z.string()),
    issues: z.array(issueSchema),
  })),
  formData: z.record(z.string()),
  consistencyCheck: z.object({
    passed: z.boolean(),
    mismatches: z.array(z.string()),
  }),
  coverLetter: z.string(),
  itinerary: z.string(),
  proofOfTies: z.array(z.string()),
  recommendations: z.array(recommendationSchema),
  approvalLikelihood: z.number(),
});

export type ReviewAndPrepareOutput = z.infer<typeof reviewAndPrepareOutputSchema>;

export const reviewAndPrepareTool = tool({
  description: "Review all uploaded documents, verify validity, generate the application form from case data, and prepare supporting documents (cover letter, itinerary, proof of ties). Call this after documents are uploaded.",
  inputSchema: z.object({
    documents: z.array(documentInputSchema),
    applicantProfile: z.object({
      fullName: z.string(),
      nationality: z.string(),
      residenceCountry: z.string(),
      employmentStatus: z.string(),
      employer: z.string().optional(),
      jobTitle: z.string().optional(),
      monthlyIncome: z.number().optional(),
      familyInHomeCountry: z.boolean(),
      propertyOwned: z.boolean(),
    }),
    travelDetails: z.object({
      purpose: z.string(),
      destinationCountry: z.string(),
      destinationCity: z.string(),
      arrivalDate: z.string(),
      departureDate: z.string(),
    }),
    tripBudget: z.number().describe("Estimated total trip cost in EUR"),
    bankBalance: z.number().optional().describe("Known bank balance if available"),
  }),
  outputSchema: reviewAndPrepareOutputSchema,
  execute: async (input, _options: ToolExecutionOptions) => {
    const { documents, applicantProfile, travelDetails, tripBudget, bankBalance } = input;
    const recommendations: z.infer<typeof recommendationSchema>[] = [];
    let likelihood = 50; // Starting point after evaluation

    // Review each document
    const documentReviews = documents.map((doc) => {
      const issues: z.infer<typeof issueSchema>[] = [];
      const extractedFields: Record<string, string> = { type: doc.type, fileName: doc.name };

      switch (doc.type) {
        case "passport": {
          extractedFields.holder = applicantProfile.fullName;
          extractedFields.nationality = applicantProfile.nationality;
          // Can't actually read the passport without OCR, but verify it was provided
          issues.push({ severity: "info", message: "Passport uploaded. Verify manually that it has 6+ months validity and 2 blank pages.", impact: 0 });
          break;
        }
        case "bank_statement": {
          const balance = bankBalance ?? 0;
          extractedFields.balance = String(balance);
          const coverageRatio = tripBudget > 0 ? balance / tripBudget : 0;
          extractedFields.coverageRatio = coverageRatio.toFixed(2);

          if (coverageRatio < 1.5 && balance > 0) {
            issues.push({ severity: "warning", message: `Bank balance covers ${coverageRatio.toFixed(1)}x trip cost (recommended: 2x minimum).`, impact: -14 });
            recommendations.push({ id: "rec-funds-1", issue: "Insufficient funds coverage", fix: "Add secondary bank account or reduce trip duration and budget", impact: 12, category: "funds" });
          } else if (balance === 0) {
            issues.push({ severity: "warning", message: "Bank balance not verified. Provide recent statements showing adequate funds.", impact: -10 });
            recommendations.push({ id: "rec-funds-0", issue: "Bank balance not verified", fix: "Upload 3 months of bank statements showing consistent balance", impact: 10, category: "funds" });
          } else {
            issues.push({ severity: "info", message: `Bank balance covers ${coverageRatio.toFixed(1)}x trip cost. Adequate.`, impact: 0 });
            likelihood += 5;
          }
          break;
        }
        case "employment_letter": {
          extractedFields.employer = applicantProfile.employer ?? "Not specified";
          extractedFields.position = applicantProfile.jobTitle ?? "Not specified";
          if (applicantProfile.monthlyIncome) {
            extractedFields.salary = `${applicantProfile.monthlyIncome}/month`;
          }
          if (!applicantProfile.employer) {
            issues.push({ severity: "warning", message: "Employment letter missing employer details.", impact: -6 });
            recommendations.push({ id: "rec-employ-1", issue: "Employment letter incomplete", fix: "Request updated letter with employer name, salary, and leave approval", impact: 6, category: "employment" });
          }
          break;
        }
        case "insurance": {
          issues.push({ severity: "info", message: "Insurance document uploaded. Verify coverage is minimum 30,000 EUR and covers full trip duration plus Schengen territory.", impact: 0 });
          break;
        }
        case "hotel_booking": {
          extractedFields.destination = travelDetails.destinationCity;
          issues.push({ severity: "info", message: "Accommodation booking uploaded.", impact: 0 });
          break;
        }
        case "flight_itinerary": {
          extractedFields.route = `${applicantProfile.residenceCountry} → ${travelDetails.destinationCountry}`;
          issues.push({ severity: "info", message: "Flight itinerary uploaded.", impact: 0 });
          break;
        }
        default: {
          issues.push({ severity: "info", message: `${doc.type} document uploaded.`, impact: 0 });
        }
      }

      const hasCritical = issues.some((i) => i.severity === "critical");
      const hasWarning = issues.some((i) => i.severity === "warning");
      const status = hasCritical ? "rejected" as const : hasWarning ? "needs_review" as const : "verified" as const;

      return { type: doc.type, status, extractedFields, issues };
    });

    // Generate application form data from profile
    const formData: Record<string, string> = {
      fullName: applicantProfile.fullName,
      nationality: applicantProfile.nationality,
      residenceCountry: applicantProfile.residenceCountry,
      employmentStatus: applicantProfile.employmentStatus,
      employer: applicantProfile.employer ?? "",
      jobTitle: applicantProfile.jobTitle ?? "",
      purposeOfTravel: travelDetails.purpose,
      destinationCountry: travelDetails.destinationCountry,
      destinationCity: travelDetails.destinationCity,
      arrivalDate: travelDetails.arrivalDate,
      departureDate: travelDetails.departureDate,
      fundingSource: applicantProfile.employer ? "Employment income" : "Personal savings",
    };

    // Consistency check
    const mismatches: string[] = [];
    // Check date consistency
    const arrival = new Date(travelDetails.arrivalDate);
    const departure = new Date(travelDetails.departureDate);
    if (arrival >= departure) {
      mismatches.push("Arrival date is on or after departure date.");
    }
    const tripDays = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
    if (tripDays > 90) {
      mismatches.push("Trip exceeds 90-day Schengen short-stay limit. May need a national visa (D-type).");
    }

    // Cover letter
    const tiesDescription = [
      applicantProfile.familyInHomeCountry ? "family in my home country" : "",
      applicantProfile.propertyOwned ? "property ownership" : "",
      applicantProfile.employer ? `stable employment at ${applicantProfile.employer}` : "",
    ].filter(Boolean).join(", ");

    const coverLetter = `Dear Consul,

I am writing to apply for a Schengen visa for ${travelDetails.purpose} purposes. I am ${applicantProfile.employmentStatus === "employed" ? `employed as ${applicantProfile.jobTitle || "a professional"} at ${applicantProfile.employer || "my employer"}` : applicantProfile.employmentStatus} and a citizen of ${applicantProfile.nationality}, currently residing in ${applicantProfile.residenceCountry}.

My planned travel dates are ${travelDetails.arrivalDate} to ${travelDetails.departureDate} (${tripDays} days) in ${travelDetails.destinationCity}, ${travelDetails.destinationCountry}.

I have strong ties to my home country${tiesDescription ? `, including ${tiesDescription}` : ""}, and I intend to return upon completion of my trip. I have arranged adequate financial means and travel insurance for the duration of my stay.

I respectfully request that you consider my application favourably.

Sincerely,
${applicantProfile.fullName}`;

    // Itinerary
    const itineraryDays: string[] = [];
    for (let i = 0; i < Math.min(tripDays, 14); i++) {
      const date = new Date(arrival);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      if (i === 0) {
        itineraryDays.push(`${dateStr}: Arrival in ${travelDetails.destinationCity}, check-in`);
      } else if (i === tripDays - 1) {
        itineraryDays.push(`${dateStr}: Check-out and departure`);
      } else {
        itineraryDays.push(`${dateStr}: ${travelDetails.destinationCity} — sightseeing and activities`);
      }
    }
    if (tripDays > 14) {
      itineraryDays.push(`... (${tripDays - 14} additional days in ${travelDetails.destinationCity})`);
    }

    // Proof of ties
    const proofOfTies: string[] = [];
    if (applicantProfile.familyInHomeCountry) {
      proofOfTies.push("Family ties: immediate family members residing in home country");
    }
    if (applicantProfile.propertyOwned) {
      proofOfTies.push("Property ownership: real estate in home country");
    }
    if (applicantProfile.employer) {
      proofOfTies.push(`Employment: ${applicantProfile.employmentStatus} at ${applicantProfile.employer} with return-to-work commitment`);
    }
    if (proofOfTies.length === 0) {
      proofOfTies.push("Consider providing additional evidence of ties to home country");
      recommendations.push({
        id: "rec-ties-1",
        issue: "Weak ties to home country",
        fix: "Provide evidence of family, property, or ongoing commitments in home country",
        impact: 10,
        category: "ties",
      });
    }

    // Adjust likelihood based on document review
    const issueImpact = documentReviews
      .flatMap((r) => r.issues)
      .reduce((sum, i) => sum + i.impact, 0);
    likelihood = Math.min(85, Math.max(25, likelihood + issueImpact));

    return {
      documentReviews,
      formData,
      consistencyCheck: { passed: mismatches.length === 0, mismatches },
      coverLetter,
      itinerary: itineraryDays.join("\n"),
      proofOfTies,
      recommendations,
      approvalLikelihood: likelihood,
    };
  },
});
