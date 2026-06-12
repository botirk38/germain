import type { ReactNode } from "react";

// Sage-tinted confirmation box (.slotbox) with optional calendar chip.
export function SlotBox({
  title,
  children,
  calChip,
}: {
  title: string;
  children: ReactNode;
  calChip?: string;
}) {
  return (
    <div className="slotbox">
      <div className="sl-head">
        {title.startsWith("●") ? title : `● ${title}`}
      </div>
      <div className="sl-body">{children}</div>
      {calChip ? (
        <div className="gcal-chip">
          <span className="gcal-ic" />
          {calChip}
        </div>
      ) : null}
    </div>
  );
}
