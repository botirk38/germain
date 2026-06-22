"use client";

import type { VisaCaseView } from "@/lib/db/queries";

// ATC flight strip: applicant + case id + route + travel window.
// Renders graceful placeholders pre-intake.
export function CaseStrip({ caseView }: { readonly caseView: VisaCaseView }) {
  const { visaCase, intake } = caseView;
  const shortId = visaCase.id.slice(-6).toUpperCase();
  const name = intake?.applicantFullName?.toUpperCase() ?? "—";

  const visaRow =
    visaCase.visaType || visaCase.destinationCountry
      ? [visaCase.visaType, visaCase.destinationCountry]
          .filter(Boolean)
          .join(" · ")
          .toUpperCase()
      : "AWAITING INTAKE";

  const datesRow =
    intake?.arrivalDate || intake?.departureDate
      ? `${intake.arrivalDate ?? "—"} → ${intake.departureDate ?? "—"}`
      : "TRAVEL DATES —";

  return (
    <div className="strip">
      <div className="strip-call" suppressHydrationWarning>
        CASE {shortId}
      </div>
      <div className="strip-route">{name}</div>
      <div className="strip-row">{visaRow}</div>
      <div className="strip-row">{datesRow}</div>
    </div>
  );
}
