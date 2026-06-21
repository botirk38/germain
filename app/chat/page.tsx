"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import type { InputResponse } from "eve/client";
import { useAttacheAgent } from "./use-attache-agent";
import { actionNeeded as caseActionNeeded, getDisplayStepIndex } from "@/components/attache/display";
import { CaseFacts } from "@/components/console/CaseFacts";
import { CaseStrip } from "@/components/console/CaseStrip";
import { CautionLamp } from "@/components/console/CautionLamp";
import { DocChecklist } from "@/components/console/DocChecklist";
import { ProgressRoute } from "@/components/console/ProgressRoute";
import { SplitFlap } from "@/components/console/SplitFlap";
import { EmptyState } from "@/components/EmptyState";
import { ChatMessages } from "@/components/ChatMessages";
import { MonogramLogo } from "@/components/attache/MonogramLogo";

type UploadedDocument = {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly status: "uploaded";
};

const PROFILE_STORAGE_KEY = "attache:onboarding-profile";
const PROFILE_STORAGE_VERSION = 1;
const PROFILE_STORAGE_TTL_MS = 30 * 60 * 1000;

type StoredOnboardingProfile = {
  readonly version: typeof PROFILE_STORAGE_VERSION;
  readonly createdAt: number;
  readonly profile: Record<string, string | number | boolean>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStoredOnboardingProfile(): StoredOnboardingProfile | undefined {
  const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return undefined;
    if (parsed.version !== PROFILE_STORAGE_VERSION) return undefined;
    if (typeof parsed.createdAt !== "number" || Date.now() - parsed.createdAt > PROFILE_STORAGE_TTL_MS) {
      window.sessionStorage.removeItem(PROFILE_STORAGE_KEY);
      return undefined;
    }
    if (!isRecord(parsed.profile)) return undefined;
    if (
      !Object.values(parsed.profile).every(
        (value) => typeof value === "string" || typeof value === "number" || typeof value === "boolean",
      )
    ) {
      return undefined;
    }
    return parsed as StoredOnboardingProfile;
  } catch {
    return undefined;
  }
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

function onboardingMessage(profile: StoredOnboardingProfile["profile"]): string {
  return `I completed the quick onboarding form. Please call save_profile with these fields, then start my visa plan:\n${JSON.stringify(profile, null, 2)}`;
}

export default function AttachePage() {
  const [input, setInput] = useState("");
  const sentOnboardingProfile = useRef(false);
  const agent = useAttacheAgent();
  const messages = agent.data.messages;
  const caseState = agent.caseState;
  const requestBusy = agent.status === "submitted" || agent.status === "streaming";
  const pendingHumanInput = hasPendingHumanInput(messages);
  const hasMessages = messages.length > 0;
  const displayStepIndex = getDisplayStepIndex(caseState.status);
  const actionNeeded = caseActionNeeded(caseState) || pendingHumanInput;

  useEffect(() => {
    if (sentOnboardingProfile.current || requestBusy || messages.length > 0) return;

    const storedProfile = readStoredOnboardingProfile();
    if (!storedProfile) return;

    sentOnboardingProfile.current = true;
    void agent
      .send({
        message: onboardingMessage(storedProfile.profile),
        clientContext: { onboardingProfile: storedProfile.profile },
      })
      .then(() => window.sessionStorage.removeItem(PROFILE_STORAGE_KEY))
      .catch(() => {
        sentOnboardingProfile.current = false;
      });
  }, [agent, messages.length, requestBusy]);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const sendText = (text: string) => {
    if (!text.trim() || requestBusy) return;
    void agent.send({ message: text });
  };

  const handleSuggestion = (text: string) => {
    sendText(text);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || requestBusy) return;
    const text = input.trim();
    setInput("");
    sendText(text);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (!input.trim() || requestBusy) return;
    const text = input.trim();
    setInput("");
    sendText(text);
  };

  const handleDocuments = (documents: readonly UploadedDocument[]) => {
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

  const handleInputResponse = (response: InputResponse) => {
    if (requestBusy) return;
    void agent.send({ inputResponses: [response] });
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden min-[900px]:flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-line bg-panel-dk">
        <div className="border-b border-line px-4 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <MonogramLogo size={30} title="Attaché" />
            <span className="wordmark">
              <span className="rim" />
              ATTACHÉ
            </span>
          </div>
          <div className="mt-2 font-mono text-[8.5px] tracking-[0.26em] text-ink2">
            AI VISA AGENT
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-3">
          <CaseStrip caseState={caseState} />
          <ProgressRoute currentIndex={displayStepIndex} />
          <DocChecklist documents={caseState.documents} />
          <CaseFacts caseState={caseState} />
        </div>

        <div className="border-t border-line p-3">
          <button type="button" onClick={agent.reset} className="btn w-full">
            ↻ NEW CASE
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
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

        <div className="feed-wrap" style={{ background: "var(--bone)" }}>
          {!hasMessages ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            <ChatMessages
              messages={messages}
              status={agent.status}
              onDocuments={handleDocuments}
              onInputResponse={handleInputResponse}
            />
          )}
        </div>

        {agent.error ? (
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
        ) : null}

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
      </main>
    </div>
  );
}
