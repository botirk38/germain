import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { MiniCard } from "@/components/pages/onboarding/mini-card";

export function Intro() {
  return (
    <section className="border border-line bg-panel-dk p-5 shadow-sm lg:sticky lg:top-5 lg:h-fit">
      <div className="flex items-center gap-3">
        <MonogramLogo size={34} title="Attaché" />
        <div>
          <div className="wordmark">
            <span className="rim" />
            ATTACHÉ
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-ink2">core documents</div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Takes about 30 seconds</p>
        <h1 className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em] text-ink">
          Start with the document every case needs.
        </h1>
        <p className="max-w-sm text-sm leading-6 text-ink2">
          Attaché keeps the first step application-agnostic. Record your passport now, then choose the visa route.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-2">
        <MiniCard label="Step 1" value="Passport" />
        <MiniCard label="Step 2" value="Visa" />
        <MiniCard label="Step 3" value="Case" />
      </div>
    </section>
  );
}
