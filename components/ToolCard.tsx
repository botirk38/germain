"use client";

// Component only receives invocation via props, no need for message type
import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
  CreditCard,
  FileCheck,
  Shield,
  TrendingUp,
  Calendar,
  FileText,
  Globe,
  ClipboardList,
  Search,
  Package,
  AlertTriangle,
  Award,
} from "lucide-react";

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

const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  assessEligibility: Globe,
  recommendVisaRoute: Globe,
  buildChecklist: ClipboardList,
  uploadDocuments: Upload,
  reviewDocuments: Search,
  generateApplication: FileText,
  prepareSupportingPack: Package,
  runRiskReview: AlertTriangle,
  bookAppointment: Calendar,
  payFees: CreditCard,
  submitFiling: FileCheck,
  trackEmbassyUpdates: TrendingUp,
  trackDecision: Award,
  provideMissingInsurance: Shield,
};

const toolTitles: Record<string, string> = {
  assessEligibility: "Eligibility Assessment",
  recommendVisaRoute: "Visa Route Recommendation",
  buildChecklist: "Document Checklist",
  uploadDocuments: "Document Upload",
  reviewDocuments: "Document Review",
  generateApplication: "Application Form",
  prepareSupportingPack: "Supporting Documents",
  runRiskReview: "Risk Assessment",
  bookAppointment: "Biometrics Appointment",
  payFees: "Fee Payment",
  submitFiling: "Submit Application",
  trackEmbassyUpdates: "Embassy Updates",
  trackDecision: "Visa Decision",
  provideMissingInsurance: "Provide Insurance Document",
};

// Client-interaction tools (no server execute)
const clientInteractionTools = [
  "uploadDocuments",
  "payFees",
  "submitFiling",
  "provideMissingInsurance",
];

export function ToolCard({ invocation, onOutput }: ToolCardProps) {
  const { toolCallId, toolName, state, input, output } = invocation;
  const isClientTool = clientInteractionTools.includes(toolName);
  const Icon = toolIcons[toolName] || FileText;

  // Determine card state class
  const getCardStateClass = () => {
    if (state === "input-streaming") return "tool-card--input-streaming";
    if ((state === "input-available" || state === "approval-requested") && isClientTool)
      return "tool-card--input-available";
    if (state === "output-available") return "tool-card--output-available";
    if (state === "output-error" || state === "output-denied") return "tool-card--error";
    return "";
  };

  // Render content based on tool and state
  const renderContent = () => {
    // Server tools with output
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

    // Loading state
    return (
      <div className="flex items-center gap-2 text-[#737373]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Processing...</span>
      </div>
    );
  };

  return (
    <div className={`tool-card ${getCardStateClass()} animate-slide-in`}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            state === "output-available"
              ? "bg-green-500/20 text-green-500"
              : "bg-blue-500/20 text-blue-500"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{toolTitles[toolName] || toolName}</div>
          <div className="text-xs text-[#737373]">
            {state === "output-available"
              ? "Complete"
              : state === "output-error" || state === "output-denied"
              ? "Failed"
              : state === "approval-requested" || state === "approval-responded"
              ? "Needs approval"
              : isClientTool
              ? "Waiting for your action"
              : "Processing..."}
          </div>
        </div>
        {state === "output-available" && (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        )}
        {(state === "output-error" || state === "output-denied") && (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
        {isClientTool &&
          state !== "output-available" &&
          state !== "output-error" &&
          state !== "output-denied" && (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
      </div>

      <div className="mt-2">{renderContent()}</div>
    </div>
  );
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
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Eligible:</span>
            <span className={output.eligible ? "text-green-500" : "text-red-500"}>
              {output.eligible ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Visa Type:</span>
            <span>{output.visaType as string}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Base Odds:</span>
            <span className="odds-badge odds-badge--medium">
              <TrendingUp className="w-3 h-3" />
              {output.baseLikelihood as number}%
            </span>
          </div>
          <p className="text-[#a3a3a3] text-xs mt-2">{output.reasoning as string}</p>
        </div>
      );

    case "recommendVisaRoute":
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Category:</span>
            <span className="capitalize">{output.visaCategory as string}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Consulate:</span>
            <span>{output.consulate as string}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Processing:</span>
            <span>{output.processingTime as string}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Visa Fee:</span>
            <span>€{output.visaFee as number}</span>
          </div>
          <div className="mt-2">
            <div className="text-xs text-[#737373] mb-1">Key Requirements:</div>
            <div className="flex flex-wrap gap-1">
              {(output.requirements as string[])?.slice(0, 3).map((req, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-[#1f1f1f] rounded">
                  {req}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[#737373]">Odds Boost:</span>
            <span className="odds-badge odds-badge--high">
              +{output.oddsBoost as number}%
            </span>
          </div>
        </div>
      );

    case "buildChecklist":
      return (
        <div className="space-y-2 text-sm">
          <div className="text-xs text-[#737373] mb-2">
            {(output.requiredDocuments as Array<{ critical: boolean }>)?.filter((d) => d.critical).length}{" "}
            critical documents required
          </div>
          <div className="space-y-1">
            {(output.requiredDocuments as Array<{ type: string; description: string; critical: boolean }>)
              ?.slice(0, 5)
              .map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      doc.critical ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  <span className={doc.critical ? "text-[#f5f5f5]" : "text-[#a3a3a3]"}>
                    {doc.description}
                  </span>
                </div>
              ))}
          </div>
          <div className="text-xs text-[#737373] mt-2">
            Est. completion: {output.estimatedCompletionDays as number} days
          </div>
        </div>
      );

    case "reviewDocuments":
      const issues = (output.issues as Array<{ severity: string; message: string; impact: number }>) || [];
      const recommendations = (output.recommendations as Array<{ issue: string; impact: number; category: string }>) || [];
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Status:</span>
            <span
              className={
                output.verificationStatus === "verified"
                  ? "text-green-500"
                  : output.verificationStatus === "needs_review"
                  ? "text-amber-500"
                  : "text-red-500"
              }
            >
              {(output.verificationStatus as string)?.replace("_", " ")}
            </span>
          </div>

          {issues.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-[#737373] mb-1">Issues Found:</div>
              {issues.slice(0, 3).map((issue, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">{issue.message}</span>
                  <span className="text-red-400/70">({issue.impact}%)</span>
                </div>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-green-500 mb-1">Recommendations:</div>
              {recommendations.slice(0, 2).map((rec, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span className="odds-badge odds-badge--high">+{rec.impact}%</span>
                  <span className="text-[#a3a3a3]">{rec.issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case "runRiskReview":
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#737373]">Risk Score:</span>
            <span
              className={
                (output.riskScore as number) < 30
                  ? "text-green-500"
                  : (output.riskScore as number) < 60
                  ? "text-amber-500"
                  : "text-red-500"
              }
            >
              {(output.riskScore as number) || 0}/100
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Final Odds:</span>
            <span className="odds-badge odds-badge--high">
              {output.approvalLikelihood as number}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Ready:</span>
            <span className={output.readyToSubmit ? "text-green-500" : "text-amber-500"}>
              {output.readyToSubmit ? "Yes" : "Needs work"}
            </span>
          </div>
        </div>
      );

    case "bookAppointment":
      return (
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-[#1f1f1f] rounded">
            <div className="font-medium">
              {(output.appointmentType as string)?.replace("_", " ")} Appointment
            </div>
            <div className="text-[#a3a3a3]">
              {output.date as string} at {output.time as string}
            </div>
            <div className="text-xs text-[#737373]">{output.location as string}</div>
          </div>
          <div className="text-xs text-[#737373]">
            Confirmation: {output.confirmationCode as string}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Odds Boost:</span>
            <span className="odds-badge odds-badge--high">+{output.oddsBoost as number}%</span>
          </div>
        </div>
      );

    case "trackEmbassyUpdates":
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Status:</span>
            <span className="capitalize">{(output.status as string)?.replace("_", " ")}</span>
          </div>
          <p className="text-[#a3a3a3] text-xs">{(output as { message?: string }).message}</p>
          {(output as { actionRequired?: boolean }).actionRequired && (
            <div className="flex items-center gap-2 text-amber-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">Action Required</span>
            </div>
          )}
          {(output as { deadline?: string }).deadline && (
            <div className="text-xs text-[#737373]">
              Deadline: {(output as { deadline?: string }).deadline}
            </div>
          )}
        </div>
      );

    case "trackDecision":
      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">Decision:</span>
            <span
              className={`font-medium capitalize ${
                output.decision === "approved"
                  ? "text-green-500"
                  : output.decision === "refused"
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
            >
              {output.decision as string}
            </span>
          </div>
          {(output as { validityPeriod?: string }).validityPeriod && (
            <div className="flex items-center gap-2">
              <span className="text-[#737373]">Validity:</span>
              <span>{(output as { validityPeriod?: string }).validityPeriod}</span>
            </div>
          )}
          {(output as { entries?: string }).entries && (
            <div className="flex items-center gap-2">
              <span className="text-[#737373]">Entries:</span>
              <span className="capitalize">{(output as { entries?: string }).entries}</span>
            </div>
          )}
          <p className="text-[#a3a3a3] text-xs mt-2">{(output as { nextSteps?: string }).nextSteps}</p>
        </div>
      );

    default:
      return (
        <div className="text-sm text-[#a3a3a3]">
          {(output as { approvalLikelihood?: number }).approvalLikelihood && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#737373]">Approval Odds:</span>
              <span className="odds-badge odds-badge--high">
                {(output as { approvalLikelihood?: number }).approvalLikelihood}%
              </span>
            </div>
          )}
          <div className="text-xs">Task completed successfully</div>
        </div>
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
    case "uploadDocuments":
      return (
        <div className="space-y-3">
          <div className="text-xs text-[#a3a3a3]">
            Please upload the following documents:
          </div>
          <div className="space-y-1">
            {(input?.requiredTypes as string[])?.slice(0, 5).map((type, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1">
                <Upload className="w-3 h-3 text-blue-500" />
                <span className="capitalize">{type.replace("_", " ")}</span>
                {(input?.criticalDocuments as string[])?.includes(type) && (
                  <span className="text-xs text-red-400">(Critical)</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Documents (Mock)
              </>
            )}
          </button>
        </div>
      );

    case "payFees":
      return (
        <div className="space-y-3">
          <div className="p-3 bg-[#1f1f1f] rounded text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[#a3a3a3]">Visa Fee</span>
              <span>€{(input as { visaFee?: number })?.visaFee || 80}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a3a3a3]">Service Fee</span>
              <span>€{(input as { serviceFee?: number })?.serviceFee || 25}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a3a3a3]">VAC Fee</span>
              <span>€{(input as { vacFee?: number })?.vacFee || 15}</span>
            </div>
            <div className="border-t border-[#262626] pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span>€{(input as { total?: number })?.total || 120}</span>
            </div>
          </div>
          <button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay Fees (Mock)
              </>
            )}
          </button>
        </div>
      );

    case "submitFiling":
      return (
        <div className="space-y-3">
          <div className="text-xs text-[#a3a3a3]">
            Review your application before submission:
          </div>
          <div className="p-3 bg-[#1f1f1f] rounded text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[#a3a3a3]">Approval Likelihood</span>
              <span className="odds-badge odds-badge--high">
                {typeof input?.approvalLikelihood === "number" ? input.approvalLikelihood : 85}%
              </span>
            </div>
            <div className="text-xs text-[#737373]">
              {(input?.finalRecommendations as Array<{ issue: string }>)?.length || 0} pending recommendations
            </div>
          </div>
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
            <strong>Important:</strong> This is a mock submission for demonstration purposes. No actual visa application will be filed.
          </div>
          <button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Confirm & Submit (Mock)
              </>
            )}
          </button>
        </div>
      );

    case "provideMissingInsurance":
      return (
        <div className="space-y-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
            <div className="text-xs text-red-400 font-medium mb-1">
              Request for Evidence (RFE)
            </div>
            <div className="text-sm">{(input?.rfeDetails as { missingItem: string })?.missingItem}</div>
            <div className="text-xs text-[#a3a3a3] mt-1">
              {(input?.rfeDetails as { explanation: string })?.explanation}
            </div>
          </div>
          <div className="text-xs text-[#737373]">
            Deadline: {input?.deadline as string}
          </div>
          <button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Upload Insurance Document (Mock)
              </>
            )}
          </button>
        </div>
      );

    default:
      return (
        <div className="text-sm text-[#a3a3a3]">
          <button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg text-sm font-medium transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              "Confirm Action (Mock)"
            )}
          </button>
        </div>
      );
  }
}
