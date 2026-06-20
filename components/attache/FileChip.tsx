import type { CSSProperties } from "react";

interface FileChipProps {
  name: string;
  style?: CSSProperties;
}

export function FileChip({ name, style }: FileChipProps) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".02em",
      color: "var(--ink)", background: "var(--bone)",
      border: "1px solid var(--line)", borderRadius: "var(--radius-1)",
      padding: "5px 8px", display: "inline-flex", alignItems: "center", gap: 5,
      ...style,
    }}>
      <span style={{ color: "var(--brass)" }}>{"\u25A3"}</span>{name}
    </span>
  );
}
