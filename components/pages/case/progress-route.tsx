import { DISPLAY_STEPS } from "@/components/attache/display";

// Vertical route progress: sage-filled nodes for done legs, brass halo for the
// current leg, hollow nodes for what's ahead.
export function ProgressRoute({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span>PROGRESS</span>
        <span>
          STEP {currentIndex + 1}/{DISPLAY_STEPS.length}
        </span>
      </div>
      <div className="panel-body">
        <ul className="route">
          {DISPLAY_STEPS.map((step, i) => (
            <li
              key={step}
              className={
                i < currentIndex ? "done" : i === currentIndex ? "current" : undefined
              }
            >
              <span className="node" />
              <span>{step.toUpperCase()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
