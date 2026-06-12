"use client";

import type { ReactNode } from "react";

// Mechanical key button (.key): mono bold uppercase, brass border,
// 0 2px brass shadow; pressing it sinks the key (handled by .key:active).
export function KeyButton({
  children,
  onClick,
  disabled,
  submittingLabel,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  submittingLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className ? `key ${className}` : "key"}
      onClick={onClick}
      disabled={disabled}
      style={{
        textTransform: "uppercase",
        ...(disabled ? { opacity: 0.55, cursor: "default" } : null),
      }}
    >
      {disabled && submittingLabel ? submittingLabel : children}
    </button>
  );
}
