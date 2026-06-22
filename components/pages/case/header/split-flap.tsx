"use client";

import { useEffect, useRef, useState } from "react";
import { splitFlapWord, type CaseStatus } from "@/components/attache/display";

const CELL_COUNT = 10;

// Split-flap status display: fixed 10 dark mono cells. On word change every
// cell remounts with a staggered flapflip animation (~40ms per cell).
export function SplitFlap({ status }: { status: CaseStatus }) {
  const word = splitFlapWord(status).padEnd(CELL_COUNT, " ").slice(0, CELL_COUNT);
  const prevWord = useRef(word);
  const [flipGen, setFlipGen] = useState(0);

  useEffect(() => {
    if (prevWord.current !== word) {
      prevWord.current = word;
      setFlipGen((g) => g + 1);
    }
  }, [word]);

  return (
    <div className="flap" role="status" aria-label={word.trim()}>
      {Array.from({ length: CELL_COUNT }, (_, i) => (
        <span
          key={`${flipGen}-${i}`}
          className={flipGen > 0 ? "cell flip" : "cell"}
          style={flipGen > 0 ? { animationDelay: `${i * 40}ms` } : undefined}
          aria-hidden
        >
          {word[i] === " " ? " " : word[i]}
        </span>
      ))}
    </div>
  );
}
