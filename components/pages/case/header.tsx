"use client";

import { CautionLamp } from "@/components/pages/case/caution-lamp";
import { SplitFlap } from "@/components/pages/case/split-flap";
import { useCasePage } from "@/hooks/case/use-case-page";

export function CaseHeader() {
  const { actionNeeded, caseState } = useCasePage();

  return (
    <header className="flex items-center gap-4 border-b border-line bg-panel px-5 py-3">
      <div>
        <SplitFlap status={caseState.status} />
        <div className="flap-label" style={{ marginTop: 6 }}>
          CASE STATUS
        </div>
      </div>
      <div className="flex-1" />
      <CautionLamp on={actionNeeded} />
      {caseState.referenceNumber ? (
        <div className="font-mono text-[10px] tracking-[0.14em] text-ink2">
          REF <b className="text-ink">{caseState.referenceNumber}</b>
        </div>
      ) : null}
    </header>
  );
}
