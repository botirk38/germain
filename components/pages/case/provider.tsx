"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { InputResponse } from "eve/client";
import { useAttacheAgent } from "@/hooks/case/use-attache-agent";
import { CasePageContext, type UploadedDocument } from "@/hooks/case/use-case-page";
import type { CaseState } from "@/components/attache/case-types";
import { actionNeeded as caseActionNeeded, getDisplayStepIndex } from "@/components/attache/display";

function hasPendingHumanInput(messages: ReturnType<typeof useAttacheAgent>["data"]["messages"]): boolean {
  return messages.some(
    (message) =>
      message.role === "assistant" &&
      message.parts.some((part) => part.type === "dynamic-tool" && part.state === "approval-requested"),
  );
}

function documentsMessage(documents: readonly UploadedDocument[]): string {
  const lines = documents.map((document) => `- ${document.type}: ${document.name}`).join("\n");
  return `I uploaded these documents. Please call record_documents for them:\n${lines}`;
}

export function CasePageProvider({
  caseId,
  initialCaseState,
  children,
}: {
  readonly caseId: string;
  readonly initialCaseState: CaseState;
  readonly children: ReactNode;
}) {
  const router = useRouter();
  const agent = useAttacheAgent({ caseId, initialCaseState });
  const caseState = agent.caseState;
  const requestBusy = agent.status === "submitted" || agent.status === "streaming";
  const pendingHumanInput = hasPendingHumanInput(agent.data.messages);
  const displayStepIndex = getDisplayStepIndex(caseState.status);
  const actionNeeded = caseActionNeeded(caseState) || pendingHumanInput;

  const sendText = (text: string) => {
    if (!text.trim() || requestBusy) return;
    void agent.send({ message: text.trim() });
  };

  const recordDocuments = (documents: readonly UploadedDocument[]) => {
    if (documents.length === 0 || requestBusy) return;
    void agent.send({
      message: documentsMessage(documents),
      clientContext: {
        uploadedDocuments: documents.map((document) => ({
          type: document.type,
          name: document.name,
        })),
      },
    });
  };

  const respondToInput = (response: InputResponse) => {
    if (requestBusy) return;
    void agent.send({ inputResponses: [response] });
  };

  const startNewCase = () => {
    agent.reset();
    router.push("/onboarding");
  };

  return (
    <CasePageContext
      value={{
        agent,
        caseState,
        displayStepIndex,
        actionNeeded,
        requestBusy,
        pendingHumanInput,
        sendText,
        recordDocuments,
        respondToInput,
        startNewCase,
      }}
    >
      {children}
    </CasePageContext>
  );
}
