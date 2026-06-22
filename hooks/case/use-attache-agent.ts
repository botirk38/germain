"use client";

import { useCallback, useState } from "react";
import { useEveAgent } from "eve/react";
import type { HandleMessageStreamEvent, SendTurnPayload } from "eve/client";
import type { VisaCaseView } from "@/lib/db/queries";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function caseViewFromEvent(event: HandleMessageStreamEvent): VisaCaseView | undefined {
  if (event.type !== "action.result") return undefined;
  const result = event.data.result;
  if (result.kind !== "tool-result" || !isRecord(result.output)) return undefined;
  const value = result.output.case_view;
  return isRecord(value) ? (value as unknown as VisaCaseView) : undefined;
}

function withCaseContext(input: SendTurnPayload, caseId: string): SendTurnPayload {
  const current = input.clientContext;
  if (current === undefined) return { ...input, clientContext: { visaCaseId: caseId } };
  if (typeof current === "string") return { ...input, clientContext: [current, `visaCaseId: ${caseId}`] };
  if (Array.isArray(current)) return { ...input, clientContext: [...current, `visaCaseId: ${caseId}`] };
  return { ...input, clientContext: { ...current, visaCaseId: caseId } };
}

export function useAttacheAgent({ caseId, initialCaseView }: { readonly caseId: string; readonly initialCaseView: VisaCaseView }) {
  const [caseView, setCaseView] = useState<VisaCaseView>(initialCaseView);

  const prepareSend = useCallback(
    (input: SendTurnPayload) => withCaseContext(input, caseId),
    [caseId],
  );

  const agent = useEveAgent({
    prepareSend,
    onEvent(event) {
      const nextCaseView = caseViewFromEvent(event);
      if (nextCaseView) setCaseView(nextCaseView);
    },
  });

  const reset = useCallback(() => {
    setCaseView(initialCaseView);
    agent.reset();
  }, [agent, initialCaseView]);

  return {
    ...agent,
    caseView,
    reset,
  };
}
