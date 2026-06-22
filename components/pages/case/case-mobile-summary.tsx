"use client";

import { ProgressRoute } from "@/components/console/ProgressRoute";
import { useCasePage } from "@/components/pages/case/case-page-provider";

export function CaseMobileSummary() {
  const { caseState, displayStepIndex } = useCasePage();

  return (
    <section className="border-b border-line bg-panel-dk px-4 py-3 min-[900px]:hidden" aria-label="Case summary">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-ink2">Case route</div>
          <div className="mt-1 text-sm font-semibold text-ink">
            {caseState.destinationCountry || "Destination pending"}
          </div>
        </div>
        <div className="text-right font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
          {caseState.documents.length} docs
        </div>
      </div>
      <div className="mt-3">
        <ProgressRoute currentIndex={displayStepIndex} />
      </div>
    </section>
  );
}
