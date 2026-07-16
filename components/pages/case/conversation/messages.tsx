"use client";

import type { EveMessage, InputResponse } from "eve/client";
import { Fragment } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import type { UploadedDocument } from "@/hooks/case/use-case-page";
import { DynamicToolPart } from "./tool-card";

interface ChatMessagesProps {
  readonly messages: readonly EveMessage[];
  readonly status: string;
  readonly isSubmitting: boolean;
  readonly onDocuments: (documents: readonly UploadedDocument[]) => void;
  readonly onInputResponse: (response: InputResponse) => void;
}

function userText(message: EveMessage): string {
  return message.parts
    .filter((part): part is Extract<(typeof message.parts)[number], { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function hasVisibleContent(message: EveMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text") return Boolean(part.text);
    return part.type === "dynamic-tool";
  });
}

export function ChatMessages({ messages, status, isSubmitting, onDocuments, onInputResponse }: ChatMessagesProps) {
  return (
    <Conversation className="h-full">
      <ConversationContent className="feed gap-0 p-0">
        {messages.map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <Message from="user" className="msg user max-w-none">
                <MessageContent className="bubble">{userText(message)}</MessageContent>
              </Message>
            ) : null}

            {message.role === "assistant" && hasVisibleContent(message) ? (
              <Message from="assistant" className="msg max-w-none">
                <div className="callsign" aria-hidden="true">
                  A
                </div>
                <MessageContent className="body w-full">
                  {message.parts.map((part, index) => {
                    const key = `${message.id}-${index}`;
                    if (part.type === "text") {
                      return part.text ? <MessageResponse key={key} className="sd">{part.text}</MessageResponse> : null;
                    }
                    if (part.type === "dynamic-tool") {
                      return (
                        <DynamicToolPart
                          key={key}
                          part={part}
                          isSubmitting={isSubmitting}
                          onDocuments={onDocuments}
                          onInputResponse={onInputResponse}
                        />
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ) : null}
          </Fragment>
        ))}

        {status === "streaming" ? (
          <Message from="assistant" className="msg typing max-w-none">
            <div className="callsign" aria-hidden="true">
              A
            </div>
            <MessageContent className="body w-full">
              <span className="t">
                ATTACHE IS TYPING <span className="cursor">▌</span>
              </span>
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton className="border-line bg-[var(--bone)] text-ink hover:bg-[var(--tint)]" />
    </Conversation>
  );
}
