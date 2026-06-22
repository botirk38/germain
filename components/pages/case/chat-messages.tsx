"use client";

import type { EveMessage, InputResponse } from "eve/client";
import { Fragment } from "react";
import { Markdown } from "@/components/attache/Markdown";
import { DynamicToolPart } from "@/components/pages/case/tool-card";

type UploadedDocument = {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly status: "uploaded";
};

interface ChatMessagesProps {
  readonly messages: readonly EveMessage[];
  readonly status: string;
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

export function ChatMessages({ messages, status, onDocuments, onInputResponse }: ChatMessagesProps) {
  return (
    <div className="feed">
      {messages.map((message) => (
        <Fragment key={message.id}>
          {message.role === "user" ? (
            <div className="msg user">
              <div className="bubble">{userText(message)}</div>
            </div>
          ) : null}

          {message.role === "assistant" && hasVisibleContent(message) ? (
            <div className="msg">
              <div className="callsign" aria-hidden="true">
                A
              </div>
              <div className="body">
                {message.parts.map((part, index) => {
                  const key = `${message.id}-${index}`;
                  if (part.type === "text") {
                    return part.text ? <Markdown key={key} text={part.text} /> : null;
                  }
                  if (part.type === "dynamic-tool") {
                    return (
                      <DynamicToolPart
                        key={key}
                        part={part}
                        onDocuments={onDocuments}
                        onInputResponse={onInputResponse}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ) : null}
        </Fragment>
      ))}

      {status === "streaming" ? (
        <div className="msg typing">
          <div className="callsign" aria-hidden="true">
            A
          </div>
          <div className="body">
            <span className="t">
              ATTACHE IS TYPING <span className="cursor">▌</span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
