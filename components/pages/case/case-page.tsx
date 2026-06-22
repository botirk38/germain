"use client";

import { createContext, use, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { InputResponse } from "eve/client";
import { useAttacheAgent } from "@/hooks/use-attache-agent";
import type { CaseState } from "@/components/attache/case-types";
import { actionNeeded as caseActionNeeded, getDisplayStepIndex } from "@/components/attache/display";
import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { ChatMessages } from "@/components/ChatMessages";
import { CaseFacts } from "@/components/console/CaseFacts";
import { CaseStrip } from "@/components/console/CaseStrip";
import { CautionLamp } from "@/components/console/CautionLamp";
import { DocChecklist } from "@/components/console/DocChecklist";
import { ProgressRoute } from "@/components/console/ProgressRoute";
import { SplitFlap } from "@/components/console/SplitFlap";
import { EmptyState } from "@/components/EmptyState";

type UploadedDocument = {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly status: "uploaded";
};

type CasePageContextValue = {
  readonly agent: ReturnType<typeof useAttacheAgent>;
  readonly caseState: CaseState;
  readonly displayStepIndex: number;
  readonly actionNeeded: boolean;
  readonly requestBusy: boolean;
  readonly pendingHumanInput: boolean;
  readonly sendText: (text: string) => void;
  readonly recordDocuments: (documents: readonly UploadedDocument[]) => void;
  readonly respondToInput: (response: InputResponse) => void;
  readonly startNewCase: () => void;
};

const CasePageContext = createContext<CasePageContextValue | null>(null);

function useCasePage(): CasePageContextValue {
  const context = use(CasePageContext);
  if (!context) {
    throw new Error("Case page components must be rendered inside CasePageProvider.");
  }
  return context;
}

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

export function CaseSidebar() {
  const { caseState, displayStepIndex, startNewCase } = useCasePage();

  return (
    <aside className="hidden min-[900px]:flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-line bg-panel-dk">
      <div className="border-b border-line px-4 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <MonogramLogo size={30} title="Attaché" />
          <span className="wordmark">
            <span className="rim" />
            ATTACHÉ
          </span>
        </div>
        <div className="mt-2 font-mono text-[8.5px] tracking-[0.26em] text-ink2">AI VISA AGENT</div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <CaseStrip caseState={caseState} />
        <ProgressRoute currentIndex={displayStepIndex} />
        <DocChecklist documents={caseState.documents} />
        <CaseFacts caseState={caseState} />
      </div>

      <div className="border-t border-line p-3">
        <button type="button" onClick={startNewCase} className="btn w-full">
          ↻ NEW CASE
        </button>
      </div>
    </aside>
  );
}

export function CaseHeader() {
  const { actionNeeded, caseState } = useCasePage();

  return (
    <header className="flex items-center gap-4 border-b border-line bg-panel px-5 py-3">
      <div>
        <SplitFlap status={caseState.status} />
        <div className="flap-label" style={{ marginTop: 6 }}>
          CASE STATUS
        </div>
      </div>
      <div className="flex-1" />
      <CautionLamp on={actionNeeded} />
      {caseState.referenceNumber ? (
        <div className="font-mono text-[10px] tracking-[0.14em] text-ink2">
          REF <b className="text-ink">{caseState.referenceNumber}</b>
        </div>
      ) : null}
    </header>
  );
}

export function CaseMobileSummary() {
  const { caseState, displayStepIndex } = useCasePage();

  return (
    <section className="border-b border-line bg-panel-dk px-4 py-3 min-[900px]:hidden" aria-label="Case summary">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-ink2">Case route</div>
          <div className="mt-1 text-sm font-semibold text-ink">
            {caseState.destinationCountry || "Destination pending"}
          </div>
        </div>
        <div className="text-right font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
          {caseState.documents.length} docs
        </div>
      </div>
      <div className="mt-3">
        <ProgressRoute currentIndex={displayStepIndex} />
      </div>
    </section>
  );
}

export function CaseConversation() {
  const { agent, recordDocuments, respondToInput, sendText } = useCasePage();
  const messages = agent.data.messages;

  return (
    <div className="feed-wrap" style={{ background: "var(--bone)" }}>
      {messages.length === 0 ? (
        <EmptyState onSuggestion={sendText} />
      ) : (
        <ChatMessages
          messages={messages}
          status={agent.status}
          onDocuments={recordDocuments}
          onInputResponse={respondToInput}
        />
      )}
    </div>
  );
}

export function CaseError() {
  const { agent } = useCasePage();
  if (!agent.error) return null;

  return (
    <div style={{ background: "var(--bone)" }} className="px-5 pb-3">
      <div
        role="alert"
        className="mx-auto flex max-w-[680px] items-center gap-3 px-3 py-2 font-mono text-[10.5px] tracking-[0.04em]"
        style={{
          background: "var(--tint-problem)",
          border: "1px solid var(--clay)",
        }}
      >
        <span style={{ color: "var(--clay)" }}>X Problem</span>
        <span className="flex-1 text-ink2">{agent.error.message}</span>
      </div>
    </div>
  );
}

export function CaseComposer() {
  const { pendingHumanInput, requestBusy, sendText } = useCasePage();
  const [input, setInput] = useState("");

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const submitInput = () => {
    if (!input.trim() || requestBusy) return;
    const text = input.trim();
    setInput("");
    sendText(text);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitInput();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submitInput();
  };

  return (
    <form onSubmit={handleSubmit} className="inputbar">
      <div className="input-inner">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={requestBusy ? "Processing..." : pendingHumanInput ? "Approve or deny the pending action above..." : "Tell me about your trip..."}
          aria-label="Message Attaché"
          disabled={requestBusy || pendingHumanInput}
          rows={1}
          className="max-h-[200px] flex-1 resize-none border-none bg-transparent font-mono text-[11.5px] tracking-[0.06em] text-ink outline-none placeholder:text-ink2 placeholder:opacity-60 disabled:opacity-60"
          onInput={(event) => {
            const target = event.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || requestBusy || pendingHumanInput}
          className="ptt disabled:pointer-events-none disabled:opacity-45"
        >
          ▸ SEND
        </button>
      </div>
      <div className="mx-auto mt-2 max-w-[680px] text-center font-mono text-[8.5px] tracking-[0.16em] text-ink2 opacity-70">
        ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
      </div>
    </form>
  );
}
