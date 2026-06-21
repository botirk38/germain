"use client";

import { useState, type ReactNode } from "react";
import { Card, CardHead, CardFoot, ClRow } from "@/components/attache/Card";
import { StatusMark } from "@/components/attache/StatusMark";
import { KeyButton } from "@/components/attache/KeyButton";
import { MachinePanel } from "@/components/attache/MachinePanel";
import { SlotBox } from "@/components/attache/SlotBox";
import { FileUpload } from "@/components/attache/FileUpload";
import {
  Tool,
  ToolHeader,
  ToolContent,
} from "@/components/ai-elements/tool";
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

interface ToolPartRendererProps {
  part: MessagePart;
  onOutput: (result: GermainClientToolResult) => void;
}

const toolHeaders: Record<string, string> = {
  // Consolidated tools
  evaluateCase: "CASE EVALUATION",
  uploadDocuments: "UPLOAD REQUIRED",
  reviewAndPrepare: "REVIEW & PREPARE",
  runRiskReview: "RISK REVIEW",
  submitApplication: "SUBMIT APPLICATION",
  approveSubmission: "APPROVE SUBMISSION",
  monitorCase: "CASE MONITOR",
  // Legacy tool names (backward compatibility)
  assessEligibility: "ELIGIBILITY",
  recommendVisaRoute: "VISA ROUTE",
  buildChecklist: "DOCUMENT CHECKLIST",
  reviewDocuments: "DOCUMENT REVIEW",
  generateApplication: "APPLICATION FORM",
  prepareSupportingPack: "SUPPORTING PACK",
  bookAppointment: "APPOINTMENT",
  payFees: "FEES",
  submitFiling: "READY TO FILE",
  trackEmbassyUpdates: "EMBASSY UPDATE",
  trackDecision: "DECISION",
  provideMissingInsurance: "RFE — INSURANCE REQUIRED",
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

type ToolWrapperState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

function ToolWrapper({
  toolName,
  state,
  children,
}: {
  toolName: string;
  state: ToolWrapperState;
  children: ReactNode;
}) {
  const header = toolHeaders[toolName] ?? toolName.toUpperCase();
  const isDone = state === "output-available";
  return (
    <Tool defaultOpen className="tool-collapsible">
      <ToolHeader
        title={header}
        type="dynamic-tool"
        state={state}
        toolName={toolName}
        className="tool-header"
      />
      <ToolContent className="tool-body">
        {isDone ? children : <WorkingCard header={header} dashed={state === "input-streaming"} />}
      </ToolContent>
    </Tool>
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

  const inner = (() => {
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
  })();

  return (
    <ToolWrapper toolName={toolName} state={part.state}>
      {inner}
    </ToolWrapper>
  );
}

// ==================== CONSOLIDATED TOOL PARTS ====================

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

// ==================== LEGACY TOOL PARTS (backward compat) ====================

export function AssessEligibilityToolPart({ part }: { part: ToolPart<"assessEligibility"> }) {
  return <ToolStateCard part={part} toolName="assessEligibility">{(output) => <ServerToolOutput toolName="assessEligibility" output={output} />}</ToolStateCard>;
}

export function RecommendVisaRouteToolPart({ part }: { part: ToolPart<"recommendVisaRoute"> }) {
  return <ToolStateCard part={part} toolName="recommendVisaRoute">{(output) => <ServerToolOutput toolName="recommendVisaRoute" output={output} />}</ToolStateCard>;
}

export function BuildChecklistToolPart({ part }: { part: ToolPart<"buildChecklist"> }) {
  return <ToolStateCard part={part} toolName="buildChecklist">{(output) => <ServerToolOutput toolName="buildChecklist" output={output} />}</ToolStateCard>;
}

export function ReviewDocumentsToolPart({ part }: { part: ToolPart<"reviewDocuments"> }) {
  return <ToolStateCard part={part} toolName="reviewDocuments">{(output) => <ServerToolOutput toolName="reviewDocuments" output={output} />}</ToolStateCard>;
}

export function GenerateApplicationToolPart({ part }: { part: ToolPart<"generateApplication"> }) {
  return <ToolStateCard part={part} toolName="generateApplication">{(output) => <ServerToolOutput toolName="generateApplication" output={output} />}</ToolStateCard>;
}

export function PrepareSupportingPackToolPart({ part }: { part: ToolPart<"prepareSupportingPack"> }) {
  return <ToolStateCard part={part} toolName="prepareSupportingPack">{(output) => <ServerToolOutput toolName="prepareSupportingPack" output={output} />}</ToolStateCard>;
}

export function BookAppointmentToolPart({ part }: { part: ToolPart<"bookAppointment"> }) {
  return <ToolStateCard part={part} toolName="bookAppointment">{(output) => <ServerToolOutput toolName="bookAppointment" output={output} />}</ToolStateCard>;
}

export function TrackEmbassyUpdatesToolPart({ part }: { part: ToolPart<"trackEmbassyUpdates"> }) {
  return <ToolStateCard part={part} toolName="trackEmbassyUpdates">{(output) => <ServerToolOutput toolName="trackEmbassyUpdates" output={output} />}</ToolStateCard>;
}

export function TrackDecisionToolPart({ part }: { part: ToolPart<"trackDecision"> }) {
  return <ToolStateCard part={part} toolName="trackDecision">{(output) => <ServerToolOutput toolName="trackDecision" output={output} />}</ToolStateCard>;
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

// ==================== TOOL PART RENDERER ====================

export function ToolPartRenderer({ part, onOutput }: ToolPartRendererProps) {
  switch (part.type) {
    // Consolidated tools
    case "tool-evaluateCase":
      return <EvaluateCaseToolPart part={part} />;
    case "tool-reviewAndPrepare":
      return <ReviewAndPrepareToolPart part={part} />;
    case "tool-runRiskReview":
      return <RunRiskReviewToolPart part={part} />;
    case "tool-monitorCase":
      return <MonitorCaseToolPart part={part} />;
    case "tool-uploadDocuments":
      return <UploadDocumentsToolPart part={part} onOutput={onOutput} />;
    case "tool-submitApplication":
      return <SubmitApplicationToolPart part={part} onOutput={onOutput} />;
    case "tool-approveSubmission":
      return <ApproveSubmissionToolPart part={part} onOutput={onOutput} />;
    // Legacy tool names are kept in ServerToolOutput for backward compatibility
    // but the agent only uses consolidated tool names going forward
    default:
      return null;
  }
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
    // ===== Consolidated tools =====

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

    // Client tools after user acted
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

    // ===== Legacy tool outputs (backward compat) =====

    case "assessEligibility":
      return (
        <Card>
          <CardHead>ELIGIBILITY</CardHead>
          <div className="cl">
            <ClRow
              label="Eligible"
              state={<StatusMark word={output.eligible ? "verified" : "problem"} />}
            />
            <ClRow label="Visa type" state={output.visaType as string} />
            <ClRow
              label="Base odds"
              state={`${output.baseLikelihood as number}%`}
            />
            <div className="poll-detail" style={{ paddingTop: 4 }}>
              {output.reasoning as string}
            </div>
          </div>
        </Card>
      );

    case "recommendVisaRoute": {
      const requirements = (output.requirements as string[]) ?? [];
      return (
        <Card>
          <CardHead>VISA ROUTE</CardHead>
          <div className="cl">
            <div
              className="mono"
              style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", padding: "8px 0 2px" }}
            >
              {output.consulate as string}
            </div>
            <ClRow label="Category" state={String(output.visaCategory ?? "").toUpperCase()} />
            <ClRow label="Processing time" state={output.processingTime as string} />
            <ClRow label="Fee" state={`€${output.visaFee as number}`} />
            {requirements.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "8px 0 2px" }}>
                {requirements.slice(0, 4).map((req, i) => (
                  <span key={i} className="fchip">{req}</span>
                ))}
              </div>
            )}
          </div>
          <CardFoot>+{output.oddsBoost as number} ODDS</CardFoot>
        </Card>
      );
    }

    case "buildChecklist": {
      const requiredDocuments = (output.requiredDocuments as Array<{
        type: string; description: string; critical: boolean;
      }>) ?? [];
      const optionalDocuments = (output.optionalDocuments as string[]) ?? [];
      const criticalCount = requiredDocuments.filter((d) => d.critical).length;
      return (
        <Card>
          <CardHead>DOCUMENT CHECKLIST</CardHead>
          <div className="cl">
            <ClRow label="Required documents" state={`${requiredDocuments.length}`} />
            <ClRow label="Critical" state={`${criticalCount}`} critical />
            {optionalDocuments.length > 0 && (
              <ClRow label="Optional" state={`${optionalDocuments.length}`} />
            )}
          </div>
          <CardFoot>
            EST. {output.estimatedCompletionDays as number} DAYS · LISTED IN THE SIDEBAR
          </CardFoot>
        </Card>
      );
    }

    case "reviewDocuments": {
      const fields = (output.extractedFields as Record<string, string>) ?? {};
      const issues = (output.issues as Array<{ severity: string; message: string; impact: number }>) ?? [];
      const recommendations = (output.recommendations as Array<{
        id?: string; issue: string; fix: string; impact: number;
      }>) ?? [];
      const verificationStatus = output.verificationStatus as "verified" | "needs_review" | "rejected" | undefined;
      return (
        <Card>
          <CardHead>DOCUMENT REVIEW</CardHead>
          <div className="cl">
            {Object.entries(fields).map(([field, value], i) => (
              <div key={field} className="cl-row poll-row" style={{ animationDelay: `${i * 90}ms` }}>
                <span>{field.replace(/_/g, " ").toUpperCase()}</span>
                <span className="dots" />
                <span className="state">{value}</span>
              </div>
            ))}
            <ClRow
              label="Status"
              state={verificationStatus ? <StatusMark word={reviewStatusWord(verificationStatus)} /> : <StatusMark word="waiting" />}
            />
            {issues.map((issue, i) => (
              <div
                key={`issue-${i}`}
                className={issue.severity === "critical" ? "poll-detail bad" : "poll-detail"}
                style={issue.severity === "warning" ? { color: "var(--amber)" } : undefined}
              >
                {issue.severity === "critical" ? "✕ " : issue.severity === "warning" ? "▲ " : ""}
                {issue.message}
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
      );
    }

    case "generateApplication": {
      const formData = (output.formData as Record<string, string>) ?? {};
      const consistency = output.consistencyCheck as { passed: boolean; mismatches: string[] } | undefined;
      const lines = Object.entries(formData).map(
        ([field, value]) => `${field.toUpperCase()}: ${value || "—"} ✓`
      );
      if (consistency) {
        if (consistency.passed) {
          lines.push("CONSISTENCY CHECK: PASS");
        } else {
          for (const mismatch of consistency.mismatches) {
            lines.push(`✕ ${mismatch}`);
          }
        }
      }
      return (
        <Card>
          <MachinePanel
            lines={lines}
            final={`FORM COMPLETE — EST. ODDS ${output.estimatedApprovalOdds as number}%`}
          />
        </Card>
      );
    }

    case "prepareSupportingPack":
      return (
        <Card>
          <CardHead>SUPPORTING PACK</CardHead>
          <div className="cl">
            <ClRow label="Cover letter" state={<StatusMark word="verified" />} />
            <ClRow label="Itinerary" state={<StatusMark word="verified" />} />
            <ClRow label="Proof of ties" state={<StatusMark word="verified" />} />
          </div>
          <CardFoot>+{output.oddsBoost as number} ODDS</CardFoot>
        </Card>
      );

    case "bookAppointment": {
      const whatToBring = (output.whatToBring as string[]) ?? [];
      return (
        <SlotBox
          title={`Appointment found — ${output.date as string}, ${output.time as string}`}
          calChip="▦ Add to calendar"
        >
          <div>{output.location as string}</div>
          <div className="mono" style={{ fontSize: 10.5, fontWeight: 400, letterSpacing: "0.12em", marginTop: 3, color: "var(--ink2)" }}>
            {output.confirmationCode as string}
          </div>
          {whatToBring.length > 0 && (
            <div style={{ marginTop: 6, fontWeight: 400, fontSize: 11, lineHeight: 1.55, color: "var(--ink2)" }}>
              {whatToBring.map((item) => (
                <div key={item}>· {item}</div>
              ))}
            </div>
          )}
        </SlotBox>
      );
    }

    case "trackEmbassyUpdates": {
      const actionNeeded = Boolean(output.actionRequired) || output.status === "rfe_issued";
      const rfeDetails = output.rfeDetails as { missingItem: string; explanation: string } | undefined;
      const deadline = output.deadline as string | undefined;
      if (actionNeeded) {
        return (
          <Card className="notam">
            <CardHead>EMBASSY UPDATE — ACTION NEEDED</CardHead>
            <div className="notam-body">
              {rfeDetails ? (
                <>
                  <strong>{rfeDetails.missingItem}</strong>
                  <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>{rfeDetails.explanation}</div>
                </>
              ) : (output.message as string)}
            </div>
            {deadline ? <CardFoot>RESPOND BY {deadline}</CardFoot> : null}
          </Card>
        );
      }
      return (
        <Card>
          <CardHead>EMBASSY UPDATE</CardHead>
          <div className="notam-body">
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.16em", color: "var(--ink2)" }}>
              {String(output.status ?? "").replace(/_/g, " ").toUpperCase()}
            </span>
            <div style={{ marginTop: 4 }}>{output.message as string}</div>
          </div>
        </Card>
      );
    }

    case "trackDecision": {
      const nextSteps = output.nextSteps as string | undefined;
      if (output.decision === "approved") {
        return (
          <SlotBox title="● APPROVED">
            {output.validityPeriod ? <div>Valid {output.validityPeriod as string}</div> : null}
            {output.entries ? <div style={{ fontWeight: 400 }}>Entries: {String(output.entries)}</div> : null}
            {nextSteps ? (
              <div style={{ marginTop: 6, fontWeight: 400, fontSize: 11.5, lineHeight: 1.5, color: "var(--ink2)" }}>
                {nextSteps}
              </div>
            ) : null}
          </SlotBox>
        );
      }
      if (output.decision === "refused") {
        const refusalReasons = (output.refusalReasons as string[]) ?? [];
        return (
          <article className="card" style={{ borderLeft: "4px solid var(--clay)" }}>
            <CardHead>DECISION</CardHead>
            <div className="notam-body">
              <StatusMark word="problem" />
              {refusalReasons.map((reason, i) => (
                <div key={i} className="poll-detail bad" style={{ marginTop: 4 }}>✕ {reason}</div>
              ))}
              {nextSteps ? (
                <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--ink2)" }}>{nextSteps}</div>
              ) : null}
            </div>
          </article>
        );
      }
      return (
        <Card className="notam">
          <CardHead>DECISION — ADDITIONAL PROCESSING</CardHead>
          <div className="notam-body">
            <StatusMark word="check" />
            {nextSteps ? <div style={{ marginTop: 4 }}>{nextSteps}</div> : null}
          </div>
        </Card>
      );
    }

    case "payFees":
      return (
        <Card>
          <CardHead>FEES</CardHead>
          <div className="cl">
            <SageLine>● PAID · {output.paymentRef as string}</SageLine>
          </div>
        </Card>
      );

    case "submitFiling":
      return (
        <Card>
          <MachinePanel
            lines={[`REF: ${output.referenceNumber as string}`]}
            final="APPLICATION SUBMITTED"
            showRunway
          />
        </Card>
      );

    case "provideMissingInsurance":
      return (
        <Card>
          <CardHead>RFE — INSURANCE REQUIRED</CardHead>
          <div className="cl">
            <SageLine>● POLICY VERIFIED</SageLine>
          </div>
        </Card>
      );

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
    return (
      <ToolWrapper toolName={toolName} state={part.state}>
        <WorkingCard header={header} dashed />
      </ToolWrapper>
    );
  }

  if (part.state === "output-error" || part.state === "output-denied") {
    return (
      <ToolWrapper toolName={toolName} state={part.state}>
        <ToolErrorCard header={header} errorText={"errorText" in part ? part.errorText : undefined} />
      </ToolWrapper>
    );
  }

  if (part.state === "output-available" && part.output) {
    return (
      <ToolWrapper toolName={toolName} state={part.state}>
        {renderOutput(isRecord(part.output) ? part.output : { value: part.output })}
      </ToolWrapper>
    );
  }

  const handleAction = () => {
    setIsSubmitting(true);

    setTimeout(() => {
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
        case "submitApplication":
          onOutput({
            tool: "submitApplication", toolCallId: part.toolCallId,
            output: { sessionId: `bus-${Date.now()}`, liveViewUrl: "", status: "ready_for_review" },
          });
          break;
        case "approveSubmission":
          onOutput({
            tool: "approveSubmission", toolCallId: part.toolCallId,
            output: { approved: true },
          });
          break;
      }
      setIsSubmitting(false);
    }, 800);
  };

  const interactiveContent = (() => {
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
              setTimeout(() => {
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
              }, 800);
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
                    setTimeout(() => {
                      onOutput({
                        tool: "approveSubmission",
                        toolCallId: part.toolCallId,
                        output: { approved: true },
                      });
                      setIsSubmitting(false);
                    }, 400);
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
  })();

  return (
    <ToolWrapper toolName={toolName} state={part.state}>
      {interactiveContent}
    </ToolWrapper>
  );
}
