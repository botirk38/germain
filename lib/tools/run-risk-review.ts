import { tool, type ToolExecutionOptions } from "ai";
import { z } from "zod";

export const runRiskReviewOutputSchema = z.object({
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
});

export type RunRiskReviewOutput = z.infer<typeof runRiskReviewOutputSchema>;

export const runRiskReviewTool = tool({
  description: "Final risk assessment before submission. Analyzes all case factors, calculates final approval likelihood, and identifies remaining high-impact fixes. Call after reviewAndPrepare.",
  inputSchema: z.object({
    caseData: z.record(z.unknown()).describe("Full case state including documents, financials, and previous recommendations"),
  }),
  outputSchema: runRiskReviewOutputSchema,
  execute: async ({ caseData }, _options: ToolExecutionOptions) => {
    const data = caseData as Record<string, unknown>;

    const documents = (data.documents as Array<Record<string, unknown>>) ?? [];
    const recommendations = (data.recommendations as Array<Record<string, unknown>>) ?? [];
    const financials = (data.financials as Record<string, unknown>) ?? {};

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

    const avgScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.values(categoryScores).length;
    const riskScore = Math.round(100 - avgScore);

    type RecCategory = "funds" | "ties" | "employment" | "travel" | "insurance" | "consistency" | "completeness";
    const finalRecommendations: Array<{
      id: string; issue: string; fix: string; impact: number; category: RecCategory;
    }> = [];

    const recMap: Record<string, { issue: string; fix: string; impact: number }> = {
      funds: { issue: "Financial evidence could be stronger", fix: "Add additional bank statements or savings account documentation", impact: 8 },
      ties: { issue: "Ties to home country need strengthening", fix: "Provide property deed, family certificates, or employer commitment letter", impact: 10 },
      employment: { issue: "Employment documentation needs improvement", fix: "Get updated employment letter with salary, position, and leave approval", impact: 7 },
      documents: { issue: "Some documents still need verification", fix: "Ensure all critical documents are uploaded and verified", impact: 12 },
      insurance: { issue: "Insurance coverage needs verification", fix: "Upload full insurance policy showing 30,000 EUR minimum coverage", impact: 8 },
      consistency: { issue: "Check for consistency across all documents", fix: "Verify names, dates, and figures match across all submitted documents", impact: 5 },
    };

    const sortedCategories = Object.entries(categoryScores).sort(([, a], [, b]) => a - b);
    for (const [category, score] of sortedCategories) {
      if (score < 70 && finalRecommendations.length < 3) {
        const rec = recMap[category];
        if (rec) {
          finalRecommendations.push({
            id: `rec-final-${category}`,
            ...rec,
            category: category as RecCategory,
          });
        }
      }
    }

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
