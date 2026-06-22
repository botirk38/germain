"use client";

import { ChatMessages } from "@/components/pages/case/chat-messages";
import { EmptyState } from "@/components/pages/case/empty-state";
import { useCasePage } from "@/hooks/case/use-case-page";

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
    </div>
  );
}
