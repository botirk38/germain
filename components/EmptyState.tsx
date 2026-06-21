"use client";

import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { StatusMark } from "@/components/attache/StatusMark";
import type { StatusWord } from "@/lib/attache-display";

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  {
    text: "Tourist visa — US to Germany",
    value: "I need a tourist visa for Germany. I'm a US citizen planning to visit Berlin for a week in January.",
  },
  {
    text: "Business visa — conference in Frankfurt",
    value: "I need a business visa for a conference in Frankfurt. I work for a tech company.",
  },
  {
    text: "Student visa — studying abroad",
    value: "I'm applying for a student visa to study in Germany. What documents do I need?",
  },
];

const VOCAB_WORDS: StatusWord[] = [
  "verified",
  "check",
  "problem",
  "missing",
  "received",
  "waiting",
];

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-xl">
        {/* Monogram + wordmark */}
        <MonogramLogo size={64} title="Attaché" />
        <span className="wordmark mt-5">
          ATTACHÉ
          <span className="rim" aria-hidden="true" />
        </span>

        {/* Kicker */}
        <p className="kicker mt-6">AI VISA AGENT</p>

        {/* Heading + description */}
        <h1 className="text-3xl font-bold mt-3">Ready when you are.</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink2">
          Tell me where you&apos;re going and I&apos;ll handle the rest —
          documents, forms, appointments, and monitoring until you have a
          decision.
        </p>

        {/* Suggestion chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestion(suggestion.value)}
              className="chip"
            >
              {suggestion.text}
            </button>
          ))}
        </div>

        {/* Status vocabulary strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line pt-4">
          {VOCAB_WORDS.map((word) => (
            <StatusMark key={word} word={word} className="text-[10.5px] tracking-[0.08em]" />
          ))}
        </div>
      </div>
    </div>
  );
}
