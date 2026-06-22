"use client";

import { useEffect, useState } from "react";

interface ApprovalLikelihoodRingProps {
  likelihood: number;
  size?: number;
}

// Approval-odds ring in the ops-console skin: faint line track, status-toned
// progress arc (sage / amber / clay), mono bold percent in the center.
export function ApprovalLikelihoodRing({
  likelihood,
  size = 84,
}: ApprovalLikelihoodRingProps) {
  const [animatedLikelihood, setAnimatedLikelihood] = useState(0);

  useEffect(() => {
    // Animate from 0 to target
    const timeout = setTimeout(() => {
      setAnimatedLikelihood(likelihood);
    }, 100);
    return () => clearTimeout(timeout);
  }, [likelihood]);

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (animatedLikelihood / 100) * circumference;

  const tone =
    likelihood >= 70 ? "var(--sage)" : likelihood >= 45 ? "var(--amber)" : "var(--clay)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={2}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono font-bold text-ink"
          style={{ fontSize: Math.round(size * 0.21) }}
        >
          {likelihood}%
        </span>
      </div>
    </div>
  );
}
