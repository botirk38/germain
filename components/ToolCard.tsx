"use client";

// Component only receives invocation via props, no need for message type
import { useState } from "react";
import { Card, CardHead, CardFoot, ClRow } from "@/components/attache/Card";
import { StatusMark } from "@/components/attache/StatusMark";
import { KeyButton } from "@/components/attache/KeyButton";
import { MachinePanel } from "@/components/attache/MachinePanel";
import { SlotBox } from "@/components/attache/SlotBox";
import { FileUpload } from "@/components/attache/FileUpload";
import { reviewStatusWord } from "@/lib/attache-display";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  state:
    | "input-streaming"
    | "input-available"
    | "approval-requested"
    | "approval-responded"
    | "output-available"
    | "output-error"
    | "output-denied";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorText?: string;
}

interface ToolCardProps {
  invocation: ToolInvocation;
  onOutput: (toolCallId: string, toolName: string, output: unknown) => void;
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

// Client-interaction tools (no server execute)
const clientInteractionTools = [
  "uploadDocuments",
  "payFees",
  "submitFiling",
  "provideMissingInsurance",
];

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
function SageLine({ children }: { children: React.ReactNode }) {
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

export function ToolCard({ invocation, onOutput }: ToolCardProps) {
  const { toolCallId, toolName, state, input, output, errorText } = invocation;
  const isClientTool = clientInteractionTools.includes(toolName);
  const header = toolHeaders[toolName] ?? toolName.toUpperCase();

  // Input still streaming from the model — dashed working card
  if (state === "input-streaming") {
    return <WorkingCard header={header} dashed />;
  }

  // Failure — clay left edge + problem line
  if (state === "output-error" || state === "output-denied") {
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

  // Tools with output (server results + completed client interactions)
  if (state === "output-available" && output) {
    return <ServerToolOutput toolName={toolName} output={output} />;
  }

  // Client tools waiting for interaction
  if (isClientTool && state !== "output-available") {
    return (
      <ClientToolInteraction
        toolName={toolName}
        toolCallId={toolCallId}
        input={input}
        onOutput={onOutput}
      />
    );
  }

  // Server tool executing
  return <WorkingCard header={header} />;
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
function ClientToolInteraction({
  toolName,
  toolCallId,
  input,
  onOutput,
}: {
  toolName: string;
  toolCallId: string;
  input?: Record<string, unknown>;
  onOutput: (toolCallId: string, toolName: string, output: unknown) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = () => {
    setIsSubmitting(true);

    // Mock different outputs based on tool
    let output: Record<string, unknown> = { success: true };

    switch (toolName) {
      case "uploadDocuments":
        output = {
          success: true,
          uploadedCount: (input?.requiredTypes as string[])?.length || 3,
          documents: (input?.requiredTypes as string[])?.map((type, i) => ({
            id: `doc-${i}`,
            type,
            name: `${type.replace("_", " ")}.pdf`,
            status: "uploaded",
          })) || [],
        };
        break;

      case "payFees":
        output = {
          success: true,
          paymentRef: `PAY-${Date.now()}`,
          amount: input?.total || 120,
          paidAt: new Date().toISOString(),
        };
        break;

      case "submitFiling":
        output = {
          success: true,
          approved: true,
          referenceNumber: `GER-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          submittedAt: new Date().toISOString(),
        };
        break;

      case "provideMissingInsurance":
        output = {
          success: true,
          documentId: "insurance-policy-001",
          documentType: "insurance",
          verified: true,
        };
        break;
    }

    // Simulate processing delay
    setTimeout(() => {
      onOutput(toolCallId, toolName, output);
      setIsSubmitting(false);
    }, 800);
  };

  // Render different UI based on tool
  switch (toolName) {
    case "uploadDocuments": {
      const requiredTypes = (input?.requiredTypes as string[]) ?? [];
      const criticalDocuments = (input?.criticalDocuments as string[]) ?? [];
      return (
        <FileUpload
          requiredTypes={requiredTypes}
          criticalDocuments={criticalDocuments}
          isSubmitting={isSubmitting}
          onUpload={(documents) => {
            setIsSubmitting(true);
            setTimeout(() => {
              onOutput(toolCallId, toolName, {
                success: true,
                uploadedCount: documents.length,
                documents,
              });
              setIsSubmitting(false);
            }, 800);
          }}
        />
      );
    }

    case "payFees": {
      const fees = input as
        | { visaFee?: number; serviceFee?: number; vacFee?: number; total?: number }
        | undefined;
      return (
        <Card className="notam">
          <CardHead>FEES</CardHead>
          <div className="cl">
            <ClRow label="Visa fee" state={`€${fees?.visaFee ?? 80}`} />
            <ClRow label="Service fee" state={`€${fees?.serviceFee ?? 25}`} />
            <ClRow label="VAC fee" state={`€${fees?.vacFee ?? 15}`} />
            <div className="cl-row" style={{ fontWeight: 700 }}>
              <span>TOTAL</span>
              <span className="dots" />
              <span
                className="state"
                style={{ color: "var(--ink)", fontWeight: 700, fontSize: 11 }}
              >
                €{fees?.total ?? 120}
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
        typeof input?.approvalLikelihood === "number"
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
      const rfeDetails = input?.rfeDetails as
        | { missingItem?: string; explanation?: string }
        | undefined;
      return (
        <Card className="notam">
          <CardHead>RFE — INSURANCE REQUIRED</CardHead>
          <div className="notam-body">
            <strong>{rfeDetails?.missingItem}</strong>
            <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>
              {rfeDetails?.explanation}
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
              DEADLINE {input?.deadline as string}
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
      return (
        <Card className="notam">
          <CardHead>{toolName.toUpperCase()}</CardHead>
          <div className="cl">
            <div style={{ paddingTop: 8 }}>
              <KeyButton
                onClick={handleAction}
                disabled={isSubmitting}
                submittingLabel="WORKING…"
              >
                CONFIRM
              </KeyButton>
            </div>
          </div>
        </Card>
      );
  }
}
