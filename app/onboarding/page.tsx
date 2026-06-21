"use client";

import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { OnboardingUIMessage } from "@/lib/agents/onboarding";
import type { RequestDocumentOutput } from "@/lib/tools/onboarding-tools";
import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { SplitFlap } from "@/components/console/SplitFlap";
import { OnboardingMessages } from "@/components/OnboardingMessages";
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
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const chatTransport = new DefaultChatTransport<OnboardingUIMessage>({
  api: "/api/onboarding",
});

const onboardingChat = new Chat<OnboardingUIMessage>({
  transport: chatTransport,
});

export default function OnboardingPage() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const {
    messages,
    status,
    sendMessage,
    addToolOutput,
  } = useChat<OnboardingUIMessage>({
    chat: onboardingChat,
  });

  const busy = status === "submitted" || status === "streaming";

  const handleToolOutput = (toolCallId: string, _toolName: string, output: RequestDocumentOutput) => {
    addToolOutput({
      toolCallId,
      tool: "requestDocument",
      state: "output-available",
      output,
    });
  };

  // Check if onboarding is complete (completeOnboarding tool was called)
  const isComplete = messages.some((m) =>
    m.role === "assistant" &&
    m.parts?.some((p) =>
      "type" in p && p.type === "tool-completeOnboarding" &&
      "state" in p && p.state === "output-available"
    )
  );

  const redirected = useRef(false);
  useEffect(() => {
    if (!isComplete || redirected.current) return;
    redirected.current = true;
    const id = setTimeout(() => router.push("/chat"), 1500);
    return () => clearTimeout(id);
  }, [isComplete, router]);

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim() || busy) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Topbar */}
      <header className="flex items-center gap-4 border-b border-line bg-panel px-5 py-3">
        <MonogramLogo size={28} title="Attache" />
        <span className="wordmark">
          <span className="rim" />
          ATTACHE
        </span>
        <div className="flex-1" />
        <SplitFlap status="intake" />
        <div className="font-mono text-[8.5px] tracking-[0.22em] text-ink2">
          BOARDING
        </div>
      </header>

      {/* Feed */}
      <Conversation className="feed-wrap" style={{ background: "var(--bone)" }}>
        <ConversationContent className="!gap-0 !p-0">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-[680px] flex-col items-center gap-6 px-5 py-16 text-center">
              <MonogramLogo size={48} />
              <h2 className="text-[22px] font-bold text-ink">Welcome to Attache</h2>
              <p className="max-w-[460px] text-[13px] leading-relaxed text-ink2">
                Before we start your visa case, let me learn a little about you.
                This takes about two minutes and helps me prepare everything
                you will need.
              </p>
              <button
                type="button"
                className="btn"
                onClick={() => sendMessage({ text: "Hello, I'd like to start my visa application." })}
              >
                Begin
              </button>
            </div>
          ) : (
            <OnboardingMessages
              messages={messages}
              status={status}
              onToolOutput={handleToolOutput}
            />
          )}
        </ConversationContent>
        <ConversationScrollButton className="scroll-btn" />
      </Conversation>

      {/* Input bar */}
      <PromptInput onSubmit={handleSubmit} className="inputbar">
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "Processing..." : "Reply to Attache..."}
          disabled={busy || isComplete}
          className="prompt-textarea"
        />
        <PromptInputSubmit
          status={status}
          disabled={!input.trim() || busy || isComplete}
          className="ptt disabled:pointer-events-none disabled:opacity-45"
        >
          &#x25b8; SEND
        </PromptInputSubmit>
      </PromptInput>
    </div>
  );
}
