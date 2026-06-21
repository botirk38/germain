"use client";

import { useRef, useState, type DragEvent } from "react";
import { Card, CardHead } from "@/components/attache/Card";
import { StatusMark } from "@/components/attache/StatusMark";
import { KeyButton } from "@/components/attache/KeyButton";

// Document metadata uploader for Eve document-request flows. The user attaches
// files locally; the UI matches filenames to requested slots and sends filename
// metadata back to the agent so it can persist document state.

const TYPE_LABEL = (t: string) => t.replace(/_/g, " ").toUpperCase();

// lightweight filename → document-type matcher
const SYNONYMS: Record<string, string[]> = {
  passport: ["passport", "pass"],
  photo: ["photo", "picture", "pic", "headshot"],
  bank_statement: ["bank", "statement", "balance", "finances", "financial"],
  insurance: ["insurance", "policy", "medical", "coverage"],
  hotel_booking: ["hotel", "accommodation", "booking", "airbnb", "stay", "reservation"],
  flight_itinerary: ["flight", "itinerary", "ticket", "airline", "travel"],
  employment_letter: ["employment", "employer", "job", "work", "letter", "hr", "payslip", "salary", "pay"],
  invitation_letter: ["invitation", "invite", "host", "sponsor"],
  property_deed: ["property", "deed", "mortgage", "rental", "lease", "house"],
  marriage_certificate: ["marriage", "spouse", "wedding"],
  birth_certificate: ["birth", "child", "children"],
};

function tokensOf(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function keysFor(type: string): string[] {
  return SYNONYMS[type] ?? tokensOf(type);
}

// Strength of a filename↔type match: exact token hits weigh more than partials.
function scorePair(filename: string, type: string): number {
  const toks = tokensOf(filename);
  return keysFor(type).reduce((score, k) => {
    if (toks.includes(k)) return score + 2;
    return toks.some((t) => t.includes(k) || k.includes(t)) ? score + 1 : score;
  }, 0);
}

export function FileUpload({
  requiredTypes,
  criticalDocuments,
  onUpload,
  isSubmitting,
}: {
  requiredTypes: string[];
  criticalDocuments: string[];
  onUpload: (documents: { id: string; type: string; name: string; status: "uploaded" }[]) => void;
  isSubmitting: boolean;
}) {
  const [attached, setAttached] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const browseRef = useRef<HTMLInputElement>(null);

  const assignByName = (files: FileList | File[]) => {
    const next = { ...attached };
    const taken = new Set(Object.keys(next));
    const fileArr = Array.from(files);

    // Global best-match: rank every (file, type) pair by score and assign the
    // strongest first, so passport.png and photo.png each win their own slot
    // instead of colliding over a "passport photo" type in drop order.
    const pairs: { fi: number; type: string; sc: number }[] = [];
    fileArr.forEach((f, fi) => {
      requiredTypes.forEach((type) => {
        const sc = scorePair(f.name, type);
        if (sc > 0) pairs.push({ fi, type, sc });
      });
    });
    pairs.sort((a, b) => b.sc - a.sc);

    const usedFiles = new Set<number>();
    for (const p of pairs) {
      if (usedFiles.has(p.fi) || taken.has(p.type)) continue;
      next[p.type] = fileArr[p.fi].name;
      usedFiles.add(p.fi);
      taken.add(p.type);
    }

    // Leftover files drop into any still-open slot, in order.
    const misses: string[] = [];
    fileArr.forEach((f, fi) => {
      if (usedFiles.has(fi)) return;
      const open = requiredTypes.find((t) => !taken.has(t));
      if (open) {
        next[open] = f.name;
        taken.add(open);
        usedFiles.add(fi);
      } else {
        misses.push(f.name);
      }
    });

    setAttached(next);
    if (misses.length) setUnmatched((u) => [...u, ...misses]);
  };

  const assignToSlot = (type: string, file: File | undefined) => {
    if (!file) return;
    setAttached((a) => ({ ...a, [type]: file.name }));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) assignByName(e.dataTransfer.files);
  };

  const attachedCount = Object.keys(attached).length;
  const missingCritical = criticalDocuments.filter((t) => !attached[t]);
  const canSubmit = attachedCount > 0 && !isSubmitting;

  const submit = () => {
    const docs = requiredTypes
      .filter((t) => attached[t])
      .map((type) => ({
        id: `doc-${requiredTypes.indexOf(type)}`,
        type,
        name: attached[type],
        status: "uploaded" as const,
      }));
    onUpload(docs);
  };

  return (
    <Card className="notam">
      <CardHead right={`${attachedCount}/${requiredTypes.length}`}>UPLOAD DOCUMENTS</CardHead>

      {/* Drop zone */}
      <div
        className={`dropzone${dragging ? " over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => browseRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div className="dz-title">▤ DRAG FILES HERE</div>
        <div className="dz-sub">
          We match <code>passport.png</code>, <code>bank.pdf</code>, … by name — or browse
        </div>
        <input
          ref={browseRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.length) assignByName(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Per-slot rows */}
      <div className="cl" style={{ marginTop: 10 }}>
        {requiredTypes.map((type, i) => {
          const file = attached[type];
          const critical = criticalDocuments.includes(type);
          return (
            <div className="cl-row" key={`${type}-${i}`}>
              <span style={critical && !file ? { color: "var(--clay)" } : undefined}>
                {critical && !file ? "▲ " : ""}
                {TYPE_LABEL(type)}
              </span>
              <span className="dots" />
              <span className="state">
                {file ? (
                  <span className="upl-file">
                    <StatusMark word="received" />
                    <span className="upl-name" title={file}>
                      {file}
                    </span>
                    <button
                      type="button"
                      className="upl-x"
                      aria-label="Remove"
                      onClick={() =>
                        setAttached((a) => {
                          const n = { ...a };
                          delete n[type];
                          return n;
                        })
                      }
                    >
                      ✕
                    </button>
                  </span>
                ) : (
                  <label className="upl-attach">
                    ＋ ATTACH
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        assignToSlot(type, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {unmatched.length > 0 ? (
        <div className="dz-warn">
          Couldn&rsquo;t match: {unmatched.join(", ")} — attach them to a slot above.
        </div>
      ) : null}

      <div style={{ paddingTop: 12 }}>
        <KeyButton onClick={submit} disabled={!canSubmit} submittingLabel="TRANSMITTING…">
          {attachedCount === requiredTypes.length ? "SUBMIT ALL DOCUMENTS" : "SUBMIT DOCUMENTS"}
        </KeyButton>
        {missingCritical.length > 0 ? (
          <span className="dz-hint">
            {missingCritical.length} critical document{missingCritical.length > 1 ? "s" : ""} still
            missing
          </span>
        ) : null}
      </div>
    </Card>
  );
}
