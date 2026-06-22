import type { VisaCaseView } from "@/lib/db/queries";

export type CaseStatus = VisaCaseView["visaCase"]["internalStatus"];
export type DocumentStatus = VisaCaseView["documents"][number]["status"];
export type RequirementStatus = VisaCaseView["documentRequirements"][number]["status"];

export const DISPLAY_STEPS = [
  "Plan",
  "Documents",
  "Review",
  "Submit",
  "Decision",
] as const;

const STATUS_TO_DISPLAY_STEP: Record<CaseStatus, number> = {
  intake_started: 0,
  intake_completed: 0,
  route_assessed: 0,
  checklist_generated: 0,
  documents_requested: 1,
  documents_partially_received: 1,
  documents_received: 1,
  document_review_in_progress: 2,
  document_review_failed: 2,
  document_review_passed: 2,
  case_strengthening: 2,
  application_pack_prepared: 3,
  portal_draft_requested: 3,
  portal_draft_ready: 3,
  final_submission_requested: 3,
  submitted: 3,
  biometrics_requested: 4,
  additional_documents_requested: 4,
  processing: 4,
  decision_ready: 4,
  closed: 4,
};

export function getDisplayStepIndex(status: CaseStatus): number {
  return STATUS_TO_DISPLAY_STEP[status] ?? 0;
}

export type StatusWord =
  | "verified"
  | "check"
  | "problem"
  | "missing"
  | "received"
  | "waiting";

export type StatusTone = "sage" | "amber" | "clay" | "dim" | "plain";

export const STATUS_WORD_META: Record<
  StatusWord,
  { mark: string; label: string; tone: StatusTone }
> = {
  verified: { mark: "●", label: "Verified", tone: "sage" },
  check: { mark: "▲", label: "Check this", tone: "amber" },
  problem: { mark: "✕", label: "Problem", tone: "clay" },
  missing: { mark: "—", label: "Missing", tone: "dim" },
  received: { mark: "○", label: "Received", tone: "plain" },
  waiting: { mark: "", label: "Waiting", tone: "plain" },
};

export function docStatusWord(s: DocumentStatus | RequirementStatus): StatusWord {
  switch (s) {
    case "requested":
      return "waiting";
    case "satisfied":
      return "verified";
    case "waived":
      return "received";
    case "uploaded":
    case "processing":
      return "received";
    case "needs_review":
      return "check";
    case "verified":
      return "verified";
    case "rejected":
      return "problem";
  }
}

export function reviewStatusWord(
  v: "verified" | "needs_review" | "rejected",
): StatusWord {
  switch (v) {
    case "verified":
      return "verified";
    case "needs_review":
      return "check";
    case "rejected":
      return "problem";
  }
}

const SPLIT_FLAP_WORDS: Record<CaseStatus, string> = {
  intake_started: "INTAKE",
  intake_completed: "PLANNING",
  route_assessed: "PLAN READY",
  checklist_generated: "CHECKLIST",
  documents_requested: "DOCS NEEDED",
  documents_partially_received: "DOCS NEEDED",
  documents_received: "DOCS IN",
  document_review_in_progress: "REVIEWING",
  document_review_failed: "ACTION NEEDED",
  document_review_passed: "REVIEWED",
  case_strengthening: "STRENGTHEN",
  application_pack_prepared: "PACK READY",
  portal_draft_requested: "PORTAL",
  portal_draft_ready: "APPROVE",
  final_submission_requested: "APPROVE",
  submitted: "SUBMITTED",
  biometrics_requested: "BIOMETRICS",
  additional_documents_requested: "ACTION NEEDED",
  processing: "PROCESSING",
  decision_ready: "DECISION",
  closed: "CLOSED",
};

export function splitFlapWord(status: CaseStatus): string {
  return SPLIT_FLAP_WORDS[status] ?? "INTAKE";
}

export function actionNeeded(caseView: VisaCaseView): boolean {
  return caseView.candidateActions.some((action) => action.status === "open");
}
