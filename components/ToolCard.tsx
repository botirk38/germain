"use client";

import { useState, type ReactNode } from "react";
import { Card, CardHead, CardFoot, ClRow } from "@/components/attache/Card";
import { StatusMark } from "@/components/attache/StatusMark";
import { KeyButton } from "@/components/attache/KeyButton";
import { MachinePanel } from "@/components/attache/MachinePanel";
import { SlotBox } from "@/components/attache/SlotBox";
import { FileUpload } from "@/components/attache/FileUpload";
import { reviewStatusWord } from "@/lib/attache-display";
import type { GermainUIMessage } from "@/lib/agents/germain";
import type {
  GermainClientToolName,
  GermainClientToolResult,
  PayFeesOutput,
  ProvideMissingInsuranceOutput,
  SubmitFilingOutput,
  UploadDocumentsOutput,
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

// Uppercase mono card headers — replaces the old icon map
const toolHeaders: Record<string, string> = {
  assessEligibility: "ELIGIBILITY",
  recommendVisaRoute: "VISA ROUTE",
  buildChecklist: "DOCUMENT CHECKLIST",
  uploadDocuments: "UPLOAD REQUIRED",
  reviewDocuments: "DOCUMENT REVIEW",
  generateApplication: "APPLICATION FORM",
  prepareSupportingPack: "SUPPORTING PACK",
  runRiskReview: "RISK REVIEW",
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

function stringField(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  return typeof value === "string" ? value : "";
}

function getClientToolOutput(
  toolName: GermainClientToolName,
  input: unknown
): GermainClientToolResult["output"] {
  switch (toolName) {
    case "uploadDocuments": {
      const requiredTypes = stringArrayField(input, "requiredTypes");
      return {
        success: true,
        uploadedCount: requiredTypes.length || 3,
        documents: requiredTypes.map((type, i) => ({
          id: `doc-${i}`,
          type,
          name: `${type.replace("_", " ")}.pdf`,
          status: "uploaded",
        })),
      };
    }

    case "payFees":
      return {
        success: true,
        paymentRef: `PAY-${Date.now()}`,
        amount: isRecord(input) ? numberField(input, "total", 120) : 120,
        paidAt: new Date().toISOString(),
      };

    case "submitFiling":
      return {
        success: true,
        approved: true,
        referenceNumber: `GER-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        submittedAt: new Date().toISOString(),
      };

    case "provideMissingInsurance":
      return {
        success: true,
        documentId: "insurance-policy-001",
        documentType: "insurance",
        verified: true,
      };
  }
}

// Working state: telex card with blinking cursor (dashed while input streams)
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

// Sage mono confirmation line used for completed client interactions
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

export function RunRiskReviewToolPart({ part }: { part: ToolPart<"runRiskReview"> }) {
  return <ToolStateCard part={part} toolName="runRiskReview">{(output) => <ServerToolOutput toolName="runRiskReview" output={output} />}</ToolStateCard>;
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

export function PayFeesToolPart({
  part,
  onOutput,
}: {
  part: ToolPart<"payFees">;
  onOutput: (result: GermainClientToolResult) => void;
}) {
  return (
    <ClientToolPart
      part={part}
      toolName="payFees"
      onOutput={onOutput}
      renderOutput={(output) => <ServerToolOutput toolName="payFees" output={output} />}
    />
  );
}

export function SubmitFilingToolPart({
  part,
  onOutput,
}: {
  part: ToolPart<"submitFiling">;
  onOutput: (result: GermainClientToolResult) => void;
}) {
  return (
    <ClientToolPart
      part={part}
      toolName="submitFiling"
      onOutput={onOutput}
      renderOutput={(output) => <ServerToolOutput toolName="submitFiling" output={output} />}
    />
  );
}

export function ProvideMissingInsuranceToolPart({
  part,
  onOutput,
}: {
  part: ToolPart<"provideMissingInsurance">;
  onOutput: (result: GermainClientToolResult) => void;
}) {
  return (
    <ClientToolPart
      part={part}
      toolName="provideMissingInsurance"
      onOutput={onOutput}
      renderOutput={(output) => <ServerToolOutput toolName="provideMissingInsurance" output={output} />}
    />
  );
}

export function ToolPartRenderer({ part, onOutput }: ToolPartRendererProps) {
  switch (part.type) {
    case "tool-assessEligibility":
      return <AssessEligibilityToolPart part={part} />;
    case "tool-recommendVisaRoute":
      return <RecommendVisaRouteToolPart part={part} />;
    case "tool-buildChecklist":
      return <BuildChecklistToolPart part={part} />;
    case "tool-uploadDocuments":
      return <UploadDocumentsToolPart part={part} onOutput={onOutput} />;
    case "tool-reviewDocuments":
      return <ReviewDocumentsToolPart part={part} />;
    case "tool-generateApplication":
      return <GenerateApplicationToolPart part={part} />;
    case "tool-prepareSupportingPack":
      return <PrepareSupportingPackToolPart part={part} />;
    case "tool-runRiskReview":
      return <RunRiskReviewToolPart part={part} />;
    case "tool-bookAppointment":
      return <BookAppointmentToolPart part={part} />;
    case "tool-payFees":
      return <PayFeesToolPart part={part} onOutput={onOutput} />;
    case "tool-submitFiling":
      return <SubmitFilingToolPart part={part} onOutput={onOutput} />;
    case "tool-trackEmbassyUpdates":
      return <TrackEmbassyUpdatesToolPart part={part} />;
    case "tool-trackDecision":
      return <TrackDecisionToolPart part={part} />;
    case "tool-provideMissingInsurance":
      return <ProvideMissingInsuranceToolPart part={part} onOutput={onOutput} />;
    default:
      return null;
  }
}

// Server tool output display
function ServerToolOutput({
  toolName,
  output,
}: {
  toolName: string;
  output: Record<string, unknown>;
}) {
  // Render different outputs based on tool type
  switch (toolName) {
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
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "8px 0 2px",
              }}
            >
              {output.consulate as string}
            </div>
            <ClRow
              label="Category"
              state={String(output.visaCategory ?? "").toUpperCase()}
            />
            <ClRow
              label="Processing time"
              state={output.processingTime as string}
            />
            <ClRow label="Fee" state={`€${output.visaFee as number}`} />
            {requirements.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  padding: "8px 0 2px",
                }}
              >
                {requirements.slice(0, 4).map((req, i) => (
                  <span key={i} className="fchip">
                    {req}
                  </span>
                ))}
              </div>
            )}
          </div>
          <CardFoot>+{output.oddsBoost as number} ODDS</CardFoot>
        </Card>
      );
    }

    case "buildChecklist": {
      const requiredDocuments =
        (output.requiredDocuments as Array<{
          type: string;
          description: string;
          critical: boolean;
        }>) ?? [];
      const optionalDocuments = (output.optionalDocuments as string[]) ?? [];
      const criticalCount = requiredDocuments.filter((d) => d.critical).length;
      // The full per-document list lives in the sidebar DOCUMENTS panel and the
      // upload card — keep this card a concise summary so it isn't duplicated.
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
            EST. {output.estimatedCompletionDays as number} DAYS · LISTED IN THE
            SIDEBAR
          </CardFoot>
        </Card>
      );
    }

    case "reviewDocuments": {
      const fields = (output.extractedFields as Record<string, string>) ?? {};
      const issues =
        (output.issues as Array<{
          severity: string;
          message: string;
          impact: number;
        }>) ?? [];
      const recommendations =
        (output.recommendations as Array<{
          id?: string;
          issue: string;
          fix: string;
          impact: number;
        }>) ?? [];
      const verificationStatus = output.verificationStatus as
        | "verified"
        | "needs_review"
        | "rejected"
        | undefined;
      return (
        <Card>
          <CardHead>DOCUMENT REVIEW</CardHead>
          <div className="cl">
            {Object.entries(fields).map(([field, value], i) => (
              <div
                key={field}
                className="cl-row poll-row"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span>{field.replace(/_/g, " ").toUpperCase()}</span>
                <span className="dots" />
                <span className="state">{value}</span>
              </div>
            ))}
            <ClRow
              label="Status"
              state={
                verificationStatus ? (
                  <StatusMark word={reviewStatusWord(verificationStatus)} />
                ) : (
                  <StatusMark word="waiting" />
                )
              }
            />
            {issues.map((issue, i) => (
              <div
                key={`issue-${i}`}
                className={
                  issue.severity === "critical"
                    ? "poll-detail bad"
                    : "poll-detail"
                }
                style={
                  issue.severity === "warning"
                    ? { color: "var(--amber)" }
                    : undefined
                }
              >
                {issue.severity === "critical"
                  ? "✕ "
                  : issue.severity === "warning"
                  ? "▲ "
                  : ""}
                {issue.message}
              </div>
            ))}
            {recommendations.map((rec, i) => (
              <div key={rec.id ?? `rec-${i}`} className="poll-detail">
                <span style={{ color: "var(--amber)" }}>▲ Check this</span> —{" "}
                {rec.fix}{" "}
                <span className="mono" style={{ color: "var(--sage)" }}>
                  +{rec.impact}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    case "generateApplication": {
      const formData = (output.formData as Record<string, string>) ?? {};
      const consistency = output.consistencyCheck as
        | { passed: boolean; mismatches: string[] }
        | undefined;
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
            final={`FORM COMPLETE — EST. ODDS ${
              output.estimatedApprovalOdds as number
            }%`}
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
            <ClRow
              label="Proof of ties"
              state={<StatusMark word="verified" />}
            />
          </div>
          <CardFoot>+{output.oddsBoost as number} ODDS</CardFoot>
        </Card>
      );

    case "runRiskReview": {
      const finalRecommendations =
        (output.finalRecommendations as Array<{
          id?: string;
          issue: string;
          fix: string;
          impact: number;
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
              state={
                <StatusMark word={output.readyToSubmit ? "verified" : "check"} />
              }
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

    case "bookAppointment": {
      const whatToBring = (output.whatToBring as string[]) ?? [];
      return (
        <SlotBox
          title={`Appointment found — ${output.date as string}, ${
            output.time as string
          }`}
          calChip="▦ Add to calendar"
        >
          <div>{output.location as string}</div>
          <div
            className="mono"
            style={{
              fontSize: 10.5,
              fontWeight: 400,
              letterSpacing: "0.12em",
              marginTop: 3,
              color: "var(--ink2)",
            }}
          >
            {output.confirmationCode as string}
          </div>
          {whatToBring.length > 0 && (
            <div
              style={{
                marginTop: 6,
                fontWeight: 400,
                fontSize: 11,
                lineHeight: 1.55,
                color: "var(--ink2)",
              }}
            >
              {whatToBring.map((item) => (
                <div key={item}>· {item}</div>
              ))}
            </div>
          )}
        </SlotBox>
      );
    }

    case "trackEmbassyUpdates": {
      const actionNeeded =
        Boolean(output.actionRequired) || output.status === "rfe_issued";
      const rfeDetails = output.rfeDetails as
        | { missingItem: string; explanation: string }
        | undefined;
      const deadline = output.deadline as string | undefined;
      if (actionNeeded) {
        return (
          <Card className="notam">
            <CardHead>EMBASSY UPDATE — ACTION NEEDED</CardHead>
            <div className="notam-body">
              {rfeDetails ? (
                <>
                  <strong>{rfeDetails.missingItem}</strong>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12.5,
                      color: "var(--ink2)",
                    }}
                  >
                    {rfeDetails.explanation}
                  </div>
                </>
              ) : (
                (output.message as string)
              )}
            </div>
            {deadline ? <CardFoot>RESPOND BY {deadline}</CardFoot> : null}
          </Card>
        );
      }
      return (
        <Card>
          <CardHead>EMBASSY UPDATE</CardHead>
          <div className="notam-body">
            <span
              className="mono"
              style={{
                fontSize: 9.5,
                letterSpacing: "0.16em",
                color: "var(--ink2)",
              }}
            >
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
            {output.validityPeriod ? (
              <div>Valid {output.validityPeriod as string}</div>
            ) : null}
            {output.entries ? (
              <div style={{ fontWeight: 400 }}>
                Entries: {String(output.entries)}
              </div>
            ) : null}
            {nextSteps ? (
              <div
                style={{
                  marginTop: 6,
                  fontWeight: 400,
                  fontSize: 11.5,
                  lineHeight: 1.5,
                  color: "var(--ink2)",
                }}
              >
                {nextSteps}
              </div>
            ) : null}
          </SlotBox>
        );
      }
      if (output.decision === "refused") {
        const refusalReasons = (output.refusalReasons as string[]) ?? [];
        return (
          <article
            className="card"
            style={{ borderLeft: "4px solid var(--clay)" }}
          >
            <CardHead>DECISION</CardHead>
            <div className="notam-body">
              <StatusMark word="problem" />
              {refusalReasons.map((reason, i) => (
                <div key={i} className="poll-detail bad" style={{ marginTop: 4 }}>
                  ✕ {reason}
                </div>
              ))}
              {nextSteps ? (
                <div
                  style={{ marginTop: 6, fontSize: 12.5, color: "var(--ink2)" }}
                >
                  {nextSteps}
                </div>
              ) : null}
            </div>
          </article>
        );
      }
      // additional_processing
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

    // ---- client-interaction tools after the user acted ----

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

// Client tool interaction UI
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

    const output = getClientToolOutput(toolName, input);

    // Simulate processing delay
    setTimeout(() => {
      switch (toolName) {
        case "uploadDocuments":
          onOutput({ tool: "uploadDocuments", toolCallId: part.toolCallId, output: output as UploadDocumentsOutput });
          break;
        case "payFees":
          onOutput({ tool: "payFees", toolCallId: part.toolCallId, output: output as PayFeesOutput });
          break;
        case "submitFiling":
          onOutput({ tool: "submitFiling", toolCallId: part.toolCallId, output: output as SubmitFilingOutput });
          break;
        case "provideMissingInsurance":
          onOutput({ tool: "provideMissingInsurance", toolCallId: part.toolCallId, output: output as ProvideMissingInsuranceOutput });
          break;
      }
      setIsSubmitting(false);
    }, 800);
  };

  // Render different UI based on tool
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

    case "payFees": {
      const fees = isRecord(input) ? input : {};
      return (
        <Card className="notam">
          <CardHead>FEES</CardHead>
          <div className="cl">
            <ClRow label="Visa fee" state={`€${numberField(fees, "visaFee", 80)}`} />
            <ClRow label="Service fee" state={`€${numberField(fees, "serviceFee", 25)}`} />
            <ClRow label="VAC fee" state={`€${numberField(fees, "vacFee", 15)}`} />
            <div className="cl-row" style={{ fontWeight: 700 }}>
              <span>TOTAL</span>
              <span className="dots" />
              <span
                className="state"
                style={{ color: "var(--ink)", fontWeight: 700, fontSize: 11 }}
              >
                €{numberField(fees, "total", 120)}
              </span>
            </div>
            <div
              style={{
                borderTop: "1px dashed var(--line)",
                marginTop: 4,
                paddingTop: 10,
              }}
            >
              <KeyButton
                onClick={handleAction}
                disabled={isSubmitting}
                submittingLabel="PROCESSING…"
              >
                PAY FEES
              </KeyButton>
            </div>
          </div>
        </Card>
      );
    }

    case "submitFiling": {
      const approvalLikelihood =
          isRecord(input) && typeof input.approvalLikelihood === "number"
            ? input.approvalLikelihood
            : 85;
      return (
        <Card className="notam">
          <CardHead>READY TO FILE</CardHead>
          <div className="cl">
            <ClRow
              label="Approval likelihood"
              state={`${approvalLikelihood}%`}
            />
            <div className="poll-detail" style={{ color: "var(--amber)" }}>
              ▲ Mock submission — no actual visa application will be filed.
            </div>
            <div style={{ paddingTop: 8 }}>
              <KeyButton
                onClick={handleAction}
                disabled={isSubmitting}
                submittingLabel="TRANSMITTING…"
              >
                CONFIRM &amp; SUBMIT
              </KeyButton>
            </div>
          </div>
        </Card>
      );
    }

    case "provideMissingInsurance": {
      const rfeDetails = isRecord(input) && isRecord(input.rfeDetails) ? input.rfeDetails : {};
      const deadline = isRecord(input) && typeof input.deadline === "string" ? input.deadline : "";
      return (
        <Card className="notam">
          <CardHead>RFE — INSURANCE REQUIRED</CardHead>
          <div className="notam-body">
            <strong>{stringField(rfeDetails, "missingItem")}</strong>
            <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>
              {stringField(rfeDetails, "explanation")}
            </div>
            <div
              className="mono"
              style={{
                marginTop: 8,
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "var(--ink2)",
              }}
            >
              DEADLINE {deadline}
            </div>
            <div style={{ marginTop: 10 }}>
              <KeyButton
                onClick={handleAction}
                disabled={isSubmitting}
                submittingLabel="TRANSMITTING…"
              >
                UPLOAD POLICY
              </KeyButton>
            </div>
          </div>
        </Card>
      );
    }

    default:
      return null;
  }
}
