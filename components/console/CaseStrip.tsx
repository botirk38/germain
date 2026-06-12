"use client";

import { useEffect, useState } from "react";
import type { GermainCase } from "@/lib/germain-types";

// ATC flight strip: applicant + case id + route + travel window.
// Renders graceful placeholders pre-intake.
export function CaseStrip({ caseState }: { caseState: GermainCase }) {
  // The case id is minted with Date.now() at module load, so the server and
  // client disagree — only show it after mount to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const shortId =
    mounted && caseState.id
      ? caseState.id.replace(/^case-/, "").slice(-6).toUpperCase()
      : "——————";
  const name = caseState.applicant.fullName?.toUpperCase() ?? "—";

  const visaRow =
    caseState.visaType || caseState.destinationCountry
      ? [caseState.visaType, caseState.destinationCountry]
          .filter(Boolean)
          .join(" · ")
          .toUpperCase()
      : "AWAITING INTAKE";

  const datesRow =
    caseState.travel.arrivalDate || caseState.travel.departureDate
      ? `${caseState.travel.arrivalDate ?? "—"} → ${caseState.travel.departureDate ?? "—"}`
      : "TRAVEL DATES —";

  return (
    <div className="strip">
      <div className="strip-call">CASE {shortId}</div>
      <div className="strip-route">{name}</div>
      <div className="strip-row">{visaRow}</div>
      <div className="strip-row">{datesRow}</div>
    </div>
  );
}
