import type { AttacheCase, AttacheDocument } from "@/lib/attache/case";
import { StatusMark } from "@/components/attache/StatusMark";
import { docStatusWord } from "@/lib/attache/display";

const DOC_LAMP_STATE: Record<AttacheDocument["status"], string> = {
  missing: "pending",
  uploaded: "received",
  needs_review: "caution",
  verified: "go",
  rejected: "fail",
};

// Document checklist with status lamps. Status is always mark + word.
export function DocChecklist({ documents }: { documents: AttacheCase["documents"] }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span>DOCUMENTS</span>
        <span>{documents.length} DOCS</span>
      </div>
      <div className="panel-body">
        {documents.length === 0 ? (
          <div className="font-mono text-[9px] tracking-[0.16em] text-ink2 opacity-60">
            NO DOCUMENTS YET
          </div>
        ) : (
          <div className="docs">
            {documents.map((doc) => (
              <div key={doc.id} className="doc" data-state={DOC_LAMP_STATE[doc.status]}>
                <span className="truncate pr-2">{doc.name.toUpperCase()}</span>
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
