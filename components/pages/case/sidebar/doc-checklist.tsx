import { StatusMark } from "@/components/attache/StatusMark";
import { docStatusWord } from "@/components/attache/display";
import type { VisaCaseView } from "@/lib/db/queries";

const DOC_LAMP_STATE: Record<VisaCaseView["documents"][number]["status"], string> = {
  uploaded: "received",
  processing: "pending",
  needs_review: "caution",
  verified: "go",
  rejected: "fail",
};

const REQUIREMENT_LAMP_STATE: Record<VisaCaseView["documentRequirements"][number]["status"], string> = {
  requested: "pending",
  satisfied: "go",
  waived: "received",
  rejected: "fail",
};

// Document checklist with status lamps. Status is always mark + word.
export function DocChecklist({ caseView }: { readonly caseView: VisaCaseView }) {
  const items = [
    ...caseView.documentRequirements.map((requirement) => ({
      id: requirement.id,
      label: requirement.label,
      status: requirement.status,
      lamp: REQUIREMENT_LAMP_STATE[requirement.status],
    })),
    ...caseView.coreDocuments.map((document) => ({
      id: document.id,
      label: document.originalFilename,
      status: document.status,
      lamp: DOC_LAMP_STATE[document.status],
    })),
    ...caseView.documents.map((document) => ({
      id: document.id,
      label: document.originalFilename,
      status: document.status,
      lamp: DOC_LAMP_STATE[document.status],
    })),
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <span>DOCUMENTS</span>
        <span>{items.length} DOCS</span>
      </div>
      <div className="panel-body">
        {items.length === 0 ? (
          <div className="font-mono text-[9px] tracking-[0.16em] text-ink2 opacity-60">
            NO DOCUMENTS YET
          </div>
        ) : (
          <div className="docs">
            {items.map((doc) => (
              <div key={doc.id} className="doc" data-state={doc.lamp}>
                <span className="truncate pr-2">{doc.label.toUpperCase()}</span>
                <span className="light">
                  <span className="lamp" />
                  <StatusMark
                    word={docStatusWord(doc.status)}
                    className="text-[8.5px] tracking-[0.1em] whitespace-nowrap"
                  />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
