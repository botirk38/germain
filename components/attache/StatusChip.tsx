import type { CSSProperties } from "react";

type StatusKey = "good" | "attention" | "problem" | "missing" | "received" | "waiting";

const STATUS: Record<StatusKey, { glyph: string; word: string; color: string }> = {
  good:      { glyph: "\u25CF", word: "Verified",   color: "var(--sage)" },
  attention: { glyph: "\u25B2", word: "Check this", color: "var(--amber)" },
  problem:   { glyph: "\u2715", word: "Problem",    color: "var(--clay)" },
  missing:   { glyph: "\u2014", word: "Missing",    color: "var(--amber)" },
  received:  { glyph: "\u25CB", word: "Received",   color: "var(--ink-2)" },
  waiting:   { glyph: "",       word: "Waiting",    color: "var(--ink-3)" },
};

interface StatusChipProps {
  status?: StatusKey;
  label?: string;
  lamp?: boolean;
  style?: CSSProperties;
}

export function StatusChip({ status = "waiting", label, lamp = false, style }: StatusChipProps) {
  const s = STATUS[status] ?? STATUS.waiting;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".08em",
      color: s.color, ...style,
    }}>
      {lamp && <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: status === "waiting" ? "#cdc6b6" : s.color,
        boxShadow: status === "waiting" ? "none" : `0 0 5px ${s.color}`,
      }} />}
      {(s.glyph ? s.glyph + " " : "") + (label ?? s.word)}
    </span>
  );
}
