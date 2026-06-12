// Brass monogram: rounded-square rim with inner offset outline (the wordmark
// rim aesthetic) around a geometric stroked letter A. Crisp from 26 to 64px.
export function MonogramLogo({
  size = 34,
  title,
  className,
}: {
  size?: number;
  title?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className ? `text-brass ${className}` : "text-brass"}
      style={{ color: "var(--brass)" }}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {/* outer rim */}
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* inner offset outline, like the wordmark rim */}
      <rect
        x="8.5"
        y="8.5"
        width="47"
        height="47"
        rx="5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      {/* geometric A */}
      <path
        d="M20 46 L32 18 L44 46"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 37 H39"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
