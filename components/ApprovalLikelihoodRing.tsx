"use client";

import { useEffect, useState } from "react";

interface ApprovalLikelihoodRingProps {
  percentage: number;
  size?: number;
}

export function ApprovalLikelihoodRing({
  percentage,
  size = 80,
}: ApprovalLikelihoodRingProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    // Animate from 0 to target
    const timeout = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  const getColorClass = () => {
    if (percentage >= 80) return "odds-ring-fill--high";
    if (percentage >= 50) return "odds-ring-fill--medium";
    return "odds-ring-fill--low";
  };

  return (
    <div className="odds-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          className="odds-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress circle */}
        <circle
          className={`odds-ring-fill ${getColorClass()}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />
      </svg>
      <div className="odds-ring-content">
        <div className={`odds-ring-value ${getColorClass().replace("odds-ring-fill", "text")}`}>
          {percentage}%
        </div>
        <div className="odds-ring-label">Approval</div>
      </div>
    </div>
  );
}
