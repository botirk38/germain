"use client";

import { useCallback, useMemo, useState } from "react";
import { useEveAgent } from "eve/react";
import type { HandleMessageStreamEvent } from "eve/client";
import { initialCaseState } from "@/components/attache/initial-states";
import type { CaseState } from "@/components/attache/case-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractCaseState(output: unknown): CaseState | undefined {
  if (!isRecord(output)) return undefined;
  const value = output.case_state;
  return isRecord(value) ? (value as CaseState) : undefined;
}

function outputFromEvent(event: HandleMessageStreamEvent): unknown {
  if (event.type !== "action.result") return undefined;
  const result = event.data.result;
  if (result.kind !== "tool-result") return undefined;
  return result.output;
}

export function useAttacheAgent() {
  const [caseState, setCaseState] = useState<CaseState>(() => initialCaseState());

  const agent = useEveAgent({
    onEvent(event) {
      const output = outputFromEvent(event);
      const nextCaseState = extractCaseState(output);

      if (nextCaseState) setCaseState(nextCaseState);
    },
  });

  const messageState = useMemo(() => {
    let nextCaseState: CaseState | undefined;

    for (const message of agent.data.messages) {
      for (const part of message.parts) {
        if (part.type !== "dynamic-tool" || part.state !== "output-available") continue;

        nextCaseState = extractCaseState(part.output) ?? nextCaseState;
      }
    }

    return { caseState: nextCaseState };
  }, [agent.data.messages]);

  const reset = useCallback(
    () => {
      setCaseState(initialCaseState());
      agent.reset();
    },
    [agent],
  );

  return {
    ...agent,
    caseState: messageState.caseState ?? caseState,
    reset,
  };
}
