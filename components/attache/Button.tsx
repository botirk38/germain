import type { ButtonHTMLAttributes, CSSProperties } from "react";

type ButtonVariant = "key" | "quiet" | "reply";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  picked?: boolean;
}

const BASE: CSSProperties = {
  fontFamily: "var(--font-mono)",
  cursor: "pointer",
  transition: ".2s",
  borderRadius: "var(--radius-1)",
};

const VARIANTS: Record<ButtonVariant, (picked: boolean) => CSSProperties> = {
  key: () => ({
    fontWeight: 700, fontSize: 11, letterSpacing: ".12em", color: "var(--ink)",
    background: "linear-gradient(180deg,#f3efe6,#e7e0d0)",
    border: "1px solid var(--brass)", padding: "10px 16px",
    boxShadow: "var(--shadow-key)", borderRadius: "3px",
  }),
  quiet: () => ({
    fontSize: 10, letterSpacing: ".1em", color: "var(--ink)",
    background: "var(--panel)", border: "1px solid var(--line)", padding: "7px 11px",
    boxShadow: "0 1px 0 rgba(255,255,255,.5) inset",
  }),
  reply: (picked) => ({
    fontSize: 10, letterSpacing: ".04em",
    color: picked ? "#fff" : "var(--ink)",
    background: picked ? "var(--brass)" : "var(--panel)",
    border: `1px ${picked ? "solid" : "dashed"} var(--brass)`,
    padding: "7px 10px",
  }),
};

export function Button({ variant = "quiet", picked = false, style, children, ...rest }: ButtonProps) {
  return (
    <button style={{ ...BASE, ...VARIANTS[variant](picked), ...style }} {...rest}>
      {children}
    </button>
  );
}
