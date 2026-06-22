"use client";

import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { CaseFacts } from "@/components/pages/case/facts";
import { CaseStrip } from "@/components/pages/case/strip";
import { DocChecklist } from "@/components/pages/case/doc-checklist";
import { ProgressRoute } from "@/components/pages/case/progress-route";
import { useCasePage } from "@/hooks/case/use-case-page";

export function CaseSidebar() {
  const { caseState, displayStepIndex, startNewCase } = useCasePage();

  return (
    <aside className="hidden min-[900px]:flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-line bg-panel-dk">
      <div className="border-b border-line px-4 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <MonogramLogo size={30} title="Attaché" />
          <span className="wordmark">
            <span className="rim" />
            ATTACHÉ
          </span>
        </div>
        <div className="mt-2 font-mono text-[8.5px] tracking-[0.26em] text-ink2">AI VISA AGENT</div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <CaseStrip caseState={caseState} />
        <ProgressRoute currentIndex={displayStepIndex} />
        <DocChecklist documents={caseState.documents} />
        <CaseFacts caseState={caseState} />
      </div>

      <div className="border-t border-line p-3">
        <button type="button" onClick={startNewCase} className="btn w-full">
          ↻ NEW CASE
        </button>
      </div>
    </aside>
  );
}
