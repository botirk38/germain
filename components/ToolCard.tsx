"use client";

import { useState, type ReactNode } from "react";
import { Card, CardHead, CardFoot, ClRow } from "@/components/attache/Card";
import { StatusMark } from "@/components/attache/StatusMark";
import { KeyButton } from "@/components/attache/KeyButton";
import { MachinePanel } from "@/components/attache/MachinePanel";
import { SlotBox } from "@/components/attache/SlotBox";
import { FileUpload } from "@/components/attache/FileUpload";
import { SingleFileUpload } from "@/components/attache/SingleFileUpload";
import { reviewStatusWord } from "@/lib/attache/display";
import type { AttacheUIMessage } from "@/lib/attache/agent";
import type { AttacheClientToolName, AttacheClientToolResult } from "@/lib/tools";
import { evaluateCaseOutputSchema, type EvaluateCaseOutput } from "@/lib/tools/evaluate-case";
import { reviewAndPrepareOutputSchema, type ReviewAndPrepareOutput } from "@/lib/tools/review-and-prepare";
import { runRiskReviewOutputSchema, type RunRiskReviewOutput } from "@/lib/tools/run-risk-review";
import { monitorCaseOutputSchema, type MonitorCaseOutput } from "@/lib/tools/monitor-case";
import { uploadDocumentsOutputSchema, uploadDocumentsInputSchema, type UploadDocumentsInput } from "@/lib/tools/upload-documents";
import { uploadDocumentOutputSchema, uploadDocumentInputSchema, type UploadDocumentInput } from "@/lib/tools/upload-documents";
import { submitApplicationOutputSchema, submitApplicationInputSchema, type SubmitApplicationInput } from "@/lib/tools/submit-application";
import { approveSubmissionOutputSchema, approveSubmissionInputSchema, type ApproveSubmissionInput } from "@/lib/tools/submit-application";
import { askQuestionInputSchema, askQuestionOutputSchema, type AskQuestionInput, type AskQuestionAnswer } from "@/lib/tools/ask-question";

type MessagePart = NonNullable<AttacheUIMessage["parts"]>[number];
type ToolState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";
type ToolPart<T extends string> = Extract<MessagePart, { type: `tool-${T}` }> & {
  state: ToolState;
  toolCallId: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const toolHeaders: Record<string, string> = {
  evaluateCase: "CASE EVALUATION",
  uploadDocuments: "UPLOAD REQUIRED",
  uploadDocument: "UPLOAD DOCUMENT",
  askQuestion: "QUESTION",
  reviewAndPrepare: "REVIEW & PREPARE",
  runRiskReview: "RISK REVIEW",
  submitApplication: "SUBMIT APPLICATION",
  approveSubmission: "APPROVE SUBMISSION",
  monitorCase: "CASE MONITOR",
};

function WorkingCard({ header, dashed }: { header: string; dashed?: boolean }) {
  return (
    <article
      className="card"
      style={dashed ? { borderStyle: "dashed" } : undefined}
    >
      <div className="typing" style={{ padding: "4px 14px" }}>
        <span className="t">
          {header} — WORKING…<span className="cursor">▌</span>
        </span>
      </div>
    </article>
  );
}

function SageLine({ children }: { children: ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        color: "var(--sage)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        padding: "8px 0 4px",
      }}
    >
      {children}
    </div>
  );
}

function ToolErrorCard({ header, errorText }: { header: string; errorText?: string }) {
  return (
    <article
      className="card"
      style={{ borderLeft: "4px solid var(--clay)" }}
    >
      <CardHead>{header}</CardHead>
      <div className="notam-body">
        <StatusMark word="problem" />
        {errorText ? (
          <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>
            {errorText}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ToolStateCard<T extends string>({
  part,
  toolName,
  children,
}: {
  part: ToolPart<T>;
  toolName: T;
  children: (output: Record<string, unknown>) => ReactNode;
}) {
  const header = toolHeaders[toolName] ?? toolName.toUpperCase();

  if (part.state === "input-streaming") {
    return <WorkingCard header={header} dashed />;
  }

  if (part.state === "output-error" || part.state === "output-denied") {
    return <ToolErrorCard header={header} errorText={"errorText" in part ? part.errorText : undefined} />;
  }

  if (part.state === "output-available" && part.output) {
    const raw = part.output;
    const obj = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : { value: raw };
    return children(obj);
  }

  return <WorkingCard header={header} />;
}

// ==================== SERVER TOOL PARTS ====================

export function EvaluateCaseToolPart({ part }: { part: ToolPart<"evaluateCase"> }) {
  return <ToolStateCard part={part} toolName="evaluateCase">{(output) => <ServerToolOutput toolName="evaluateCase" output={output} />}</ToolStateCard>;
}

export function ReviewAndPrepareToolPart({ part }: { part: ToolPart<"reviewAndPrepare"> }) {
  return <ToolStateCard part={part} toolName="reviewAndPrepare">{(output) => <ServerToolOutput toolName="reviewAndPrepare" output={output} />}</ToolStateCard>;
}

export function RunRiskReviewToolPart({ part }: { part: ToolPart<"runRiskReview"> }) {
  return <ToolStateCard part={part} toolName="runRiskReview">{(output) => <ServerToolOutput toolName="runRiskReview" output={output} />}</ToolStateCard>;
}

export function MonitorCaseToolPart({ part }: { part: ToolPart<"monitorCase"> }) {
  return <ToolStateCard part={part} toolName="monitorCase">{(output) => <ServerToolOutput toolName="monitorCase" output={output} />}</ToolStateCard>;
}

// ==================== CLIENT-INTERACTION TOOL PARTS ====================

export function UploadDocumentsToolPart({ part, onOutput }: { part: ToolPart<"uploadDocuments">; onOutput: (result: AttacheClientToolResult) => void }) {
  return <ClientToolPart part={part} toolName="uploadDocuments" onOutput={onOutput} renderOutput={(output) => <ServerToolOutput toolName="uploadDocuments" output={output} />} />;
}

export function UploadDocumentToolPart({ part, onOutput }: { part: ToolPart<"uploadDocument">; onOutput: (result: AttacheClientToolResult) => void }) {
  return <ClientToolPart part={part} toolName="uploadDocument" onOutput={onOutput} renderOutput={(output) => <ServerToolOutput toolName="uploadDocument" output={output} />} />;
}

export function SubmitApplicationToolPart({ part, onOutput }: { part: ToolPart<"submitApplication">; onOutput: (result: AttacheClientToolResult) => void }) {
  return <ClientToolPart part={part} toolName="submitApplication" onOutput={onOutput} renderOutput={(output) => <ServerToolOutput toolName="submitApplication" output={output} />} />;
}

export function AskQuestionToolPart({ part, onOutput }: { part: ToolPart<"askQuestion">; onOutput: (result: AttacheClientToolResult) => void }) {
  return <ClientToolPart part={part} toolName="askQuestion" onOutput={onOutput} renderOutput={(output) => <ServerToolOutput toolName="askQuestion" output={output} />} />;
}

export function ApproveSubmissionToolPart({ part, onOutput }: { part: ToolPart<"approveSubmission">; onOutput: (result: AttacheClientToolResult) => void }) {
  return <ClientToolPart part={part} toolName="approveSubmission" onOutput={onOutput} renderOutput={(output) => <ServerToolOutput toolName="approveSubmission" output={output} />} />;
}

// ==================== SERVER TOOL OUTPUT DISPLAY ====================

function ServerToolOutput({
  toolName,
  output,
}: {
  toolName: string;
  output: Record<string, unknown>;
}) {
  switch (toolName) {

    case "evaluateCase": {
      const parsed = evaluateCaseOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      const data: EvaluateCaseOutput = parsed.data;
      return (
        <Card>
          <CardHead>CASE EVALUATION</CardHead>
          <div className="cl">
            <ClRow label="Eligible" state={<StatusMark word={data.eligible ? "verified" : "problem"} />} />
            <ClRow label="Visa type" state={data.visaType} />
            <ClRow label="Consulate" state={data.consulate} />
            <ClRow label="Processing" state={data.processingTime} />
            <ClRow label="Base odds" state={`${data.baseLikelihood}%`} />
            <ClRow label="Fee" state={`€${data.fees.total}`} />
            <div className="poll-detail" style={{ paddingTop: 4 }}>{data.reasoning}</div>
            <div style={{ paddingTop: 8 }}>
              <ClRow label="Required documents" state={`${data.requiredDocuments.length}`} />
              <ClRow label="Critical" state={`${data.requiredDocuments.filter((d) => d.critical).length}`} critical />
            </div>
          </div>
        </Card>
      );
    }

    case "reviewAndPrepare": {
      const parsed = reviewAndPrepareOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      const data: ReviewAndPrepareOutput = parsed.data;

      const formLines = Object.entries(data.formData).slice(0, 8).map(
        ([field, value]) => `${field.toUpperCase()}: ${value || "—"} ✓`,
      );
      formLines.push(data.consistencyCheck.passed ? "CONSISTENCY CHECK: PASS" : `✕ MISMATCHES: ${data.consistencyCheck.mismatches.length}`);

      return (
        <>
          <Card>
            <CardHead>DOCUMENT REVIEW</CardHead>
            <div className="cl">
              {data.documentReviews.map((review) => (
                <div key={review.type}>
                  <ClRow
                    label={review.type.replace(/_/g, " ").toUpperCase()}
                    state={<StatusMark word={reviewStatusWord(review.status)} />}
                  />
                  {review.issues.map((issue, j) => (
                    <div
                      key={`${review.type}-issue-${j}`}
                      className={issue.severity === "critical" ? "poll-detail bad" : "poll-detail"}
                      style={issue.severity === "warning" ? { color: "var(--amber)" } : undefined}
                    >
                      {issue.severity === "critical" ? "✕ " : issue.severity === "warning" ? "▲ " : ""}
                      {issue.message}
                    </div>
                  ))}
                </div>
              ))}
              {data.recommendations.map((rec, i) => (
                <div key={rec.id ?? `rec-${i}`} className="poll-detail">
                  <span style={{ color: "var(--amber)" }}>▲ Check this</span> — {rec.fix}{" "}
                  <span className="mono" style={{ color: "var(--sage)" }}>+{rec.impact}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <MachinePanel lines={formLines} final={`FORM COMPLETE — ODDS ${data.approvalLikelihood}%`} />
          </Card>
          <Card>
            <CardHead>SUPPORTING PACK</CardHead>
            <div className="cl">
              <ClRow label="Cover letter" state={<StatusMark word="verified" />} />
              <ClRow label="Itinerary" state={<StatusMark word="verified" />} />
              <ClRow label="Proof of ties" state={<StatusMark word="verified" />} />
            </div>
          </Card>
        </>
      );
    }

    case "runRiskReview": {
      const parsed = runRiskReviewOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      const data: RunRiskReviewOutput = parsed.data;
      return (
        <Card>
          <CardHead>RISK REVIEW</CardHead>
          <div className="cl">
            <ClRow label="Risk score" state={`${data.riskScore}/100`} />
            <ClRow label="Approval likelihood" state={`${data.approvalLikelihood}%`} />
            <ClRow label="Ready to file" state={<StatusMark word={data.readyToSubmit ? "verified" : "check"} />} />
            {data.finalRecommendations.map((rec, i) => (
              <div key={rec.id ?? `final-${i}`} className="poll-detail" style={{ color: "var(--amber)" }}>
                ▲ {rec.issue} — {rec.fix} (+{rec.impact}%)
              </div>
            ))}
          </div>
        </Card>
      );
    }

    case "monitorCase": {
      const parsed = monitorCaseOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      const data: MonitorCaseOutput = parsed.data;

      if (data.decision) {
        if (data.decision.outcome === "approved") {
          return (
            <SlotBox title="● APPROVED">
              {data.decision.validityPeriod ? <div>Valid {data.decision.validityPeriod}</div> : null}
              {data.decision.entries ? <div style={{ fontWeight: 400 }}>Entries: {data.decision.entries}</div> : null}
              <div style={{ marginTop: 6, fontWeight: 400, fontSize: 11.5, lineHeight: 1.5, color: "var(--ink2)" }}>
                {data.summary}
              </div>
            </SlotBox>
          );
        }
        return (
          <Card>
            <CardHead>DECISION</CardHead>
            <div className="notam-body">
              <StatusMark word={data.decision.outcome === "refused" ? "problem" : "check"} />
              <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>{data.summary}</div>
            </div>
          </Card>
        );
      }

      if (data.actionRequired && data.rfeDetails) {
        return (
          <Card className="notam">
            <CardHead>CASE MONITOR — ACTION NEEDED</CardHead>
            <div className="notam-body">
              <strong>{data.rfeDetails.missingItem}</strong>
              <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>{data.rfeDetails.explanation}</div>
            </div>
            {data.rfeDetails.deadline ? <CardFoot>RESPOND BY {data.rfeDetails.deadline}</CardFoot> : null}
          </Card>
        );
      }

      return (
        <Card>
          <CardHead>CASE MONITOR</CardHead>
          <div className="notam-body">
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.16em", color: "var(--ink2)" }}>
              {data.status.replace(/_/g, " ").toUpperCase()}
            </span>
            <div style={{ marginTop: 4 }}>{data.summary}</div>
            {data.emails.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {data.emails.map((email, i) => (
                  <div key={i} className="poll-detail" style={{ fontSize: 11 }}>
                    {email.date} — {email.subject}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      );
    }

    case "uploadDocuments": {
      const parsed = uploadDocumentsOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      return (
        <Card>
          <CardHead>UPLOAD REQUIRED</CardHead>
          <div className="cl">
            <SageLine>○ {parsed.data.uploadedCount} DOCUMENTS RECEIVED</SageLine>
          </div>
        </Card>
      );
    }

    case "uploadDocument": {
      const parsed = uploadDocumentOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      return (
        <Card>
          <CardHead>DOCUMENT RECEIVED</CardHead>
          <div className="cl">
            <SageLine>● {parsed.data.document.type.replace(/_/g, " ").toUpperCase()} UPLOADED</SageLine>
          </div>
        </Card>
      );
    }

    case "submitApplication": {
      const parsed = submitApplicationOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      const data = parsed.data;
      return (
        <Card>
          <MachinePanel
            lines={[
              data.referenceNumber ? `REF: ${data.referenceNumber}` : `SESSION: ${data.sessionId}`,
              `STATUS: ${data.status.toUpperCase()}`,
            ]}
            final="APPLICATION SUBMITTED"
            showRunway
          />
        </Card>
      );
    }

    case "approveSubmission": {
      const parsed = approveSubmissionOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      const data = parsed.data;
      return (
        <Card>
          <CardHead>SUBMISSION</CardHead>
          <div className="cl">
            <SageLine>{data.approved ? "● APPROVED BY USER" : "✕ REJECTED BY USER"}</SageLine>
            {data.userNote ? (
              <div className="poll-detail" style={{ color: "var(--ink2)" }}>{data.userNote}</div>
            ) : null}
          </div>
        </Card>
      );
    }

    case "askQuestion": {
      const parsed = askQuestionOutputSchema.safeParse(output);
      if (!parsed.success) return null;
      return (
        <Card>
          <CardHead>ANSWERS RECEIVED</CardHead>
          <div className="cl">
            {parsed.data.answers.map((a) => {
              const display = a.skipped
                ? "SKIPPED"
                : a.freeText && a.selectedOption
                  ? `${a.selectedOption} (${a.freeText})`
                  : a.freeText ?? a.selectedOption ?? "—";
              return <ClRow key={a.questionId} label={a.questionId} state={display} />;
            })}
          </div>
        </Card>
      );
    }

    default:
      return (
        <Card>
          <CardHead>{toolHeaders[toolName] ?? toolName.toUpperCase()}</CardHead>
          <div className="cl">
            <ClRow label="Result" state={<StatusMark word="received" />} />
          </div>
        </Card>
      );
  }
}

// ==================== ASK QUESTION CARD ====================

function AskQuestionCard({
  input,
  isSubmitting,
  onSubmit,
}: {
  input: AskQuestionInput;
  isSubmitting: boolean;
  onSubmit: (answers: AskQuestionAnswer[]) => void;
}) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({});

  const handleSelect = (id: string, option: string) => {
    setSelections((prev) => ({ ...prev, [id]: option }));
    setSkipped((prev) => ({ ...prev, [id]: false }));
  };

  const handleSkip = (id: string) => {
    setSkipped((prev) => ({ ...prev, [id]: true }));
    setSelections((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFreeTexts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSubmit = () => {
    const answers: AskQuestionAnswer[] = input.questions.map((q) => {
      if (skipped[q.id]) return { questionId: q.id, skipped: true };
      const answer: AskQuestionAnswer = { questionId: q.id };
      const selected = selections[q.id];
      if (selected) answer.selectedOption = selected;
      const text = freeTexts[q.id];
      if (text) answer.freeText = text;
      return answer;
    });
    onSubmit(answers);
  };

  return (
    <Card>
      <CardHead>{input.context ? input.context.toUpperCase() : "QUESTION"}</CardHead>
      <div className="cl" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {input.questions.map((q) => {
          const isSkipped = Boolean(skipped[q.id]);
          const selected = selections[q.id];

          return (
            <div key={q.id} style={{ opacity: isSkipped ? 0.45 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>
                  {q.question}
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={isSubmitting}
                  onClick={() => isSkipped ? handleSelect(q.id, "") : handleSkip(q.id)}
                  style={{
                    padding: "2px 8px", fontSize: 9.5,
                    color: isSkipped ? "var(--sage)" : "var(--ink2)",
                    background: "transparent", border: "none",
                    textDecoration: isSkipped ? "none" : "underline",
                    flexShrink: 0,
                  }}
                >
                  {isSkipped ? "UNDO" : "SKIP"}
                </button>
              </div>
              {!isSkipped && (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="btn"
                        disabled={isSubmitting}
                        style={{
                          padding: "5px 12px", fontSize: 10.5,
                          background: selected === opt ? "var(--ink)" : "transparent",
                          color: selected === opt ? "var(--bone)" : "var(--ink)",
                          border: `1px solid ${selected === opt ? "var(--ink)" : "var(--line)"}`,
                        }}
                        onClick={() => handleSelect(q.id, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {q.allowFreeText && (
                    <input
                      type="text"
                      placeholder="Or type your answer..."
                      disabled={isSubmitting}
                      value={freeTexts[q.id] ?? ""}
                      onChange={(e) => setFreeTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      style={{
                        marginTop: 6, width: "100%", padding: "5px 8px",
                        fontSize: 11, fontFamily: "var(--mono)",
                        border: "1px solid var(--line)", background: "transparent",
                        color: "var(--ink)", outline: "none",
                      }}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
        <div style={{ paddingTop: 4 }}>
          <KeyButton onClick={handleSubmit} disabled={isSubmitting} submittingLabel="SUBMITTING...">
            SUBMIT ANSWERS
          </KeyButton>
        </div>
      </div>
    </Card>
  );
}

// ==================== CLIENT TOOL INTERACTION ====================

function ClientToolPart<T extends AttacheClientToolName>({
  part,
  toolName,
  onOutput,
  renderOutput,
}: {
  part: ToolPart<T>;
  toolName: T;
  onOutput: (result: AttacheClientToolResult) => void;
  renderOutput: (output: Record<string, unknown>) => ReactNode;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const header = toolHeaders[toolName] ?? toolName.toUpperCase();
  const input = part.input;

  if (part.state === "input-streaming") {
    return <WorkingCard header={header} dashed />;
  }

  if (part.state === "output-error" || part.state === "output-denied") {
    return <ToolErrorCard header={header} errorText={"errorText" in part ? part.errorText : undefined} />;
  }

  if (part.state === "output-available" && part.output) {
    const raw = part.output;
    return renderOutput(typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : { value: raw });
  }

  switch (toolName) {
    case "uploadDocuments": {
      const parsed = uploadDocumentsInputSchema.safeParse(input);
      if (!parsed.success) return null;
      const data: UploadDocumentsInput = parsed.data;
      return (
        <FileUpload
          requiredTypes={data.requiredTypes}
          criticalDocuments={data.criticalDocuments}
          isSubmitting={isSubmitting}
          onUpload={(documents) => {
            setIsSubmitting(true);
            onOutput({
              tool: "uploadDocuments",
              toolCallId: part.toolCallId,
              output: { success: true, uploadedCount: documents.length, documents },
            });
            setIsSubmitting(false);
          }}
        />
      );
    }

    case "uploadDocument": {
      const parsed = uploadDocumentInputSchema.safeParse(input);
      if (!parsed.success) return null;
      const data: UploadDocumentInput = parsed.data;
      return (
        <SingleFileUpload
          documentType={data.documentType}
          reason={data.reason}
          guidance={data.guidance}
          critical={data.critical}
          isSubmitting={isSubmitting}
          onUpload={(document) => {
            setIsSubmitting(true);
            onOutput({
              tool: "uploadDocument",
              toolCallId: part.toolCallId,
              output: { uploaded: true, document },
            });
            setIsSubmitting(false);
          }}
        />
      );
    }

    case "askQuestion": {
      const parsed = askQuestionInputSchema.safeParse(input);
      if (!parsed.success) return null;
      return (
        <AskQuestionCard
          input={parsed.data}
          isSubmitting={isSubmitting}
          onSubmit={(answers) => {
            setIsSubmitting(true);
            onOutput({
              tool: "askQuestion",
              toolCallId: part.toolCallId,
              output: { answers },
            });
            setIsSubmitting(false);
          }}
        />
      );
    }

    case "submitApplication": {
      const parsed = submitApplicationInputSchema.safeParse(input);
      if (!parsed.success) return null;
      const data: SubmitApplicationInput = parsed.data;
      const formLines = Object.entries(data.formData).slice(0, 6).map(([k, v]) => `${k}: ${v}`);
      return (
        <Card className="notam">
          <CardHead>SUBMIT APPLICATION</CardHead>
          <div className="cl">
            {formLines.map((line, i) => (
              <div key={i} className="poll-detail" style={{ fontSize: 11 }}>{line}</div>
            ))}
            <div className="poll-detail" style={{ color: "var(--amber)", marginTop: 8 }}>
              ▲ This will open a browser session to fill the consulate portal.
              You will see the agent work in real time.
            </div>
            <div style={{ paddingTop: 8 }}>
              <KeyButton
                onClick={() => {
                  setIsSubmitting(true);
                  onOutput({
                    tool: "submitApplication", toolCallId: part.toolCallId,
                    output: { sessionId: `bus-${Date.now()}`, liveViewUrl: "", status: "ready_for_review" },
                  });
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                submittingLabel="LAUNCHING BROWSER…"
              >
                START SUBMISSION
              </KeyButton>
            </div>
          </div>
        </Card>
      );
    }

    case "approveSubmission": {
      const parsed = approveSubmissionInputSchema.safeParse(input);
      if (!parsed.success) return null;
      const data: ApproveSubmissionInput = parsed.data;
      return (
        <Card className="notam">
          <CardHead>APPROVE SUBMISSION</CardHead>
          <div className="cl">
            {Object.entries(data.formSummary).map(([k, v], i) => (
              <ClRow key={i} label={k.replace(/_/g, " ").toUpperCase()} state={v} />
            ))}
            <ClRow label="Total fees" state={`€${data.totalFees}`} />
            <div className="poll-detail" style={{ color: "var(--amber)", marginTop: 8 }}>
              ▲ Review the form in the browser panel. Once you approve,
              the application will be submitted.
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
              <KeyButton
                onClick={() => {
                  setIsSubmitting(true);
                  onOutput({
                    tool: "approveSubmission", toolCallId: part.toolCallId,
                    output: { approved: true },
                  });
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                submittingLabel="SUBMITTING…"
              >
                APPROVE & SUBMIT
              </KeyButton>
              <button
                type="button"
                className="btn"
                style={{ background: "transparent", border: "1px solid var(--clay)", color: "var(--clay)" }}
                onClick={() => {
                  onOutput({
                    tool: "approveSubmission", toolCallId: part.toolCallId,
                    output: { approved: false, userNote: "User rejected the submission" },
                  });
                }}
                disabled={isSubmitting}
              >
                CANCEL
              </button>
            </div>
          </div>
        </Card>
      );
    }

    default:
      return null;
  }
}
