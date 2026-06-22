"use client";

import { ChatMessages } from "@/components/ChatMessages";
import { EmptyState } from "@/components/EmptyState";
import { useCasePage } from "@/components/pages/case/case-page-provider";

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
