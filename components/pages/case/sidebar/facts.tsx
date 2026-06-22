import { ClRow } from "@/components/attache/Card";
import type { VisaCaseView } from "@/lib/db/queries";

function isRecommendation(value: unknown): value is { readonly id: string; readonly issue: string; readonly fix: string; readonly resolved?: boolean } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" && typeof candidate.issue === "string" && typeof candidate.fix === "string";
}

function ApprovalLikelihoodRing({ likelihood }: { readonly likelihood: number }) {
  const pct = Math.max(0, Math.min(100, likelihood));
  const angle = pct * 3.6;

  return (
    <div
      className="relative grid size-[92px] place-items-center rounded-full font-mono"
      style={{
        background: `conic-gradient(var(--sage) ${angle}deg, var(--line) ${angle}deg)`,
      }}
    >
      <div className="absolute inset-[8px] rounded-full bg-panel" />
      <div className="relative text-2xl font-semibold text-ink">{pct}</div>
    </div>
  );
}

// Case file panel: approval ring + key facts as dotted-leader rows, then
// unresolved recommendations (amber) and risk flags (clay). Empty sections
// are omitted.
export function CaseFacts({ caseView }: { readonly caseView: VisaCaseView }) {
  const { visaCase, latestAssessment, caseSubmission } = caseView;
  const approvalLikelihood = latestAssessment?.approvalLikelihood ?? 35;
  const recommendations = (latestAssessment?.recommendations ?? [])
    .filter(isRecommendation)
    .filter((r) => !r.resolved)
    .slice(0, 3);

  return (
    <div className="panel">
      <div className="panel-head">
        <span>CASE FILE</span>
        <span>ODDS</span>
      </div>
      <div className="panel-body">
        <div className="flex flex-col items-center gap-1 py-2">
          <ApprovalLikelihoodRing likelihood={approvalLikelihood} />
          <div className="font-mono text-[8.5px] tracking-[0.22em] text-ink2">
            APPROVAL
          </div>
        </div>

        {visaCase.referenceNumber ?? caseSubmission?.referenceNumber ? (
          <ClRow label="REF" state={visaCase.referenceNumber ?? caseSubmission?.referenceNumber ?? ""} />
        ) : null}

        {caseSubmission?.submissionStatus ? (
          <ClRow label="SUBMISSION" state={caseSubmission.submissionStatus.replace(/_/g, " ").toUpperCase()} />
        ) : null}

        {caseView.coreDocuments.length > 0 ? (
          <ClRow label="CORE DOCS" state={`${caseView.coreDocuments.length}`} />
        ) : null}

        {recommendations.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="font-mono text-[10px] leading-relaxed"
                style={{ color: "var(--amber)" }}
              >
                ▲ {rec.issue} — {rec.fix}
              </div>
            ))}
          </div>
        ) : null}

        {(latestAssessment?.riskFlags.length ?? 0) > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5">
            {latestAssessment?.riskFlags.map((flag, i) => (
              <div
                key={i}
                className="font-mono text-[10px] leading-relaxed"
                style={{ color: "var(--clay)" }}
              >
                ✕ {flag}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
