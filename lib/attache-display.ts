// Pure display logic for the Attaché ops-console UI.
// No React here — types from lib/germain-types.ts, message-part helpers from "ai".

import { isToolUIPart, getToolName } from "ai";
import type { GermainUIMessage } from "./agents/germain";
import type { CaseStatus, GermainCase, GermainDocument } from "./germain-types";

// ---------------------------------------------------------------------------
// Plain-word progress steps (never regresses over the internal 13-step flow)
// ---------------------------------------------------------------------------

export const DISPLAY_STEPS = [
  "Documents",
  "Review",
  "Appointment",
  "Submitted",
  "Decision",
] as const;

const STATUS_TO_DISPLAY_STEP: Record<CaseStatus, number> = {
  intake: 0,
  route_selected: 0,
  checklist_ready: 0,
  documents_reviewed: 1,
  form_ready: 1,
  pack_ready: 1,
  review_passed: 1,
  appointment_set: 2,
  fees_paid: 2,
  submitted: 3,
  awaiting_biometrics: 3,
  processing: 3,
  decision_ready: 4,
};

export function getDisplayStepIndex(status: CaseStatus): number {
  return STATUS_TO_DISPLAY_STEP[status] ?? 0;
}

// ---------------------------------------------------------------------------
// Status vocabulary — mark + word, never color alone
// ---------------------------------------------------------------------------

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

export function docStatusWord(s: GermainDocument["status"]): StatusWord {
  switch (s) {
    case "missing":
      return "missing";
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
  v: "verified" | "needs_review" | "rejected"
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

// ---------------------------------------------------------------------------
// Split-flap status word for the topbar display
// ---------------------------------------------------------------------------

const SPLIT_FLAP_WORDS: Record<CaseStatus, string> = {
  intake: "INTAKE",
  route_selected: "CHECKLIST",
  checklist_ready: "CHECKLIST",
  documents_reviewed: "REVIEWING",
  form_ready: "PREPARING",
  pack_ready: "PREPARING",
  review_passed: "READY",
  appointment_set: "BOOKED",
  fees_paid: "FEES PAID",
  submitted: "SUBMITTED",
  awaiting_biometrics: "FOLLOW-UP",
  processing: "PROCESSING",
  decision_ready: "DECISION",
};

export function splitFlapWord(status: CaseStatus): string {
  return SPLIT_FLAP_WORDS[status] ?? "INTAKE";
}

// ---------------------------------------------------------------------------
// "Action needed" lamp — pending client-interaction tools or unanswered RFEs
// ---------------------------------------------------------------------------

export const CLIENT_TOOLS = [
  "uploadDocuments",
  "submitApplication",
  "approveSubmission",
] as const;

// Recommendations are deliberately ignored here: nothing in this codebase ever
// sets recommendation.resolved = true, so counting them would leave the lamp
// permanently lit.
export function deriveActionNeeded(
  messages: readonly GermainUIMessage[],
  caseState: GermainCase
): boolean {
  for (const message of messages) {
    if (message.role !== "assistant") continue;

    for (const part of message.parts ?? []) {
      if (!isToolUIPart(part)) continue;

      const toolName = getToolName(part);
      if (!(CLIENT_TOOLS as readonly string[]).includes(toolName)) continue;

      // A client tool that hasn't produced output (and isn't errored) is
      // waiting on the user.
      if (part.state !== "output-available" && part.state !== "output-error") {
        return true;
      }
    }
  }

  return caseState.embassyFollowUps.some((f) => f.type === "rfe" && !f.responded);
}
