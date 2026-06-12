"use client";

import type { GermainUIMessage } from "@/lib/agents/germain";
import type { GermainClientToolResult } from "@/lib/tools";
import { ToolPartRenderer } from "./ToolCard";
import { Markdown } from "./attache/Markdown";
import { Fragment } from "react";
import { isToolUIPart } from "ai";

interface ChatMessagesProps {
  messages: GermainUIMessage[];
  status: string;
  onToolOutput: (result: GermainClientToolResult) => void;
}

// Helper to extract text from message parts
function getMessageText(message: GermainUIMessage): string {
  if (!message.parts) return "";

  const textParts = message.parts.filter((part): part is { type: "text"; text: string } =>
    part.type === "text"
  );
  return textParts.map((part) => part.text).join("");
}

export function ChatMessages({ messages, status, onToolOutput }: ChatMessagesProps) {
  return (
    <div className="feed">
      {messages.map((message) => (
        <Fragment key={message.id}>
          {message.role === "user" && (
            <div className="msg user">
              <div className="bubble">{getMessageText(message)}</div>
            </div>
          )}

          {message.role === "assistant" && (
            <div className="msg">
              <div className="callsign" aria-hidden="true">
                A
              </div>
              <div className="body">
                {/* Text content */}
                {getMessageText(message) && <Markdown text={getMessageText(message)} />}

                {/* Tool invocations - v6 API */}
                {message.parts?.map((part, partIndex) => {
                  if (!isToolUIPart(part)) return null;

                  return (
                    <ToolPartRenderer
                      key={`${message.id}-tool-${partIndex}`}
                      part={part}
                      onOutput={onToolOutput}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* System messages (context) - hidden */}
          {message.role === "system" && null}
        </Fragment>
      ))}

      {/* Streaming indicator */}
      {status === "streaming" && (
        <div className="msg typing">
          <div className="callsign" aria-hidden="true">
            A
          </div>
          <div className="body">
            <span className="t">
              ATTACHÉ IS TYPING <span className="cursor">▌</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
