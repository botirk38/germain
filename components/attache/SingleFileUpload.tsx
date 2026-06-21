"use client";

import { useRef, useState, type DragEvent } from "react";
import { Card, CardHead } from "@/components/attache/Card";
import { StatusMark } from "@/components/attache/StatusMark";
import { KeyButton } from "@/components/attache/KeyButton";

const TYPE_LABEL = (t: string) => t.replace(/_/g, " ").toUpperCase();

interface SingleFileUploadProps {
  documentType: string;
  reason: string;
  guidance: string;
  critical: boolean;
  isSubmitting: boolean;
  onUpload: (document: { id: string; type: string; name: string; status: "uploaded" }) => void;
}

export function SingleFileUpload({
  documentType,
  reason,
  guidance,
  critical,
  isSubmitting,
  onUpload,
}: SingleFileUploadProps) {
  const [file, setFile] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const browseRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f.name);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const submit = () => {
    if (!file) return;
    onUpload({
      id: `doc-${documentType}-${Date.now()}`,
      type: documentType,
      name: file,
      status: "uploaded",
    });
  };

  return (
    <Card className={critical ? "notam" : undefined}>
      <CardHead
        right={critical ? (
          <span
            className="font-mono"
            style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--clay)" }}
          >
            CRITICAL
          </span>
        ) : undefined}
      >
        {critical ? "\u25B2 " : ""}{TYPE_LABEL(documentType)}
      </CardHead>

      <div style={{ padding: "10px 14px" }}>
        {/* Reason — why this document is needed */}
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            lineHeight: 1.55,
            color: critical ? "var(--amber)" : "var(--ink)",
            marginBottom: 8,
          }}
        >
          {reason}
        </div>

        {/* Guidance — what makes a good upload */}
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.5,
            color: "var(--ink2)",
            marginBottom: 12,
            paddingLeft: 8,
            borderLeft: "2px solid var(--line)",
          }}
        >
          {guidance}
        </div>

        {/* Drop zone */}
        {!file ? (
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
            <div className="dz-title">{"\u25A4"} DROP FILE OR BROWSE</div>
            <div className="dz-sub">PDF, image, or scan accepted</div>
            <input
              ref={browseRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="cl-row" style={{ marginBottom: 4 }}>
            <span>
              <StatusMark word="received" />
            </span>
            <span className="dots" />
            <span className="state">
              <span className="upl-file">
                <span className="upl-name" title={file}>{file}</span>
                <button
                  type="button"
                  className="upl-x"
                  aria-label="Remove"
                  onClick={() => setFile(null)}
                >
                  {"\u2715"}
                </button>
              </span>
            </span>
          </div>
        )}

        {/* Submit */}
        <div style={{ paddingTop: 10 }}>
          <KeyButton
            onClick={submit}
            disabled={!file || isSubmitting}
            submittingLabel={isSubmitting ? "UPLOADING\u2026" : undefined}
          >
            UPLOAD DOCUMENT
          </KeyButton>
        </div>
      </div>
    </Card>
  );
}
