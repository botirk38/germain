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
          <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-ink2">visa intake</div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Takes about 90 seconds</p>
        <h1 className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em] text-ink">
          Start with only the details Attaché needs.
        </h1>
        <p className="max-w-sm text-sm leading-6 text-ink2">
          A short intake is faster than a chat interview. You can add documents and edge cases after the visa plan starts.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-2">
        <MiniCard label="Step 1" value="Profile" />
        <MiniCard label="Step 2" value="Trip" />
        <MiniCard label="Step 3" value="Risk" />
      </div>
    </section>
  );
}
