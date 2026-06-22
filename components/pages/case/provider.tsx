"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { InputResponse } from "eve/client";
import { useAttacheAgent } from "@/hooks/case/use-attache-agent";
import { CasePageContext, type UploadedDocument } from "@/hooks/case/use-case-page";
import { actionNeeded as caseActionNeeded, getDisplayStepIndex } from "@/components/attache/display";
import type { VisaCaseView } from "@/lib/db/queries";

function hasPendingHumanInput(messages: ReturnType<typeof useAttacheAgent>["data"]["messages"]): boolean {
  return messages.some(
    (message) =>
      message.role === "assistant" &&
      message.parts.some((part) => part.type === "dynamic-tool" && part.state === "approval-requested"),
  );
}

function documentsMessage(documents: readonly UploadedDocument[]): string {
  const lines = documents
    .map((document) => `- type: ${document.type}; name: ${document.name}; storage_key: ${document.storageKey ?? ""}`)
    .join("\n");
  return `I uploaded these documents. Please call record_documents for them:\n${lines}`;
}

async function uploadDocument(document: UploadedDocument): Promise<UploadedDocument> {
  if (document.storageKey) return document;
  const formData = new FormData();
  formData.set("file", document.file);
  formData.set("documentType", document.type);
  const response = await fetch("/api/uploads", { method: "POST", body: formData });
  const body = (await response.json()) as { url?: unknown; error?: unknown };
  if (!response.ok || typeof body.url !== "string") {
    throw new Error(typeof body.error === "string" ? body.error : `Could not upload ${document.name}.`);
  }
  return { ...document, storageKey: body.url };
}

export function CasePageProvider({
  caseId,
  initialCaseView,
  children,
}: {
  readonly caseId: string;
  readonly initialCaseView: VisaCaseView;
  readonly children: ReactNode;
}) {
  const router = useRouter();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const agent = useAttacheAgent({ caseId, initialCaseView });
  const caseView = agent.caseView;
  const requestBusy = agent.status === "submitted" || agent.status === "streaming" || uploadBusy;
  const pendingHumanInput = hasPendingHumanInput(agent.data.messages);
  const displayStepIndex = getDisplayStepIndex(caseView.visaCase.internalStatus);
  const actionNeeded = caseActionNeeded(caseView) || pendingHumanInput;

  const sendText = (text: string) => {
    if (!text.trim() || requestBusy) return;
    setUploadError(null);
    void agent.send({ message: text.trim() });
  };

  const recordDocuments = (documents: readonly UploadedDocument[]) => {
    if (documents.length === 0 || requestBusy) return;
    setUploadBusy(true);
    setUploadError(null);
    void Promise.all(documents.map(uploadDocument))
      .then((uploadedDocuments) => {
        void agent.send({
          message: documentsMessage(uploadedDocuments),
        });
      })
      .catch((error: unknown) => {
        setUploadError(error instanceof Error ? error.message : "Could not upload documents. Please try again.");
      })
      .finally(() => {
        setUploadBusy(false);
      });
  };

  const respondToInput = (response: InputResponse) => {
    if (requestBusy) return;
    setUploadError(null);
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
        caseView,
        displayStepIndex,
        actionNeeded,
        requestBusy,
        pendingHumanInput,
        uploadError,
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
