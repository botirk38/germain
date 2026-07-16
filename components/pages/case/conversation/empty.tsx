"use client";

import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { StatusMark } from "@/components/attache/StatusMark";
import type { StatusWord } from "@/components/attache/display";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  {
    text: "France visitor visa — first trip",
    value: "I need a France Schengen short-stay visitor visa for tourism. I'm planning a one-week trip to Paris.",
  },
  {
    text: "France tourism — documents",
    value: "I'm applying for a France Schengen visitor visa for tourism. What documents should I prepare first?",
  },
  {
    text: "France short stay — timeline",
    value: "I want to visit France for fewer than 90 days. Can you help me understand the timeline and next steps?",
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
    <Empty className="h-full border-none px-4">
      <EmptyHeader className="max-w-xl">
        {/* Monogram + wordmark */}
        <MonogramLogo size={64} title="Attaché" />
        <span className="wordmark mt-5">
          ATTACHÉ
          <span className="rim" aria-hidden="true" />
        </span>

        {/* Kicker */}
        <p className="kicker mt-6">AI VISA AGENT</p>

        {/* Heading + description */}
        <EmptyTitle className="mt-3 text-3xl font-bold text-ink">Ready when you are.</EmptyTitle>
        <EmptyDescription className="mt-3 max-w-md text-[15px] leading-relaxed text-ink2">
          Tell me where you&apos;re going and I&apos;ll handle the rest —
          documents, forms, appointments, and monitoring until you have a
          decision.
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <Suggestions className="justify-center">
          {SUGGESTIONS.map((suggestion, index) => (
            <Suggestion
              key={index}
              suggestion={suggestion.value}
              onClick={onSuggestion}
              className="chip h-auto"
            >
              {suggestion.text}
            </Suggestion>
          ))}
        </Suggestions>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line pt-4">
          {VOCAB_WORDS.map((word) => (
            <StatusMark key={word} word={word} className="text-[10.5px] tracking-[0.08em]" />
          ))}
        </div>
      </EmptyContent>
    </Empty>
  );
}
