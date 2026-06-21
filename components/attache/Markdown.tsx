"use client";

import { MessageResponse } from "@/components/ai-elements/message";

// Thin wrapper that renders AI SDK's Streamdown-powered markdown
// inside the Attache design system. The `.sd` class hooks into the
// Attache overrides defined in globals.css (brass list numbers, sage
// bullets, clay-tinted code blocks, etc.).

export function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <MessageResponse className={className ? `sd ${className}` : "sd"}>
      {text}
    </MessageResponse>
  );
}
