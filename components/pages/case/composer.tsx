"use client";

import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useCasePage } from "@/hooks/case/use-case-page";

export function CaseComposer() {
  const { pendingHumanInput, requestBusy, sendText } = useCasePage();
  const [input, setInput] = useState("");

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const submitInput = () => {
    if (!input.trim() || requestBusy) return;
    const text = input.trim();
    setInput("");
    sendText(text);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitInput();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submitInput();
  };

  return (
    <form onSubmit={handleSubmit} className="inputbar">
      <div className="input-inner">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={requestBusy ? "Processing..." : pendingHumanInput ? "Approve or deny the pending action above..." : "Tell me about your trip..."}
          aria-label="Message Attaché"
          disabled={requestBusy || pendingHumanInput}
          rows={1}
          className="max-h-[200px] flex-1 resize-none border-none bg-transparent font-mono text-[11.5px] tracking-[0.06em] text-ink outline-none placeholder:text-ink2 placeholder:opacity-60 disabled:opacity-60"
          onInput={(event) => {
            const target = event.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || requestBusy || pendingHumanInput}
          className="ptt disabled:pointer-events-none disabled:opacity-45"
        >
          ▸ SEND
        </button>
      </div>
      <div className="mx-auto mt-2 max-w-[680px] text-center font-mono text-[8.5px] tracking-[0.16em] text-ink2 opacity-70">
        ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
      </div>
    </form>
  );
}
