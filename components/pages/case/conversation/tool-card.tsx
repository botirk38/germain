"use client";

import type { ReactNode } from "react";
import type { EveDynamicToolPart, InputResponse } from "eve/client";
import { Card, CardHead, CardFoot, ClRow } from "@/components/attache/Card";
import { FileUpload } from "@/components/attache/FileUpload";
import { KeyButton } from "@/components/attache/KeyButton";
import { MachinePanel } from "@/components/attache/MachinePanel";
import { StatusMark } from "@/components/attache/StatusMark";
import { Button } from "@/components/ui/button";

type UploadedDocument = {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly status: "uploaded";
};

type DynamicToolPartProps = {
  readonly part: EveDynamicToolPart;
  readonly onDocuments: (documents: readonly UploadedDocument[]) => void;
  readonly onInputResponse: (response: InputResponse) => void;
};

type JsonRecord = Record<string, unknown>;

const toolHeaders: Record<string, string> = {
  load_case: "CASE LOADED",
  prepare_submission: "PREPARE SUBMISSION",
  record_documents: "DOCUMENTS RECEIVED",
  request_documents: "UPLOAD REQUIRED",
  submit_application: "SUBMIT APPLICATION",
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordField(value: JsonRecord, key: string): JsonRecord | undefined {
  const field = value[key];
  return isRecord(field) ? field : undefined;
}

function stringField(value: JsonRecord, key: string, fallback = ""): string {
  const field = value[key];
  return typeof field === "string" ? field : fallback;
}

function numberField(value: JsonRecord, key: string, fallback = 0): number {
  const field = value[key];
  return typeof field === "number" ? field : fallback;
}

function booleanField(value: JsonRecord, key: string): boolean {
  return value[key] === true;
}

function stringArrayField(value: JsonRecord, key: string): string[] {
  const field = value[key];
  return Array.isArray(field) ? field.filter((item): item is string => typeof item === "string") : [];
}

function objectArrayField(value: JsonRecord, key: string): JsonRecord[] {
  const field = value[key];
  return Array.isArray(field) ? field.filter(isRecord) : [];
}

function headerFor(toolName: string): string {
  return toolHeaders[toolName] ?? toolName.replace(/_/g, " ").toUpperCase();
}

function outputRecord(output: unknown): JsonRecord {
  return isRecord(output) ? output : { value: output };
}

function WorkingCard({ header, dashed }: { readonly header: string; readonly dashed?: boolean }) {
  return (
    <article className="card" style={dashed ? { borderStyle: "dashed" } : undefined}>
      <div className="typing" style={{ padding: "4px 14px" }}>
        <span className="t">
          {header} - WORKING<span className="cursor">▌</span>
        </span>
      </div>
    </article>
  );
}

function SageLine({ children }: { readonly children: ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        color: "var(--sage)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        padding: "8px 0 4px",
      }}
    >
      {children}
    </div>
  );
}

function ToolSkippedCard({ header, errorText }: { readonly header: string; readonly errorText?: string }) {
  return (
    <article className="card">
      <CardHead>{header}</CardHead>
      <div className="notam-body">
        <StatusMark word="check" />
        <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink2)" }}>
          {errorText ?? "The user did not approve this action. Attache will continue without executing it."}
        </div>
      </div>
    </article>
  );
}

function ApprovalCard({
  part,
  onInputResponse,
}: {
  readonly part: EveDynamicToolPart & { readonly state: "approval-requested" };
  readonly onInputResponse: (response: InputResponse) => void;
}) {
  const request = part.toolMetadata?.eve?.inputRequest;
  const approveOption = request?.options?.find((option) => option.id === "approve") ?? request?.options?.[0];
  const denyOption = request?.options?.find((option) => option.id === "deny") ?? request?.options?.[1];

  if (!request) {
    return <WorkingCard header={headerFor(part.toolName)} />;
  }

  return (
    <Card className="notam">
      <CardHead>{headerFor(part.toolName)}</CardHead>
      <div className="cl">
        <div className="poll-detail" style={{ color: "var(--amber)", marginBottom: 8 }}>
          {request.prompt}
        </div>
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          {approveOption ? (
            <KeyButton
              onClick={() => onInputResponse({ requestId: request.requestId, optionId: approveOption.id })}
            >
              {approveOption.label.toUpperCase()}
            </KeyButton>
          ) : null}
          {denyOption ? (
            <Button
              type="button"
              variant="outline"
              className="btn"
              style={{ background: "transparent", border: "1px solid var(--clay)", color: "var(--clay)" }}
              onClick={() => onInputResponse({ requestId: request.requestId, optionId: denyOption.id })}
            >
              {denyOption.label.toUpperCase()}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function RequestDocumentsOutput({
  output,
  onDocuments,
}: {
  readonly output: JsonRecord;
  readonly onDocuments: (documents: readonly UploadedDocument[]) => void;
}) {
  const requestedTypes = stringArrayField(output, "requested_types");
  const caseView = recordField(output, "case_view");
  const requirements = objectArrayField(caseView ?? {}, "documentRequirements");
  const pendingTypes = requestedTypes.length > 0
    ? requestedTypes
    : requirements
        .filter((document) => stringField(document, "status") === "requested")
        .map((document) => stringField(document, "documentType"))
        .filter(Boolean);

  if (pendingTypes.length === 0) {
    return (
      <Card>
        <CardHead>UPLOAD REQUIRED</CardHead>
        <div className="notam-body">No new document slots were added.</div>
      </Card>
    );
  }

  return (
    <FileUpload
      requiredTypes={pendingTypes}
      criticalDocuments={pendingTypes.slice(0, 3)}
      isSubmitting={false}
      onUpload={onDocuments}
    />
  );
}

function ServerToolOutput({
  toolName,
  output,
  onDocuments,
}: {
  readonly toolName: string;
  readonly output: JsonRecord;
  readonly onDocuments: (documents: readonly UploadedDocument[]) => void;
}) {
  switch (toolName) {
    case "request_documents":
      return <RequestDocumentsOutput output={output} onDocuments={onDocuments} />;

    case "record_documents": {
      const recorded = stringArrayField(output, "recorded");
      return (
        <Card>
          <CardHead>DOCUMENTS RECEIVED</CardHead>
          <div className="cl">
            <SageLine>○ {recorded.length} DOCUMENTS RECORDED</SageLine>
          </div>
        </Card>
      );
    }

    case "prepare_submission":
      return (
        <Card className="notam">
          <CardHead>PREPARE SUBMISSION</CardHead>
          <div className="cl">
            <ClRow label="Live review" state={stringField(output, "live_view_url", "Unavailable")} />
            <ClRow label="Fields filled" state={`${numberField(output, "form_fields_filled", 0)}`} />
            <ClRow label="Status" state={stringField(output, "status", "pending").toUpperCase()} />
            {stringArrayField(output, "errors").map((error, index) => (
              <div key={index} className="poll-detail bad">{error}</div>
            ))}
          </div>
          {stringField(output, "live_view_url") ? <CardFoot>REVIEW BEFORE APPROVING SUBMISSION</CardFoot> : null}
        </Card>
      );

    case "submit_application":
      return (
        <Card>
          <MachinePanel
            lines={[`REF: ${stringField(output, "reference_number", "pending")}`, `STATUS: ${booleanField(output, "submitted") ? "SUBMITTED" : "PENDING"}`]}
            final="APPLICATION SUBMITTED"
            showRunway
          />
        </Card>
      );

    case "load_case":
      return (
        <Card>
          <CardHead>{headerFor(toolName)}</CardHead>
          <div className="cl">
            <ClRow label="Visa case" state={<StatusMark word="verified" />} />
          </div>
        </Card>
      );

    default:
      return (
        <Card>
          <CardHead>{headerFor(toolName)}</CardHead>
          <div className="cl">
            <ClRow label="Result" state={<StatusMark word="received" />} />
          </div>
        </Card>
      );
  }
}

export function DynamicToolPart({ part, onDocuments, onInputResponse }: DynamicToolPartProps) {
  const header = headerFor(part.toolName);

  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return <WorkingCard header={header} dashed={part.state === "input-streaming"} />;
    case "approval-requested":
      return <ApprovalCard part={part} onInputResponse={onInputResponse} />;
    case "approval-responded":
      return <WorkingCard header={header} />;
    case "output-error":
      return <ToolSkippedCard header={header} errorText={part.errorText} />;
    case "output-denied":
      return <ToolSkippedCard header={header} errorText={part.approval.reason} />;
    case "output-available":
      return <ServerToolOutput toolName={part.toolName} output={outputRecord(part.output)} onDocuments={onDocuments} />;
  }
}
