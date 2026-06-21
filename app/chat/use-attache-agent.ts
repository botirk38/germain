"use client";

import { useMemo, useState } from "react";
import { useEveAgent } from "eve/react";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { initialCaseState, initialOnboardingState } from "@/components/attache/initial-states";
import type { CaseState, OnboardingState } from "@/components/attache/case-types";

const SESSION_STORAGE_KEY = "attache:eve-session";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSessionState(value: unknown): value is SessionState {
  if (!isRecord(value)) return false;
  const { continuationToken, sessionId, streamIndex } = value;
  return (
    (continuationToken === undefined || typeof continuationToken === "string") &&
    (sessionId === undefined || typeof sessionId === "string") &&
    typeof streamIndex === "number"
  );
}

function readStoredSession(): SessionState | undefined {
  if (typeof window === "undefined") return undefined;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isSessionState(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function extractCaseState(output: unknown): CaseState | undefined {
  if (!isRecord(output)) return undefined;
  const value = output.case_state;
  return isRecord(value) ? (value as CaseState) : undefined;
}

function extractOnboardingState(output: unknown): OnboardingState | undefined {
  if (!isRecord(output)) return undefined;
  const value = output.onboarding_state;
  return isRecord(value) ? (value as OnboardingState) : undefined;
}

function outputFromEvent(event: HandleMessageStreamEvent): unknown {
  if (event.type !== "action.result") return undefined;
  const result = event.data.result;
  if (result.kind !== "tool-result") return undefined;
  return result.output;
}

export function useAttacheAgent() {
  const [initialSession] = useState(readStoredSession);
  const [caseState, setCaseState] = useState<CaseState>(() => initialCaseState());
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() =>
    initialOnboardingState(),
  );

  const agent = useEveAgent({
    initialSession,
    onEvent(event) {
      const output = outputFromEvent(event);
      const nextCaseState = extractCaseState(output);
      const nextOnboardingState = extractOnboardingState(output);

      if (nextCaseState) setCaseState(nextCaseState);
      if (nextOnboardingState) setOnboardingState(nextOnboardingState);
    },
    onSessionChange(session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    },
  });

  const messageState = useMemo(() => {
    let nextCaseState: CaseState | undefined;
    let nextOnboardingState: OnboardingState | undefined;

    for (const message of agent.data.messages) {
      for (const part of message.parts) {
        if (part.type !== "dynamic-tool" || part.state !== "output-available") continue;

        nextCaseState = extractCaseState(part.output) ?? nextCaseState;
        nextOnboardingState = extractOnboardingState(part.output) ?? nextOnboardingState;
      }
    }

    return { caseState: nextCaseState, onboardingState: nextOnboardingState };
  }, [agent.data.messages]);

  const reset = useMemo(
    () => () => {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      setCaseState(initialCaseState());
      setOnboardingState(initialOnboardingState());
      agent.reset();
    },
    [agent],
  );

  return {
    ...agent,
    caseState: messageState.caseState ?? caseState,
    onboardingState: messageState.onboardingState ?? onboardingState,
    reset,
  };
}
