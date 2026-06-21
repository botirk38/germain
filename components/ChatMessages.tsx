"use client";

import type { GermainUIMessage } from "@/lib/agents/germain";
import type { GermainClientToolResult } from "@/lib/tools";
import {
  EvaluateCaseToolPart,
  ReviewAndPrepareToolPart,
  RunRiskReviewToolPart,
  MonitorCaseToolPart,
  UploadDocumentsToolPart,
  UploadDocumentToolPart,
  AskQuestionToolPart,
  SubmitApplicationToolPart,
  ApproveSubmissionToolPart,
} from "./ToolCard";
import { Markdown } from "./attache/Markdown";
import { Fragment } from "react";
import { isTextUIPart, isToolUIPart } from "ai";

interface ChatMessagesProps {
  messages: GermainUIMessage[];
  status: string;
  onToolOutput: (result: GermainClientToolResult) => void;
}

function hasVisibleContent(parts: GermainUIMessage["parts"]): boolean {
  if (!parts) return false;
  return parts.some(
    (p) => (isTextUIPart(p) && Boolean(p.text)) || isToolUIPart(p),
  );
}

export function ChatMessages({ messages, status, onToolOutput }: ChatMessagesProps) {
  return (
    <div className="feed">
      {messages.map((message) => (
        <Fragment key={message.id}>
          {message.role === "user" && (
            <div className="msg user">
              <div className="bubble">
                {message.parts
                  ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                  .map((p) => p.text)
                  .join("") ?? ""}
              </div>
            </div>
          )}

          {message.role === "assistant" && hasVisibleContent(message.parts) && (
            <div className="msg">
              <div className="callsign" aria-hidden="true">
                A
              </div>
              <div className="body">
                {message.parts?.map((part, i) => {
                  const key = `${message.id}-${i}`;
                  switch (part.type) {
                    case "text":
                      return part.text ? <Markdown key={key} text={part.text} /> : null;
                    case "tool-evaluateCase":
                      return <EvaluateCaseToolPart key={key} part={part} />;
                    case "tool-reviewAndPrepare":
                      return <ReviewAndPrepareToolPart key={key} part={part} />;
                    case "tool-runRiskReview":
                      return <RunRiskReviewToolPart key={key} part={part} />;
                    case "tool-monitorCase":
                      return <MonitorCaseToolPart key={key} part={part} />;
                    case "tool-uploadDocuments":
                      return <UploadDocumentsToolPart key={key} part={part} onOutput={onToolOutput} />;
                    case "tool-uploadDocument":
                      return <UploadDocumentToolPart key={key} part={part} onOutput={onToolOutput} />;
                    case "tool-askQuestion":
                      return <AskQuestionToolPart key={key} part={part} onOutput={onToolOutput} />;
                    case "tool-submitApplication":
                      return <SubmitApplicationToolPart key={key} part={part} onOutput={onToolOutput} />;
                    case "tool-approveSubmission":
                      return <ApproveSubmissionToolPart key={key} part={part} onOutput={onToolOutput} />;
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          )}
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
