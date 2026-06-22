"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCasePage } from "@/hooks/case/use-case-page";
import { EmptyState } from "./empty";
import { ChatMessages } from "./messages";

function ConversationError() {
  const { agent } = useCasePage();
  if (!agent.error) return null;

  return (
    <div style={{ background: "var(--bone)" }} className="px-5 pb-3">
      <Alert variant="destructive" className="mx-auto max-w-[680px] border-clay bg-[var(--tint-problem)] font-mono tracking-[0.04em]">
        <AlertTitle className="text-[10.5px] uppercase text-clay">Problem</AlertTitle>
        <AlertDescription className="text-[10.5px] text-ink2">{agent.error.message}</AlertDescription>
      </Alert>
    </div>
  );
}

export function CaseConversation() {
  const { agent, recordDocuments, respondToInput, sendText } = useCasePage();
  const messages = agent.data.messages;

  return (
    <div className="feed-wrap" style={{ background: "var(--bone)" }}>
      {messages.length === 0 ? (
        <EmptyState onSuggestion={sendText} />
      ) : (
        <ChatMessages
          messages={messages}
          status={agent.status}
          onDocuments={recordDocuments}
          onInputResponse={respondToInput}
        />
      )}
      <ConversationError />
    </div>
  );
}
