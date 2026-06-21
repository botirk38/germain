"use client";

import { useChat, Chat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport, getToolName, isToolUIPart } from "ai";
import type { GermainUIMessage } from "@/lib/agents/germain";
import type { GermainClientToolName, GermainClientToolResult } from "@/lib/tools";
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
import { useState, type FormEvent, type ChangeEvent, type KeyboardEvent, useMemo } from "react";

const clientToolNames = new Set([
  "uploadDocuments",
  "uploadDocument",
  "submitApplication",
  "approveSubmission",
]);

const userMessageCancellation = "Cancelled because the user sent a new message.";

function isClientToolName(toolName: string): toolName is GermainClientToolName {
  return clientToolNames.has(toolName);
}

function getPendingClientTools(messages: GermainUIMessage[]) {
  return messages.flatMap((message) => {
    if (message.role !== "assistant") return [];

    return (message.parts ?? []).flatMap((part) => {
      if (!isToolUIPart(part)) return [];

      const toolName = getToolName(part);
      if (!isClientToolName(toolName)) return [];
      if (part.state !== "input-streaming" && part.state !== "input-available") return [];

      return [{ tool: toolName, toolCallId: part.toolCallId }];
    });
  });
}

function shouldContinueAfterToolOutput({ messages }: { messages: GermainUIMessage[] }) {
  const message = messages[messages.length - 1];
  const cancelledByUserMessage = message?.role === "assistant" && message.parts?.some((part) => {
    return isToolUIPart(part) && part.state === "output-error" && part.errorText === userMessageCancellation;
  });

  return !cancelledByUserMessage && lastAssistantMessageIsCompleteWithToolCalls({ messages });
}

// Create transport singleton
const chatTransport = new DefaultChatTransport<GermainUIMessage>({
  api: "/api/chat",
});

// Create chat instance
const germainChat = new Chat<GermainUIMessage>({
  transport: chatTransport,
  sendAutomaticallyWhen: shouldContinueAfterToolOutput,
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
  const requestBusy = status === "submitted" || status === "streaming";
  const pendingClientTools = useMemo(() => getPendingClientTools(messages), [messages]);
  const awaitingToolAction = pendingClientTools.length > 0;
  const busy = requestBusy;

  // Derive live case state from message history
  const caseState = useMemo(() => {
    return messages.length > 0 ? deriveCase(messages) : initialCaseState;
  }, [messages]);

  const displayStepIndex = getDisplayStepIndex(caseState.status);
  const actionNeeded = useMemo(() => deriveActionNeeded(messages, caseState), [messages, caseState]);
  const hasMessages = messages.length > 0;

  const handleToolOutput = (result: GermainClientToolResult) => {
    switch (result.kind) {
      case "error":
        addToolOutput({
          tool: result.tool,
          toolCallId: result.toolCallId,
          state: "output-error",
          errorText: result.errorText,
        });
        return;
      case "output":
        addToolOutput({
          tool: result.tool,
          toolCallId: result.toolCallId,
          state: "output-available",
          output: result.output,
        });
        return;
    }
  };

  const cancelPendingClientTools = async (errorText: string) => {
    await Promise.all(
      pendingClientTools.map((pendingTool) =>
        addToolOutput({
          tool: pendingTool.tool,
          toolCallId: pendingTool.toolCallId,
          state: "output-error",
          errorText,
        }),
      ),
    );
  };

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle suggestion click from empty state
  const handleSuggestion = async (text: string) => {
    if (requestBusy) return;
    await cancelPendingClientTools(userMessageCancellation);
    sendMessage({ text });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || requestBusy) return;

    const text = input;
    setInput("");
    await cancelPendingClientTools(userMessageCancellation);
    sendMessage({ text });
  };

  // Handle keydown for textarea
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !requestBusy) {
        const text = input;
        setInput("");
        void cancelPendingClientTools(userMessageCancellation).then(() => sendMessage({ text }));
      }
    }
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
        <div className="feed-wrap" style={{ background: "var(--bone)" }}>
          {!hasMessages ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            <ChatMessages
              messages={messages}
              status={status}
              onToolOutput={handleToolOutput}
            />
          )}
        </div>

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
                {awaitingToolAction
                  ? "A tool action is waiting. Send a new message to cancel it, or use the tool controls."
                  : "Transmission failed — the model request was refused (often a rate limit). Wait a moment, then retry."}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!requestBusy && !awaitingToolAction) regenerate();
                }}
                disabled={requestBusy || awaitingToolAction}
                className="btn shrink-0"
                style={{ padding: "4px 10px" }}
              >
                ↻ RETRY
              </button>
            </div>
          </div>
        ) : null}

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="inputbar">
          <div className="input-inner">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                requestBusy
                  ? "Processing…"
                  : awaitingToolAction
                    ? "Send to cancel the pending tool…"
                    : "Tell me about your trip…"
              }
              disabled={busy}
              rows={1}
              className="max-h-[200px] flex-1 resize-none border-none bg-transparent font-mono text-[11.5px] tracking-[0.06em] text-ink outline-none placeholder:text-ink2 placeholder:opacity-60 disabled:opacity-60"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
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
