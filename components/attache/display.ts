import type { CaseState } from "./case-types";

export const DISPLAY_STEPS = [
  "Documents",
  "Review",
  "Appointment",
  "Submitted",
  "Decision",
] as const;

const STATUS_TO_DISPLAY_STEP: Record<CaseState["status"], number> = {
  intake: 0,
  route_selected: 0,
  checklist_ready: 0,
  documents_reviewed: 1,
  form_ready: 1,
  pack_ready: 1,
  review_passed: 1,
  appointment_set: 2,
  fees_paid: 2,
  preparing_submission: 2,
  submitted: 3,
  awaiting_biometrics: 3,
  processing: 3,
  decision_ready: 4,
};

export function getDisplayStepIndex(status: CaseState["status"]): number {
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

export function docStatusWord(s: CaseState["documents"][number]["status"]): StatusWord {
  switch (s) {
    case "missing":
      return "missing";
    case "requested":
      return "waiting";
    case "uploaded":
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

const SPLIT_FLAP_WORDS: Record<CaseState["status"], string> = {
  intake: "INTAKE",
  route_selected: "CHECKLIST",
  checklist_ready: "CHECKLIST",
  documents_reviewed: "REVIEWING",
  form_ready: "PREPARING",
  pack_ready: "PREPARING",
  review_passed: "READY",
  appointment_set: "BOOKED",
  fees_paid: "FEES PAID",
  preparing_submission: "PREPARING",
  submitted: "SUBMITTED",
  awaiting_biometrics: "FOLLOW-UP",
  processing: "PROCESSING",
  decision_ready: "DECISION",
};

export function splitFlapWord(status: CaseState["status"]): string {
  return SPLIT_FLAP_WORDS[status] ?? "INTAKE";
}

export function actionNeeded(state: CaseState): boolean {
  return state.embassyFollowUps.some((f) => f.type === "rfe" && !f.responded);
}
