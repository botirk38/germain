"use client";

import { useChat, Chat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport } from "ai";
import type { GermainUIMessage } from "@/lib/agents/germain";
import { deriveCase, initialCaseState, getCurrentStepIndex } from "@/lib/case-derive";
import { StepTracker } from "@/components/StepTracker";
import { CaseFilePanel } from "@/components/CaseFilePanel";
import { ChatMessages } from "@/components/ChatMessages";
import { EmptyState } from "@/components/EmptyState";
import { Sparkles, FileText, ChevronRight, ChevronLeft, Send, Loader2 } from "lucide-react";
import { useState, useCallback, FormEvent, ChangeEvent, useMemo } from "react";

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
  const [panelOpen, setPanelOpen] = useState(true);
  const [input, setInput] = useState("");

  const {
    messages,
    status,
    sendMessage,
    addToolOutput,
  } = useChat<GermainUIMessage>({
    chat: germainChat,
  });

  // Derive live case state from message history
  const caseState = useMemo(() => {
    return messages.length > 0 ? deriveCase(messages) : initialCaseState;
  }, [messages]);

  const currentStepIndex = getCurrentStepIndex(caseState.status);
  const hasMessages = messages.length > 0;

  // Handle tool output from client-interaction tools
  const handleToolOutput = useCallback((toolCallId: string, tool: string, output: unknown) => {
    addToolOutput({
      toolCallId,
      tool: tool as keyof typeof import("@/lib/tools").germainTools,
      state: "output-available",
      output: output as never,
    });
  }, [addToolOutput]);

  // Handle input change
  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Handle suggestion click from empty state
  const handleSuggestion = useCallback((text: string) => {
    setInput(text);
    // Auto-submit after brief delay
    setTimeout(() => {
      sendMessage({ text });
      setInput("");
    }, 100);
  }, [sendMessage]);

  // Handle form submission
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    sendMessage({ text: input });
    setInput("");
  }, [input, status, sendMessage]);

  // Handle keydown for textarea
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && status === "ready") {
        sendMessage({ text: input });
        setInput("");
      }
    }
  }, [input, status, sendMessage]);

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-[#f5f5f5] overflow-hidden">
      {/* Left Sidebar - Step Tracker */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="p-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Germain</span>
          </div>
          <p className="text-xs text-[#737373] mt-1">AI Visa Case Agent</p>
        </div>

        {/* Step Tracker */}
        <div className="flex-1 overflow-y-auto p-4">
          <StepTracker currentStepIndex={currentStepIndex} />
        </div>

        {/* New Case Button */}
        <div className="p-4 border-t border-[#262626]">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1f1f1f] hover:bg-[#262626] rounded-lg text-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            New Case
          </button>
        </div>
      </aside>

      {/* Center - Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
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

        {/* Composer */}
        <div className="p-4 border-t border-[#262626]">
          <form onSubmit={handleSubmit} className="composer">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={status !== "ready" ? "Processing..." : "Ask Germain about your visa case..."}
                disabled={status !== "ready"}
                className="composer-input flex-1"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />

              <button
                type="submit"
                disabled={!input.trim() || status !== "ready"}
                className={`p-2 rounded-lg transition-all ${
                  input.trim() && status === "ready"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-[#262626] text-[#737373] cursor-not-allowed"
                }`}
              >
                {status !== "ready" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="text-xs text-[#737373] mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </form>
        </div>
      </main>

      {/* Right Panel - Case File (Collapsible) */}
      <aside
        className={`border-l border-[#262626] bg-[#0a0a0a] transition-all duration-300 ${
          panelOpen ? "w-80" : "w-12"
        } flex-shrink-0`}
      >
        {panelOpen ? (
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-4 border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3b82f6]" />
                <span className="font-medium">Case File</span>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1 hover:bg-[#1f1f1f] rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-[#737373]" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <CaseFilePanel caseState={caseState} />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setPanelOpen(true)}
            className="w-full h-full flex items-center justify-center hover:bg-[#1f1f1f] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#737373]" />
          </button>
        )}
      </aside>
    </div>
  );
}
