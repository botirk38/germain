import { tool, type ToolExecutionOptions } from "ai";
import { z } from "zod";
import { evaluateCaseTool } from "./tools/evaluate-case";
import { reviewAndPrepareTool } from "./tools/review-and-prepare";
import { submitApplicationTool, approveSubmissionTool } from "./tools/submit-application";
import { monitorCaseTool } from "./tools/monitor-case";

// ==================== SERVER-EXECUTE TOOLS ====================

// Re-export consolidated tools
export { evaluateCaseTool } from "./tools/evaluate-case";
export { reviewAndPrepareTool } from "./tools/review-and-prepare";
export { monitorCaseTool } from "./tools/monitor-case";

// runRiskReview — kept as standalone, de-mocked
export const runRiskReviewTool = tool({
  description: "Final risk assessment before submission. Analyzes all case factors, calculates final approval likelihood, and identifies remaining high-impact fixes. Call after reviewAndPrepare.",
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
    nextStep: z.union([z.literal("submitApplication"), z.literal("resolveIssues")]),
  }),
  execute: async ({ caseData }, _options: ToolExecutionOptions) => {
    const data = caseData as Record<string, unknown>;

    // Extract scores from case data
    const documents = (data.documents as Array<Record<string, unknown>>) ?? [];
    const recommendations = (data.recommendations as Array<Record<string, unknown>>) ?? [];
    const financials = (data.financials as Record<string, unknown>) ?? {};

    // Calculate category scores from actual case data
    const hasVerifiedDocs = documents.filter((d) => d.status === "verified").length;
    const totalDocs = documents.length;
    const docScore = totalDocs > 0 ? Math.round((hasVerifiedDocs / totalDocs) * 100) : 50;

    const bankBalance = (financials.bankBalance as number) ?? 0;
    const tripBudget = (financials.tripBudget as number) ?? 1;
    const coverageRatio = bankBalance / tripBudget;
    const fundsScore = coverageRatio >= 2 ? 95 : coverageRatio >= 1.5 ? 75 : coverageRatio >= 1 ? 55 : 30;

    const hasFamily = Boolean(data.familyInHomeCountry ?? (data.applicant as Record<string, unknown>)?.familyInHomeCountry);
    const hasProperty = Boolean(data.propertyOwned ?? (data.applicant as Record<string, unknown>)?.propertyOwned);
    const tiesScore = (hasFamily ? 45 : 20) + (hasProperty ? 35 : 10) + 10;

    const employmentStatus = ((data.applicant as Record<string, unknown>)?.employmentStatus as string) ?? "unknown";
    const employmentScore = employmentStatus === "employed" ? 90 : employmentStatus === "self_employed" ? 80 : employmentStatus === "student" ? 65 : 40;

    const categoryScores: Record<string, number> = {
      funds: fundsScore,
      ties: Math.min(100, tiesScore),
      employment: employmentScore,
      documents: docScore,
      insurance: docScore > 50 ? 90 : 60,
      consistency: 85,
    };

    // Calculate overall risk
    const avgScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.values(categoryScores).length;
    const riskScore = Math.round(100 - avgScore);

    // Final recommendations based on weakest categories
    const finalRecommendations: Array<{
      id: string; issue: string; fix: string; impact: number;
      category: "funds" | "ties" | "employment" | "travel" | "insurance" | "consistency" | "completeness";
    }> = [];

    const sortedCategories = Object.entries(categoryScores).sort(([, a], [, b]) => a - b);
    for (const [category, score] of sortedCategories) {
      if (score < 70 && finalRecommendations.length < 3) {
        const recMap: Record<string, { issue: string; fix: string; impact: number }> = {
          funds: { issue: "Financial evidence could be stronger", fix: "Add additional bank statements or savings account documentation", impact: 8 },
          ties: { issue: "Ties to home country need strengthening", fix: "Provide property deed, family certificates, or employer commitment letter", impact: 10 },
          employment: { issue: "Employment documentation needs improvement", fix: "Get updated employment letter with salary, position, and leave approval", impact: 7 },
          documents: { issue: "Some documents still need verification", fix: "Ensure all critical documents are uploaded and verified", impact: 12 },
          insurance: { issue: "Insurance coverage needs verification", fix: "Upload full insurance policy showing 30,000 EUR minimum coverage", impact: 8 },
          consistency: { issue: "Check for consistency across all documents", fix: "Verify names, dates, and figures match across all submitted documents", impact: 5 },
        };

        const rec = recMap[category];
        if (rec) {
          finalRecommendations.push({
            id: `rec-final-${category}`,
            ...rec,
            category: category as "funds" | "ties" | "employment" | "travel" | "insurance" | "consistency" | "completeness",
          });
        }
      }
    }

    // Check existing unresolved recommendations
    const unresolvedCount = recommendations.filter((r) => !(r.resolved as boolean)).length;

    const approvalLikelihood = Math.min(95, Math.max(20, Math.round(avgScore - unresolvedCount * 3)));
    const hasCriticalIssues = Object.values(categoryScores).some((s) => s < 40);
    const readyToSubmit = !hasCriticalIssues && approvalLikelihood >= 50;

    return {
      riskScore,
      categoryScores,
      finalRecommendations,
      approvalLikelihood,
      readyToSubmit,
      nextStep: readyToSubmit ? "submitApplication" as const : "resolveIssues" as const,
    };
  },
});

// ==================== CLIENT-INTERACTION TOOLS ====================
// These tools have NO execute function — they render UI and wait for user action

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

export const uploadDocumentsTool = tool({
  description: "UI tool: Prompt user to upload ALL required documents at once. Displays a bulk document uploader with all slots visible. Use this for the INITIAL upload phase when the user hasn't uploaded anything yet.",
  inputSchema: z.object({
    requiredTypes: z.array(z.enum(["passport", "bank_statement", "employment_letter", "insurance", "hotel_booking", "flight_itinerary", "invitation_letter", "property_deed"])),
    criticalDocuments: z.array(z.string()).describe("Document types that are critical and must be uploaded"),
  }),
  outputSchema: uploadDocumentsOutputSchema,
  // No execute — client-side UI tool
});

// Single-document upload for step-by-step guided follow-up
const documentTypeEnum = z.enum([
  "passport", "bank_statement", "employment_letter", "insurance",
  "hotel_booking", "flight_itinerary", "invitation_letter",
  "property_deed", "photo", "marriage_certificate", "birth_certificate",
]);

const uploadDocumentOutputSchema = z.object({
  uploaded: z.boolean(),
  document: z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    status: z.literal("uploaded"),
  }),
});

export const uploadDocumentTool = tool({
  description:
    "UI tool: Request a SINGLE document from the user with full context. " +
    "Use this for follow-up requests when documents are insufficient after review, " +
    "need replacement, or for RFE responses. Renders a focused upload card explaining " +
    "why the document is needed and what makes a good upload. Call once per document — " +
    "the user sees one focused card at a time for a guided step-by-step experience.",
  inputSchema: z.object({
    documentType: documentTypeEnum,
    reason: z.string().describe(
      "Context for why this document is needed NOW (e.g. 'Your bank statements " +
      "show 1.2x coverage — a savings account statement would strengthen your " +
      "funds evidence to the recommended 2x.')"
    ),
    guidance: z.string().describe(
      "Specific guidance on what makes a good upload (e.g. 'Upload a PDF or " +
      "clear photo of your most recent 3-month statement showing your name, " +
      "account number, and closing balance.')"
    ),
    critical: z.boolean().describe("Whether this document is critical for approval"),
  }),
  outputSchema: uploadDocumentOutputSchema,
  // No execute — client-side UI tool
});

// Re-export browser-use tools
export { submitApplicationTool, approveSubmissionTool } from "./tools/submit-application";

// ==================== TOOL REGISTRY ====================

export const germainServerTools = {
  evaluateCase: evaluateCaseTool,
  reviewAndPrepare: reviewAndPrepareTool,
  runRiskReview: runRiskReviewTool,
  monitorCase: monitorCaseTool,
};

export const germainClientTools = {
  uploadDocuments: uploadDocumentsTool,
  uploadDocument: uploadDocumentTool,
  submitApplication: submitApplicationTool,
  approveSubmission: approveSubmissionTool,
};

export const germainTools = {
  ...germainServerTools,
  ...germainClientTools,
};

export type GermainTools = typeof germainTools;
export type GermainClientToolName = keyof typeof germainClientTools;
export type UploadDocumentsOutput = z.infer<typeof uploadDocumentsOutputSchema>;
export type UploadDocumentOutput = z.infer<typeof uploadDocumentOutputSchema>;

export type SubmitApplicationOutput = {
  sessionId: string;
  liveViewUrl: string;
  status: "filling" | "ready_for_review" | "submitted" | "failed";
  referenceNumber?: string;
  appointmentDetails?: { date: string; time: string; location: string; confirmationCode: string };
  paymentConfirmation?: string;
};

export type ApproveSubmissionOutput = {
  approved: boolean;
  userNote?: string;
};

export type GermainClientToolResult =
  | { tool: "uploadDocuments"; toolCallId: string; output: UploadDocumentsOutput }
  | { tool: "uploadDocument"; toolCallId: string; output: UploadDocumentOutput }
  | { tool: "submitApplication"; toolCallId: string; output: SubmitApplicationOutput }
  | { tool: "approveSubmission"; toolCallId: string; output: ApproveSubmissionOutput };
