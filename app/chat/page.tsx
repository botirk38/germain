"use client";

import { useChat, Chat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport } from "ai";
import type { GermainUIMessage } from "@/lib/agents/germain";
import type { GermainClientToolResult } from "@/lib/tools";
import { deriveCase, initialCaseState } from "@/lib/case-derive";
import { getDisplayStepIndex, deriveActionNeeded } from "@/lib/attache-display";
import { ChatMessages } from "@/components/ChatMessages";
import { EmptyState } from "@/components/EmptyState";
import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { CaseStrip } from "@/components/console/CaseStrip";
import { ProgressRoute } from "@/components/console/ProgressRoute";
import { DocChecklist } from "@/components/console/DocChecklist";
import { CaseFacts } from "@/components/console/CaseFacts";
import { SplitFlap } from "@/components/console/SplitFlap";
import { CautionLamp } from "@/components/console/CautionLamp";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useState, useMemo } from "react";

// Create transport singleton
const chatTransport = new DefaultChatTransport<GermainUIMessage>({
  api: "/api/chat",
});

// Create chat instance
const germainChat = new Chat<GermainUIMessage>({
  transport: chatTransport,
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
});

export default function GermainPage() {
  const [input, setInput] = useState("");

  const {
    messages,
    status,
    error,
    sendMessage,
    regenerate,
    addToolOutput,
  } = useChat<GermainUIMessage>({
    chat: germainChat,
  });

  // "error" must not lock the composer — only an in-flight request does.
  const busy = status === "submitted" || status === "streaming";

  // Derive live case state from message history
  const caseState = useMemo(() => {
    return messages.length > 0 ? deriveCase(messages) : initialCaseState;
  }, [messages]);

  const displayStepIndex = getDisplayStepIndex(caseState.status);
  const actionNeeded = useMemo(() => deriveActionNeeded(messages, caseState), [messages, caseState]);
  const hasMessages = messages.length > 0;

  // Handle tool output from client-interaction tools
  const handleToolOutput = (result: GermainClientToolResult) => {
    switch (result.tool) {
      case "uploadDocuments":
        addToolOutput({
          toolCallId: result.toolCallId,
          tool: "uploadDocuments",
          state: "output-available",
          output: result.output,
        });
        break;
      case "submitApplication":
        addToolOutput({
          toolCallId: result.toolCallId,
          tool: "submitApplication",
          state: "output-available",
          output: result.output,
        });
        break;
      case "approveSubmission":
        addToolOutput({
          toolCallId: result.toolCallId,
          tool: "approveSubmission",
          state: "output-available",
          output: result.output,
        });
        break;
    }
  };

  // Handle suggestion click from empty state
  const handleSuggestion = (text: string) => {
    sendMessage({ text });
  };

  // Handle form submission via PromptInput
  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim() || busy) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== Left sidebar : instrument panel ===== */}
      <aside className="hidden min-[900px]:flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-line bg-panel-dk">
        {/* Brand */}
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

        {/* Console panels */}
        <div className="flex flex-1 flex-col gap-3 p-3">
          <CaseStrip caseState={caseState} />
          <ProgressRoute currentIndex={displayStepIndex} />
          <DocChecklist documents={caseState.documents} />
          <CaseFacts caseState={caseState} />
        </div>

        {/* New case */}
        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn w-full"
          >
            ↻ NEW CASE
          </button>
        </div>
      </aside>

      {/* ===== Main column ===== */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
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

        {/* Feed */}
        <Conversation className="feed-wrap" style={{ background: "var(--bone)" }}>
          <ConversationContent className="!gap-0 !p-0">
            {!hasMessages ? (
              <EmptyState onSuggestion={handleSuggestion} />
            ) : (
              <ChatMessages
                messages={messages}
                status={status}
                onToolOutput={handleToolOutput}
              />
            )}
          </ConversationContent>
          <ConversationScrollButton className="scroll-btn" />
        </Conversation>

        {/* Transmission failure */}
        {error ? (
          <div style={{ background: "var(--bone)" }} className="px-5 pb-3">
            <div
              className="mx-auto flex max-w-[680px] items-center gap-3 px-3 py-2 font-mono text-[10.5px] tracking-[0.04em]"
              style={{
                background: "var(--tint-problem)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid var(--clay)",
              }}
            >
              <span style={{ color: "var(--clay)" }}>✕ Problem</span>
              <span className="flex-1 text-ink2">
                Transmission failed — the model request was refused (often a rate limit). Wait a moment, then retry.
              </span>
              <button
                type="button"
                onClick={() => regenerate()}
                className="btn shrink-0"
                style={{ padding: "4px 10px" }}
              >
                ↻ RETRY
              </button>
            </div>
          </div>
        ) : null}

        {/* Input bar */}
        <PromptInput onSubmit={handleSubmit} className="inputbar">
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={busy ? "Processing…" : "Transmit to Attaché…"}
            disabled={busy}
            className="prompt-textarea"
          />
          <PromptInputSubmit
            status={status}
            disabled={!input.trim() || busy}
            className="ptt disabled:pointer-events-none disabled:opacity-45"
          >
            ▸ SEND
          </PromptInputSubmit>
        </PromptInput>
        <div className="prompt-hint">
          ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
        </div>
      </main>
    </div>
  );
}
