"use client";

import type { OnboardingUIMessage } from "@/lib/agents/onboarding";
import type { RequestDocumentOutput } from "@/lib/tools/onboarding-tools";
import { Markdown } from "./attache/Markdown";
import { Fragment, useRef } from "react";
import { isToolUIPart, getToolName } from "ai";

interface OnboardingMessagesProps {
  messages: OnboardingUIMessage[];
  status: string;
  onToolOutput: (toolCallId: string, toolName: string, output: RequestDocumentOutput) => void;
}

function getMessageText(message: OnboardingUIMessage): string {
  if (!message.parts) return "";
  const textParts = message.parts.filter(
    (part): part is { type: "text"; text: string } => part.type === "text"
  );
  return textParts.map((part) => part.text).join("");
}

export function OnboardingMessages({ messages, status, onToolOutput }: OnboardingMessagesProps) {
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
                {getMessageText(message) && <Markdown text={getMessageText(message)} />}

                {message.parts?.map((part, partIndex) => {
                  if (!isToolUIPart(part)) return null;
                  const toolName = getToolName(part);

                  // saveProfile and completeOnboarding are server tools — show confirmation
                  if (toolName === "saveProfile" && part.state === "output-available") {
                    return (
                      <div
                        key={`${message.id}-tool-${partIndex}`}
                        className="card"
                        style={{ padding: "8px 12px", marginTop: 8 }}
                      >
                        <span className="font-mono text-[10px] tracking-[0.18em] text-ink2">
                          PROFILE UPDATED
                        </span>
                      </div>
                    );
                  }

                  if (toolName === "completeOnboarding" && part.state === "output-available") {
                    return (
                      <div
                        key={`${message.id}-tool-${partIndex}`}
                        className="card"
                        style={{
                          padding: "12px 16px",
                          marginTop: 8,
                          borderLeft: "4px solid var(--sage)",
                        }}
                      >
                        <div className="font-mono text-[10px] tracking-[0.18em]" style={{ color: "var(--sage)" }}>
                          ONBOARDING COMPLETE
                        </div>
                        <div className="mt-1 text-[12px] text-ink2">
                          Redirecting to the console...
                        </div>
                      </div>
                    );
                  }

                  // requestDocument is a client tool — render file upload
                  if (toolName === "requestDocument" && part.state !== "output-available") {
                    const toolInput = "input" in part ? (part.input as Record<string, unknown>) : {};
                    return (
                      <OnboardingDocUpload
                        key={`${message.id}-tool-${partIndex}`}
                        reason={(toolInput.reason as string) || "Please upload the requested document."}
                        documentType={(toolInput.documentType as string) || "passport"}
                        toolCallId={"toolCallId" in part ? (part.toolCallId as string) : ""}
                        toolName={toolName}
                        onToolOutput={onToolOutput}
                      />
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          )}
        </Fragment>
      ))}

      {status === "streaming" && (
        <div className="msg typing">
          <div className="callsign" aria-hidden="true">
            A
          </div>
          <div className="body">
            <span className="t">
              ATTACHE IS TYPING <span className="cursor">&#x258c;</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardingDocUpload({
  reason,
  documentType,
  toolCallId,
  toolName,
  onToolOutput,
}: {
  reason: string;
  documentType: string;
  toolCallId: string;
  toolName: string;
  onToolOutput: (toolCallId: string, toolName: string, output: RequestDocumentOutput) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="card" style={{ marginTop: 8 }}>
      <div className="card-head">
        <span className="font-mono text-[10px] tracking-[0.18em] text-ink2">
          DOCUMENT UPLOAD
        </span>
      </div>
      <div style={{ padding: "8px 12px" }}>
        <p className="mb-2 text-[12px] text-ink2">{reason}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onToolOutput(toolCallId, toolName, {
                uploaded: true,
                documentType,
                fileName: file.name,
              });
            }
          }}
        />
        <button
          type="button"
          className="btn"
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </button>
      </div>
    </div>
  );
}
