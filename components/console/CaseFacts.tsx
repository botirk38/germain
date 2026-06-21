import type { AttacheCase } from "@/lib/attache/case";
import { ApprovalLikelihoodRing } from "@/components/ApprovalLikelihoodRing";
import { ClRow } from "@/components/attache/Card";

// Case file panel: approval ring + key facts as dotted-leader rows, then
// unresolved recommendations (amber) and risk flags (clay). Empty sections
// are omitted.
export function CaseFacts({ caseState }: { caseState: AttacheCase }) {
  const appointment = caseState.appointments[0];
  const { fees, financials } = caseState;
  const recommendations = caseState.recommendations
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
          <ApprovalLikelihoodRing likelihood={caseState.approvalLikelihood} />
          <div className="font-mono text-[8.5px] tracking-[0.22em] text-ink2">
            APPROVAL
          </div>
        </div>

        {appointment ? (
          <div className="py-1">
            <div className="font-mono text-[9px] tracking-[0.14em] text-ink2">
              NEXT APPOINTMENT
            </div>
            <div className="font-mono text-[10px] leading-relaxed text-ink">
              {appointment.date} · {appointment.time} · {appointment.location}
            </div>
          </div>
        ) : null}

        {fees.total > 0 ? (
          <ClRow
            label="FEES"
            state={`$${fees.total.toLocaleString()} · ${fees.paid ? "PAID" : "UNPAID"}`}
          />
        ) : null}

        {caseState.referenceNumber ? (
          <ClRow label="REF" state={caseState.referenceNumber} />
        ) : null}

        {financials.bankBalance != null ? (
          <ClRow label="BANK" state={`$${financials.bankBalance.toLocaleString()}`} />
        ) : null}

        {financials.coverageRatio != null ? (
          <ClRow label="COVERAGE" state={`${financials.coverageRatio.toFixed(1)}×`} />
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

        {caseState.riskFlags.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5">
            {caseState.riskFlags.map((flag, i) => (
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
