import { evaluateCaseTool } from "./evaluate-case";
import { reviewAndPrepareTool } from "./review-and-prepare";
import { runRiskReviewTool } from "./run-risk-review";
import { monitorCaseTool } from "./monitor-case";
import { uploadDocumentsTool, uploadDocumentTool } from "./upload-documents";
import { submitApplicationTool, approveSubmissionTool } from "./submit-application";
import { askQuestionTool } from "./ask-question";

import type { UploadDocumentsOutput, UploadDocumentOutput } from "./upload-documents";
import type { SubmitApplicationOutput, ApproveSubmissionOutput } from "./submit-application";
import type { AskQuestionOutput } from "./ask-question";

// ==================== TOOL REGISTRY ====================

export const attacheServerTools = {
  evaluateCase: evaluateCaseTool,
  reviewAndPrepare: reviewAndPrepareTool,
  runRiskReview: runRiskReviewTool,
  monitorCase: monitorCaseTool,
};

export const attacheClientTools = {
  uploadDocuments: uploadDocumentsTool,
  uploadDocument: uploadDocumentTool,
  askQuestion: askQuestionTool,
  submitApplication: submitApplicationTool,
  approveSubmission: approveSubmissionTool,
};

export const attacheTools = {
  ...attacheServerTools,
  ...attacheClientTools,
};

export type AttacheTools = typeof attacheTools;
export type AttacheClientToolName = keyof typeof attacheClientTools;

export type AttacheClientToolResult =
  | { kind: "output"; tool: "uploadDocuments"; toolCallId: string; output: UploadDocumentsOutput }
  | { kind: "output"; tool: "uploadDocument"; toolCallId: string; output: UploadDocumentOutput }
  | { kind: "output"; tool: "askQuestion"; toolCallId: string; output: AskQuestionOutput }
  | { kind: "output"; tool: "submitApplication"; toolCallId: string; output: SubmitApplicationOutput }
  | { kind: "output"; tool: "approveSubmission"; toolCallId: string; output: ApproveSubmissionOutput }
  | { kind: "error"; tool: AttacheClientToolName; toolCallId: string; errorText: string };
