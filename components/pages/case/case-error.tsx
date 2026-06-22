"use client";

import { useCasePage } from "@/components/pages/case/case-page-provider";

export function CaseError() {
  const { agent } = useCasePage();
  if (!agent.error) return null;

  return (
    <div style={{ background: "var(--bone)" }} className="px-5 pb-3">
      <div
        role="alert"
        className="mx-auto flex max-w-[680px] items-center gap-3 px-3 py-2 font-mono text-[10.5px] tracking-[0.04em]"
        style={{
          background: "var(--tint-problem)",
          border: "1px solid var(--clay)",
        }}
      >
        <span style={{ color: "var(--clay)" }}>X Problem</span>
        <span className="flex-1 text-ink2">{agent.error.message}</span>
      </div>
    </div>
  );
}
