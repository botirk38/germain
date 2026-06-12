import type { CSSProperties } from "react";
import {
  STATUS_WORD_META,
  type StatusTone,
  type StatusWord,
} from "@/lib/attache-display";

// Single source of truth for rendering the status vocabulary:
// mark + word, never color alone.
const TONE_STYLE: Record<StatusTone, CSSProperties> = {
  sage: { color: "var(--sage)" },
  amber: { color: "var(--amber)" },
  clay: { color: "var(--clay)" },
  dim: { color: "var(--ink2)", opacity: 0.6 },
  plain: { color: "var(--ink-3, var(--ink2))" },
};

export function StatusMark({
  word,
  className,
}: {
  word: StatusWord;
  className?: string;
}) {
  const meta = STATUS_WORD_META[word];
  return (
    <span
      className={className ? `font-mono ${className}` : "font-mono"}
      style={TONE_STYLE[meta.tone]}
    >
      {meta.mark ? `${meta.mark} ${meta.label}` : meta.label}
    </span>
  );
}
