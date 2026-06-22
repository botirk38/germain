"use client";

import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCasePage } from "@/hooks/case/use-case-page";
import { CaseFacts } from "./facts";
import { CaseStrip } from "./strip";
import { DocChecklist } from "./doc-checklist";
import { ProgressRoute } from "./progress-route";

function MobileCaseSummary() {
  const { caseState, displayStepIndex, startNewCase } = useCasePage();

  return (
    <section className="border-b border-line bg-panel-dk px-4 py-3 min-[900px]:hidden" aria-label="Case summary">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-ink2">Case route</div>
          <div className="mt-1 text-sm font-semibold text-ink">
            {caseState.destinationCountry || "Destination pending"}
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="btn h-auto">
              View case
              <Badge variant="secondary" className="ml-1 font-mono uppercase">
                {caseState.documents.length} docs
              </Badge>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto border-line bg-panel-dk p-0 text-ink">
            <SheetHeader className="border-b border-line p-4 text-left">
              <SheetTitle className="font-mono text-xs uppercase tracking-[0.22em] text-ink">
                Case Console
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 p-3">
              <CaseStrip caseState={caseState} />
              <ProgressRoute currentIndex={displayStepIndex} />
              <DocChecklist documents={caseState.documents} />
              <CaseFacts caseState={caseState} />
              <Button type="button" variant="outline" onClick={startNewCase} className="btn w-full">
                ↻ NEW CASE
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="mt-3">
        <ProgressRoute currentIndex={displayStepIndex} />
      </div>
    </section>
  );
}

export function CaseSidebar() {
  const { caseState, displayStepIndex, startNewCase } = useCasePage();

  return (
    <>
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
          <Button type="button" variant="outline" onClick={startNewCase} className="btn w-full">
            ↻ NEW CASE
          </Button>
        </div>
      </aside>
      <MobileCaseSummary />
    </>
  );
}
