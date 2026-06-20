"use client";

import { useState } from "react";

interface BrowserPanelProps {
  liveViewUrl: string;
  sessionId: string;
  status: "filling" | "ready_for_review" | "submitted" | "failed";
}

export function BrowserPanel({ liveViewUrl, sessionId, status }: BrowserPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const statusLabel = {
    filling: "AGENT WORKING",
    ready_for_review: "REVIEW REQUIRED",
    submitted: "SUBMITTED",
    failed: "FAILED",
  }[status];

  const statusColor = {
    filling: "var(--amber)",
    ready_for_review: "var(--amber)",
    submitted: "var(--sage)",
    failed: "var(--clay)",
  }[status];

  if (!liveViewUrl) {
    return (
      <article className="card" style={{ marginTop: 8 }}>
        <div className="card-head">
          <span className="font-mono text-[10px] tracking-[0.18em] text-ink2">
            BROWSER SESSION
          </span>
        </div>
        <div style={{ padding: "12px" }}>
          <div className="font-mono text-[10px] tracking-[0.14em]" style={{ color: "var(--ink2)" }}>
            SESSION {sessionId.slice(0, 12)}
          </div>
          <div className="mt-2 text-[12px] text-ink2">
            Browser session created. Live view will appear when the agent begins filling the form.
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card" style={{ marginTop: 8, overflow: "hidden" }}>
      <div
        className="card-head"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="font-mono text-[10px] tracking-[0.18em] text-ink2">
          LIVE BROWSER
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="font-mono text-[9px] tracking-[0.14em]"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </span>
          <span className="text-ink2" style={{ fontSize: 10 }}>
            {expanded ? "▼" : "▶"}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%" }}>
          <iframe
            src={liveViewUrl}
            title="Browser Use live view"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
              background: "var(--panel-dk)",
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      <div style={{ padding: "6px 12px", borderTop: "1px solid var(--line)" }}>
        <span className="font-mono text-[9px] tracking-[0.14em] text-ink2">
          SESSION {sessionId.slice(0, 12)}
        </span>
      </div>
    </article>
  );
}
