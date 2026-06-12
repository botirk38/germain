"use client";

import type { GermainCase, Recommendation } from "@/lib/germain-types";
import { ApprovalLikelihoodRing } from "./ApprovalLikelihoodRing";
import { CheckCircle2, AlertCircle, Clock, FileCheck, AlertTriangle } from "lucide-react";

interface CaseFilePanelProps {
  caseState: GermainCase;
}

export function CaseFilePanel({ caseState }: CaseFilePanelProps) {
  const activeRecommendations = caseState.recommendations.filter((r) => !r.resolved);
  const resolvedRecommendations = caseState.recommendations.filter((r) => r.resolved);

  return (
    <div className="space-y-4">
      {/* Approval Likelihood - Hero Metric */}
      <div className="panel-section">
        <div className="panel-section-title">Approval Likelihood</div>
        <div className="flex items-center gap-4">
          <ApprovalLikelihoodRing percentage={caseState.approvalLikelihood} />
          <div className="flex-1">
            <div className="text-2xl font-bold">
              {caseState.approvalLikelihood}%
            </div>
            <div className="text-xs text-[#737373]">
              {caseState.approvalLikelihood >= 80
                ? "Strong case - likely approval"
                : caseState.approvalLikelihood >= 60
                ? "Good case - minor improvements possible"
                : caseState.approvalLikelihood >= 40
                ? "Moderate risk - address recommendations"
                : "High risk - significant improvements needed"}
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="panel-section">
        <div className="panel-section-title">Current Status</div>
        <div className="flex items-center gap-2 p-3 bg-[#1f1f1f] rounded-lg">
          <div
            className={`w-2 h-2 rounded-full ${
              caseState.status === "decision_ready"
                ? "bg-green-500"
                : caseState.status === "submitted"
                ? "bg-blue-500"
                : "bg-amber-500"
            }`}
          />
          <span className="text-sm font-medium capitalize">
            {caseState.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Active Recommendations */}
      {activeRecommendations.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Action Items ({activeRecommendations.length})
          </div>
          <div className="space-y-2">
            {activeRecommendations.slice(0, 5).map((rec) => (
              <RecommendationItem key={rec.id} recommendation={rec} />
            ))}
            {activeRecommendations.length > 5 && (
              <div className="text-xs text-[#737373] text-center py-2">
                +{activeRecommendations.length - 5} more items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents Summary */}
      {caseState.documents.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-500" />
            Documents
          </div>
          <div className="space-y-1">
            {caseState.documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-1 text-sm"
              >
                <span className="truncate">{doc.name}</span>
                <StatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financials */}
      {(caseState.financials.bankBalance || caseState.financials.coverageRatio) && (
        <div className="panel-section">
          <div className="panel-section-title">Financial Overview</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {caseState.financials.bankBalance && (
              <div className="p-2 bg-[#1f1f1f] rounded">
                <div className="text-xs text-[#737373]">Bank Balance</div>
                <div className="font-medium">
                  ${caseState.financials.bankBalance.toLocaleString()}
                </div>
              </div>
            )}
            {caseState.financials.coverageRatio && (
              <div className="p-2 bg-[#1f1f1f] rounded">
                <div className="text-xs text-[#737373]">Trip Coverage</div>
                <div
                  className={`font-medium ${
                    caseState.financials.coverageRatio >= 2
                      ? "text-green-500"
                      : caseState.financials.coverageRatio >= 1.5
                      ? "text-amber-500"
                      : "text-red-500"
                  }`}
                >
                  {caseState.financials.coverageRatio.toFixed(1)}x
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointment */}
      {caseState.appointments.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            Appointments
          </div>
          <div className="space-y-2">
            {caseState.appointments.map((apt, i) => (
              <div key={i} className="p-2 bg-[#1f1f1f] rounded text-sm">
                <div className="font-medium capitalize">{apt.type}</div>
                <div className="text-xs text-[#a3a3a3]">
                  {apt.date} at {apt.time}
                </div>
                <div className="text-xs text-[#737373]">{apt.location}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference Number */}
      {caseState.referenceNumber && (
        <div className="panel-section">
          <div className="panel-section-title">Reference Number</div>
          <div className="p-3 bg-[#1f1f1f] rounded-lg font-mono text-sm text-green-500">
            {caseState.referenceNumber}
          </div>
        </div>
      )}

      {/* Resolved Recommendations (if any) */}
      {resolvedRecommendations.length > 0 && (
        <div className="panel-section opacity-50">
          <div className="panel-section-title flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Resolved ({resolvedRecommendations.length})
          </div>
          <div className="text-xs text-[#737373]">
            {resolvedRecommendations.reduce((sum, r) => sum + r.impact, 0)}% odds gained
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {caseState.riskFlags.length > 0 && (
        <div className="panel-section border-red-900/50">
          <div className="panel-section-title flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            Risk Flags
          </div>
          <div className="space-y-1">
            {caseState.riskFlags.map((flag, i) => (
              <div key={i} className="text-sm text-red-400">
                • {flag}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div
      className={`recommendation-item ${
        recommendation.resolved ? "recommendation-item--resolved" : ""
      }`}
    >
      <div className="recommendation-impact">+{recommendation.impact}%</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{recommendation.issue}</div>
        <div className="text-xs text-[#a3a3a3]">{recommendation.fix}</div>
        <div className="text-xs text-[#737373] capitalize mt-1">
          Category: {recommendation.category}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    missing: "bg-red-500/20 text-red-400",
    uploaded: "bg-amber-500/20 text-amber-400",
    needs_review: "bg-amber-500/20 text-amber-400",
    verified: "bg-green-500/20 text-green-400",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[status] || styles.missing}`}>
      {status.replace("_", " ")}
    </span>
  );
}
