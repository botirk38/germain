import type { ReactNode } from "react";

// Telex-card primitives matching the .card family in the ops stylesheet.

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={className ? `card ${className}` : "card"}>
      {children}
    </article>
  );
}

export function CardHead({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="card-head" style={{ textTransform: "uppercase" }}>
      <span>{children}</span>
      {right != null ? <span>{right}</span> : null}
    </div>
  );
}

export function CardFoot({ children }: { children: ReactNode }) {
  return <div className="card-foot">{children}</div>;
}

// Checklist row: label · dotted leader · state. Matches the .cl-row pattern.
export function ClRow({
  label,
  state,
  critical,
}: {
  label: ReactNode;
  state: ReactNode;
  critical?: boolean;
}) {
  return (
    <div className="cl-row">
      <span style={critical ? { fontWeight: 700 } : undefined}>
        {label}
        {critical ? (
          <span aria-label="critical" style={{ color: "var(--clay)" }}>
            {" "}
            *
          </span>
        ) : null}
      </span>
      <span className="dots" />
      <span className="state">{state}</span>
    </div>
  );
}
