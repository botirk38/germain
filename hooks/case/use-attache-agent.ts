"use client";

import { useCallback, useState } from "react";
import { useEveAgent } from "eve/react";
import type { HandleMessageStreamEvent, SendTurnPayload } from "eve/client";
import type { CaseState } from "@/components/attache/case-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function caseStateFromEvent(event: HandleMessageStreamEvent): CaseState | undefined {
  if (event.type !== "action.result") return undefined;
  const result = event.data.result;
  if (result.kind !== "tool-result" || !isRecord(result.output)) return undefined;
  const value = result.output.case_state;
  return isRecord(value) ? (value as CaseState) : undefined;
}

function withCaseContext(input: SendTurnPayload, caseId: string): SendTurnPayload {
  const current = input.clientContext;
  if (current === undefined) return { ...input, clientContext: { visaCaseId: caseId } };
  if (typeof current === "string") return { ...input, clientContext: [current, `visaCaseId: ${caseId}`] };
  if (Array.isArray(current)) return { ...input, clientContext: [...current, `visaCaseId: ${caseId}`] };
  return { ...input, clientContext: { ...current, visaCaseId: caseId } };
}

export function useAttacheAgent({ caseId, initialCaseState }: { readonly caseId: string; readonly initialCaseState: CaseState }) {
  const [caseState, setCaseState] = useState<CaseState>(initialCaseState);

  const prepareSend = useCallback(
    (input: SendTurnPayload) => withCaseContext(input, caseId),
    [caseId],
  );

  const agent = useEveAgent({
    prepareSend,
    onEvent(event) {
      const nextCaseState = caseStateFromEvent(event);
      if (nextCaseState) setCaseState(nextCaseState);
    },
  });

  const reset = useCallback(() => {
    setCaseState(initialCaseState);
    agent.reset();
  }, [agent, initialCaseState]);

  return {
    ...agent,
    caseState,
    reset,
  };
}
