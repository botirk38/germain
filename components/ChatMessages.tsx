"use client";

import type { GermainUIMessage } from "@/lib/agents/germain";
import { ToolCard } from "./ToolCard";
import { Markdown } from "./attache/Markdown";
import { Fragment } from "react";
import { isToolUIPart, getToolName, type ToolUIPart } from "ai";

interface ChatMessagesProps {
  messages: GermainUIMessage[];
  status: string;
  onToolOutput: (toolCallId: string, toolName: string, output: unknown) => void;
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

                  // Use v6 helpers to extract tool info
                  const toolName = getToolName(part);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const toolPart = part as ToolUIPart<any>;

                  // Tool state and data are directly on the part in v6
                  const toolInvocation = {
                    toolCallId: toolPart.toolCallId,
                    toolName,
                    state: toolPart.state as "input-streaming" | "input-available" | "output-available",
                    input: toolPart.input,
                    output: toolPart.output,
                  };

                  return (
                    <ToolCard
                      key={`${message.id}-tool-${partIndex}`}
                      invocation={toolInvocation}
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
