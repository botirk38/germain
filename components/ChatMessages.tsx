"use client";

import type { GermainUIMessage } from "@/lib/agents/germain";
import { ToolCard } from "./ToolCard";
import { User, Bot } from "lucide-react";
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
    <div className="p-4 space-y-4">
      {messages.map((message) => (
        <Fragment key={message.id}>
          {message.role === "user" && (
            <div className="flex gap-3 justify-end">
              <div className="message-user max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 opacity-70">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium">You</span>
                </div>
                <div className="text-sm">{getMessageText(message)}</div>
              </div>
            </div>
          )}

          {message.role === "assistant" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#a3a3a3]">Germain</span>
                </div>

                {/* Text content */}
                {getMessageText(message) && (
                  <div className="message-assistant text-sm mb-2">
                    {getMessageText(message)}
                  </div>
                )}

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

      {/* Loading indicator */}
      {status === "streaming" && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2 text-[#737373]">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#737373] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#737373] rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-2 h-2 bg-[#737373] rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
            <span className="text-sm">Germain is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
}
