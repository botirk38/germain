"use client";

import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { OnboardingUIMessage } from "@/lib/agents/onboarding";
import type { RequestDocumentOutput } from "@/lib/tools/onboarding-tools";
import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { SplitFlap } from "@/components/console/SplitFlap";
import { OnboardingMessages } from "@/components/OnboardingMessages";
import { useState, useEffect, useRef, type FormEvent, type ChangeEvent, type KeyboardEvent } from "react";
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
    error,
    sendMessage,
    regenerate,
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

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !busy) {
        sendMessage({ text: input });
        setInput("");
      }
    }
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
      <div className="feed-wrap" style={{ background: "var(--bone)" }}>
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
      <form onSubmit={handleSubmit} className="inputbar">
        <div className="input-inner">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={busy ? "Processing..." : "Reply to Attache..."}
            disabled={busy || isComplete}
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
            disabled={!input.trim() || busy || isComplete}
            className="ptt disabled:pointer-events-none disabled:opacity-45"
          >
            &#x25b8; SEND
          </button>
        </div>
      </form>
    </div>
  );
}
