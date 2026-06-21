"use client";

import { useState, type ReactNode } from "react";
import { Card, CardHead, CardFoot, ClRow } from "@/components/attache/Card";
import { StatusMark } from "@/components/attache/StatusMark";
import { KeyButton } from "@/components/attache/KeyButton";
import { MachinePanel } from "@/components/attache/MachinePanel";
import { SlotBox } from "@/components/attache/SlotBox";
import { FileUpload } from "@/components/attache/FileUpload";
import { SingleFileUpload } from "@/components/attache/SingleFileUpload";
import { reviewStatusWord } from "@/lib/attache-display";
import type { GermainUIMessage } from "@/lib/agents/germain";
import type {
  GermainClientToolName,
  GermainClientToolResult,
} from "@/lib/tools";

type MessagePart = NonNullable<GermainUIMessage["parts"]>[number];
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArrayField(input: unknown, key: string): string[] {
  const value = isRecord(input) ? input[key] : undefined;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function numberField(input: Record<string, unknown>, key: string, fallback: number): number {
  const value = input[key];
  return typeof value === "number" ? value : fallback;
}

// Working state: telex card with blinking cursor
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
    return children(isRecord(part.output) ? part.output : { value: part.output });
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

export function UploadDocumentsToolPart({
  part,
  onOutput,
}: {
  part: ToolPart<"uploadDocuments">;
  onOutput: (result: GermainClientToolResult) => void;
}) {
  return (
    <ClientToolPart
      part={part}
      toolName="uploadDocuments"
      onOutput={onOutput}
      renderOutput={(output) => <ServerToolOutput toolName="uploadDocuments" output={output} />}
    />
  );
}

export function UploadDocumentToolPart({
  part,
  onOutput,
}: {
  part: ToolPart<"uploadDocument">;
  onOutput: (result: GermainClientToolResult) => void;
}) {
  return (
    <ClientToolPart
      part={part}
      toolName="uploadDocument"
      onOutput={onOutput}
      renderOutput={(output) => <ServerToolOutput toolName="uploadDocument" output={output} />}
    />
  );
}

export function SubmitApplicationToolPart({
  part,
  onOutput,
}: {
  part: ToolPart<"submitApplication">;
  onOutput: (result: GermainClientToolResult) => void;
}) {
  return (
    <ClientToolPart
      part={part}
      toolName="submitApplication"
      onOutput={onOutput}
      renderOutput={(output) => <ServerToolOutput toolName="submitApplication" output={output} />}
    />
  );
}

export function AskQuestionToolPart({
  part,
  onOutput,
}: {
  part: ToolPart<"askQuestion">;
  onOutput: (result: GermainClientToolResult) => void;
}) {
  return (
    <ClientToolPart
      part={part}
      toolName="askQuestion"
      onOutput={onOutput}
      renderOutput={(output) => <ServerToolOutput toolName="askQuestion" output={output} />}
    />
  );
}

export function ApproveSubmissionToolPart({
  part,
  onOutput,
}: {
  part: ToolPart<"approveSubmission">;
  onOutput: (result: GermainClientToolResult) => void;
}) {
  return (
    <ClientToolPart
      part={part}
      toolName="approveSubmission"
      onOutput={onOutput}
      renderOutput={(output) => <ServerToolOutput toolName="approveSubmission" output={output} />}
    />
  );
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
      const requiredDocuments = (output.requiredDocuments as Array<{
        type: string; description: string; critical: boolean;
      }>) ?? [];
      const fees = (output.fees as Record<string, number>) ?? {};
      return (
        <Card>
          <CardHead>CASE EVALUATION</CardHead>
          <div className="cl">
            <ClRow
              label="Eligible"
              state={<StatusMark word={output.eligible ? "verified" : "problem"} />}
            />
            <ClRow label="Visa type" state={output.visaType as string} />
            <ClRow label="Consulate" state={output.consulate as string} />
            <ClRow label="Processing" state={output.processingTime as string} />
            <ClRow
              label="Base odds"
              state={`${output.baseLikelihood as number}%`}
            />
            <ClRow label="Fee" state={`€${fees.total ?? 0}`} />
            <div className="poll-detail" style={{ paddingTop: 4 }}>
              {output.reasoning as string}
            </div>
            <div style={{ paddingTop: 8 }}>
              <ClRow label="Required documents" state={`${requiredDocuments.length}`} />
              <ClRow label="Critical" state={`${requiredDocuments.filter((d) => d.critical).length}`} critical />
            </div>
          </div>
        </Card>
      );
    }

    case "reviewAndPrepare": {
      const docReviews = (output.documentReviews as Array<{
        type: string;
        status: string;
        extractedFields: Record<string, string>;
        issues: Array<{ severity: string; message: string; impact: number }>;
      }>) ?? [];
      const formData = (output.formData as Record<string, string>) ?? {};
      const consistency = output.consistencyCheck as { passed: boolean; mismatches: string[] } | undefined;
      const recommendations = (output.recommendations as Array<{
        id?: string; issue: string; fix: string; impact: number;
      }>) ?? [];

      // Build machine lines from form data
      const formLines = Object.entries(formData).slice(0, 8).map(
        ([field, value]) => `${field.toUpperCase()}: ${value || "—"} ✓`
      );
      if (consistency) {
        formLines.push(consistency.passed ? "CONSISTENCY CHECK: PASS" : `✕ MISMATCHES: ${consistency.mismatches.length}`);
      }

      return (
        <>
          <Card>
            <CardHead>DOCUMENT REVIEW</CardHead>
            <div className="cl">
              {docReviews.map((review) => (
                <div key={review.type}>
                  <ClRow
                    label={review.type.replace(/_/g, " ").toUpperCase()}
                    state={<StatusMark word={reviewStatusWord(review.status as "verified" | "needs_review" | "rejected")} />}
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
              {recommendations.map((rec, i) => (
                <div key={rec.id ?? `rec-${i}`} className="poll-detail">
                  <span style={{ color: "var(--amber)" }}>▲ Check this</span> — {rec.fix}{" "}
                  <span className="mono" style={{ color: "var(--sage)" }}>+{rec.impact}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <MachinePanel
              lines={formLines}
              final={`FORM COMPLETE — ODDS ${output.approvalLikelihood as number}%`}
            />
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
      const finalRecommendations = (output.finalRecommendations as Array<{
        id?: string; issue: string; fix: string; impact: number;
      }>) ?? [];
      return (
        <Card>
          <CardHead>RISK REVIEW</CardHead>
          <div className="cl">
            <ClRow
              label="Risk score"
              state={`${(output.riskScore as number) ?? 0}/100`}
            />
            <ClRow
              label="Approval likelihood"
              state={`${output.approvalLikelihood as number}%`}
            />
            <ClRow
              label="Ready to file"
              state={<StatusMark word={output.readyToSubmit ? "verified" : "check"} />}
            />
            {finalRecommendations.map((rec, i) => (
              <div
                key={rec.id ?? `final-${i}`}
                className="poll-detail"
                style={{ color: "var(--amber)" }}
              >
                ▲ {rec.issue} — {rec.fix} (+{rec.impact}%)
              </div>
            ))}
          </div>
        </Card>
      );
    }

    case "monitorCase": {
      const emails = (output.emails as Array<{ subject: string; from: string; date: string; snippet: string }>) ?? [];
      const rfeDetails = output.rfeDetails as { missingItem: string; explanation: string; deadline?: string } | undefined;
      const decision = output.decision as { outcome: string; validityPeriod?: string; entries?: string } | undefined;
      const actionNeeded = Boolean(output.actionRequired);

      if (decision) {
        if (decision.outcome === "approved") {
          return (
            <SlotBox title="● APPROVED">
              {decision.validityPeriod ? <div>Valid {decision.validityPeriod}</div> : null}
              {decision.entries ? <div style={{ fontWeight: 400 }}>Entries: {decision.entries}</div> : null}
              <div style={{ marginTop: 6, fontWeight: 400, fontSize: 11.5, lineHeight: 1.5, color: "var(--ink2)" }}>
                {output.summary as string}
              </div>
            </SlotBox>
          );
        }
        return (
          <Card>
            <CardHead>DECISION</CardHead>
            <div className="notam-body">
              <StatusMark word={decision.outcome === "refused" ? "problem" : "check"} />
              <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>
                {output.summary as string}
              </div>
            </div>
          </Card>
        );
      }

      if (actionNeeded && rfeDetails) {
        return (
          <Card className="notam">
            <CardHead>CASE MONITOR — ACTION NEEDED</CardHead>
            <div className="notam-body">
              <strong>{rfeDetails.missingItem}</strong>
              <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>
                {rfeDetails.explanation}
              </div>
            </div>
            {rfeDetails.deadline ? <CardFoot>RESPOND BY {rfeDetails.deadline}</CardFoot> : null}
          </Card>
        );
      }

      return (
        <Card>
          <CardHead>CASE MONITOR</CardHead>
          <div className="notam-body">
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.16em", color: "var(--ink2)" }}>
              {String(output.status ?? "").replace(/_/g, " ").toUpperCase()}
            </span>
            <div style={{ marginTop: 4 }}>{output.summary as string}</div>
            {emails.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {emails.map((email, i) => (
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

    case "uploadDocuments":
      return (
        <Card>
          <CardHead>UPLOAD REQUIRED</CardHead>
          <div className="cl">
            <SageLine>
              ○ {(output.uploadedCount as number) ?? 0} DOCUMENTS RECEIVED
            </SageLine>
          </div>
        </Card>
      );

    case "uploadDocument": {
      const doc = output.document as { type?: string } | undefined;
      const docType = doc?.type ?? "document";
      return (
        <Card>
          <CardHead>DOCUMENT RECEIVED</CardHead>
          <div className="cl">
            <SageLine>
              ● {docType.replace(/_/g, " ").toUpperCase()} UPLOADED
            </SageLine>
          </div>
        </Card>
      );
    }

    case "submitApplication":
      return (
        <Card>
          <MachinePanel
            lines={[
              output.referenceNumber ? `REF: ${output.referenceNumber as string}` : `SESSION: ${output.sessionId as string}`,
              `STATUS: ${String(output.status ?? "").toUpperCase()}`,
            ]}
            final="APPLICATION SUBMITTED"
            showRunway
          />
        </Card>
      );

    case "approveSubmission":
      return (
        <Card>
          <CardHead>SUBMISSION</CardHead>
          <div className="cl">
            <SageLine>
              {output.approved ? "● APPROVED BY USER" : "✕ REJECTED BY USER"}
            </SageLine>
            {output.userNote ? (
              <div className="poll-detail" style={{ color: "var(--ink2)" }}>
                {output.userNote as string}
              </div>
            ) : null}
          </div>
        </Card>
      );

    case "askQuestion": {
      const answers = (output.answers as Array<{ questionId: string; selectedOption: string; freeText?: string }>) ?? [];
      return (
        <Card>
          <CardHead>ANSWERS RECEIVED</CardHead>
          <div className="cl">
            {answers.map((a) => (
              <ClRow
                key={a.questionId}
                label={a.questionId}
                state={a.freeText ? `${a.selectedOption} (${a.freeText})` : a.selectedOption}
              />
            ))}
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

type QuestionAnswer = { questionId: string; selectedOption: string; freeText?: string };

function AskQuestionCard({
  input,
  isSubmitting,
  onSubmit,
}: {
  input: unknown;
  isSubmitting: boolean;
  onSubmit: (answers: QuestionAnswer[]) => void;
}) {
  const parsed = isRecord(input) ? input : {};
  const contextText = typeof parsed.context === "string" ? parsed.context : undefined;
  const questions = Array.isArray(parsed.questions)
    ? (parsed.questions as Array<Record<string, unknown>>)
    : [];

  const [selections, setSelections] = useState<Record<string, string>>({});
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({});

  const allAnswered = questions.every((q) => {
    const id = q.id as string;
    return Boolean(selections[id]);
  });

  const handleSubmit = () => {
    const answers: QuestionAnswer[] = questions.map((q) => {
      const id = q.id as string;
      const answer: QuestionAnswer = {
        questionId: id,
        selectedOption: selections[id] ?? "",
      };
      if (freeTexts[id]) answer.freeText = freeTexts[id];
      return answer;
    });
    onSubmit(answers);
  };

  return (
    <Card>
      {contextText ? <CardHead>{contextText.toUpperCase()}</CardHead> : <CardHead>QUESTION</CardHead>}
      <div className="cl" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {questions.map((q) => {
          const id = q.id as string;
          const questionText = q.question as string;
          const options = Array.isArray(q.options) ? (q.options as string[]) : [];
          const allowFreeText = Boolean(q.allowFreeText);
          const selected = selections[id];

          return (
            <div key={id}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginBottom: 6,
                  lineHeight: 1.4,
                }}
              >
                {questionText}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="btn"
                    disabled={isSubmitting}
                    style={{
                      padding: "5px 12px",
                      fontSize: 10.5,
                      background: selected === opt ? "var(--ink)" : "transparent",
                      color: selected === opt ? "var(--bone)" : "var(--ink)",
                      border: `1px solid ${selected === opt ? "var(--ink)" : "var(--line)"}`,
                    }}
                    onClick={() =>
                      setSelections((prev) => ({ ...prev, [id]: opt }))
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {allowFreeText && (
                <input
                  type="text"
                  placeholder="Or type your answer..."
                  disabled={isSubmitting}
                  value={freeTexts[id] ?? ""}
                  onChange={(e) =>
                    setFreeTexts((prev) => ({ ...prev, [id]: e.target.value }))
                  }
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "5px 8px",
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                    border: "1px solid var(--line)",
                    background: "transparent",
                    color: "var(--ink)",
                    outline: "none",
                  }}
                />
              )}
            </div>
          );
        })}
        <div style={{ paddingTop: 4 }}>
          <KeyButton
            onClick={handleSubmit}
            disabled={isSubmitting || !allAnswered}
            submittingLabel="SUBMITTING..."
          >
            SUBMIT ANSWERS
          </KeyButton>
        </div>
      </div>
    </Card>
  );
}

// ==================== CLIENT TOOL INTERACTION ====================

function ClientToolPart<T extends GermainClientToolName>({
  part,
  toolName,
  onOutput,
  renderOutput,
}: {
  part: ToolPart<T>;
  toolName: T;
  onOutput: (result: GermainClientToolResult) => void;
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
    return renderOutput(isRecord(part.output) ? part.output : { value: part.output });
  }

  const handleAction = () => {
    setIsSubmitting(true);

    switch (toolName) {
      case "uploadDocuments": {
        const requiredTypes = stringArrayField(input, "requiredTypes");
        onOutput({
          tool: "uploadDocuments", toolCallId: part.toolCallId,
          output: {
            success: true,
            uploadedCount: requiredTypes.length || 3,
            documents: requiredTypes.map((type, i) => ({
              id: `doc-${i}`, type, name: `${type.replace("_", " ")}.pdf`, status: "uploaded" as const,
            })),
          },
        });
        break;
      }
      case "uploadDocument": {
        const docType = isRecord(input) ? (input.documentType as string) ?? "document" : "document";
        onOutput({
          tool: "uploadDocument", toolCallId: part.toolCallId,
          output: {
            uploaded: true,
            document: {
              id: `doc-${docType}-${Date.now()}`,
              type: docType,
              name: `${docType.replace(/_/g, " ")}.pdf`,
              status: "uploaded" as const,
            },
          },
        });
        break;
      }
      case "submitApplication":
        onOutput({
          tool: "submitApplication", toolCallId: part.toolCallId,
          output: { sessionId: `bus-${Date.now()}`, liveViewUrl: "", status: "ready_for_review" },
        });
        break;
      case "askQuestion":
        // fallback — individual option clicks handle submission
        break;
      case "approveSubmission":
        onOutput({
          tool: "approveSubmission", toolCallId: part.toolCallId,
          output: { approved: true },
        });
        break;
    }
    setIsSubmitting(false);
  };

  switch (toolName) {
    case "uploadDocuments": {
      const requiredTypes = stringArrayField(input, "requiredTypes");
      const criticalDocuments = stringArrayField(input, "criticalDocuments");
      return (
        <FileUpload
          requiredTypes={requiredTypes}
          criticalDocuments={criticalDocuments}
          isSubmitting={isSubmitting}
          onUpload={(documents) => {
            setIsSubmitting(true);
            onOutput({
              tool: "uploadDocuments",
              toolCallId: part.toolCallId,
              output: {
                success: true,
                uploadedCount: documents.length,
                documents,
              },
            });
            setIsSubmitting(false);
          }}
        />
      );
    }

    case "uploadDocument": {
      const docType = isRecord(input) ? (input.documentType as string) ?? "document" : "document";
      const reason = isRecord(input) ? (input.reason as string) ?? "" : "";
      const guidanceText = isRecord(input) ? (input.guidance as string) ?? "" : "";
      const isCritical = isRecord(input) ? Boolean(input.critical) : false;
      return (
        <SingleFileUpload
          documentType={docType}
          reason={reason}
          guidance={guidanceText}
          critical={isCritical}
          isSubmitting={isSubmitting}
          onUpload={(document) => {
            setIsSubmitting(true);
            onOutput({
              tool: "uploadDocument",
              toolCallId: part.toolCallId,
              output: {
                uploaded: true,
                document,
              },
            });
            setIsSubmitting(false);
          }}
        />
      );
    }

    case "askQuestion": {
      return (
        <AskQuestionCard
          input={input}
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
      const formData = isRecord(input) ? (input.formData as Record<string, string>) : {};
      const formLines = formData
        ? Object.entries(formData).slice(0, 6).map(([k, v]) => `${k}: ${v}`)
        : [];
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
                onClick={handleAction}
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
      const formSummary = isRecord(input) ? (input.formSummary as Record<string, string>) : {};
      const totalFees = isRecord(input) ? numberField(input, "totalFees", 0) : 0;
      return (
        <Card className="notam">
          <CardHead>APPROVE SUBMISSION</CardHead>
          <div className="cl">
            {formSummary && Object.entries(formSummary).map(([k, v], i) => (
              <ClRow key={i} label={k.replace(/_/g, " ").toUpperCase()} state={v} />
            ))}
            <ClRow label="Total fees" state={`€${totalFees}`} />
            <div className="poll-detail" style={{ color: "var(--amber)", marginTop: 8 }}>
              ▲ Review the form in the browser panel. Once you approve,
              the application will be submitted.
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
              <KeyButton
                onClick={() => {
                  setIsSubmitting(true);
                  onOutput({
                    tool: "approveSubmission",
                    toolCallId: part.toolCallId,
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
                    tool: "approveSubmission",
                    toolCallId: part.toolCallId,
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
