"use client";

import { WORKFLOW_STEPS } from "@/lib/germain-types";
import { Check, Circle, Loader2 } from "lucide-react";

interface StepTrackerProps {
  currentStepIndex: number;
}

export function StepTracker({ currentStepIndex }: StepTrackerProps) {
  return (
    <div className="step-tracker">
      <div className="text-xs font-medium text-[#737373] uppercase tracking-wider mb-3">
        12-Step Process
      </div>

      {WORKFLOW_STEPS.map((step, index) => {
        const isComplete = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        const _isPending = index > currentStepIndex;

        return (
          <div
            key={step.key}
            className={`step-item ${isActive ? "step-item--active" : ""} ${
              isComplete ? "step-item--complete" : ""
            }`}
          >
            <div
              className={`step-indicator ${
                isComplete
                  ? "step-indicator--complete"
                  : isActive
                  ? "step-indicator--active"
                  : "step-indicator--pending"
              }`}
            >
              {isComplete ? (
                <Check className="w-3 h-3" />
              ) : isActive ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{step.label}</div>
              {step.oddsContribution > 0 && (
                <div className="text-xs text-[#737373]">
                  +{step.oddsContribution}% odds
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-[#262626]">
        <div className="text-xs text-[#737373] space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full border border-[#737373]" />
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
