"use client";

import { createContext, use } from "react";
import type { InputResponse } from "eve/client";
import type { useAttacheAgent } from "@/hooks/case/use-attache-agent";
import type { VisaCaseView } from "@/lib/db/queries";

export type UploadedDocument = {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly status: "uploaded";
};

export type CasePageContextValue = {
  readonly agent: ReturnType<typeof useAttacheAgent>;
  readonly caseView: VisaCaseView;
  readonly displayStepIndex: number;
  readonly actionNeeded: boolean;
  readonly requestBusy: boolean;
  readonly pendingHumanInput: boolean;
  readonly sendText: (text: string) => void;
  readonly recordDocuments: (documents: readonly UploadedDocument[]) => void;
  readonly respondToInput: (response: InputResponse) => void;
  readonly startNewCase: () => void;
};

export const CasePageContext = createContext<CasePageContextValue | null>(null);

export function useCasePage(): CasePageContextValue {
  const context = use(CasePageContext);
  if (!context) {
    throw new Error("Case page components must be rendered inside CasePageProvider.");
  }
  return context;
}
