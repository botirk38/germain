import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
  title?: string;
  right?: ReactNode;
  accent?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Panel({ title, right, accent = false, children, style }: PanelProps) {
  return (
    <div style={{
      background: "var(--panel)", border: "1px solid var(--line)",
      borderLeft: accent ? "3px solid var(--brass)" : "1px solid var(--line)",
      borderRadius: "var(--radius-2)", boxShadow: "var(--shadow-card)", ...style,
    }}>
      {title && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: ".22em",
          color: "var(--ink-2)", padding: "6px 10px",
          borderBottom: "1px solid var(--line-soft)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>{title}</span>{right && <span>{right}</span>}
        </div>
      )}
      <div style={{ padding: "7px 10px" }}>{children}</div>
    </div>
  );
}
