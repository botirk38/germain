import { defineTool } from "eve/tools";
import { defineState } from "eve/context";
import { always } from "eve/tools/approval";
import { BrowserUse } from "browser-use-sdk/v3";
import { z } from "zod";
import { z as browserZ } from "zod/v4";

const browserSubmissionConfirmationSchema = browserZ.object({
  referenceNumber: browserZ.string(),
  submitted: browserZ.boolean(),
});

type CaseState = {
  readonly browserUseSessionId?: string;
  readonly timeline?: readonly { readonly title: string; readonly description: string; readonly time: string; readonly status: "complete" }[];
} & Record<string, unknown>;

function initialCaseState(): CaseState {
  return { id: `case-${Date.now()}`, status: "intake" };
}

const caseState = defineState<CaseState>("attache.case", initialCaseState);

let browserClient: BrowserUse | undefined;

function getBrowserUseClient(): BrowserUse {
  if (!browserClient) {
    const apiKey = process.env.BROWSER_USE_API_KEY;
    if (!apiKey) throw new Error("BROWSER_USE_API_KEY environment variable is not set");
    browserClient = new BrowserUse({ apiKey });
  }
  return browserClient;
}

async function finalizeSubmission(sessionId: string): Promise<{ readonly referenceNumber: string; readonly submitted: boolean }> {
  const client = getBrowserUseClient();
  const result = await client.run(
    "Click the final submit button on the current page to submit the visa application. Return the reference number and whether submission was successful.",
    { schema: browserSubmissionConfirmationSchema, sessionId },
  );
  return result.output;
}

const inputSchema = z.object({});

export default defineTool({
  description:
    "Submit the prepared visa application by clicking the final submit button on the consular portal. " +
    "This requires explicit human approval because it is irreversible. Only call after prepare_submission.",
  inputSchema,
  needsApproval: always(),
  async execute() {
    const state = caseState.get();

    if (!state.browserUseSessionId) {
      throw new Error(
        "No prepared submission session found. Call prepare_submission first."
      );
    }

    const { referenceNumber, submitted } = await finalizeSubmission(
      state.browserUseSessionId
    );

    if (!submitted) {
      throw new Error("Submission could not be completed. Please review the portal and try again.");
    }

    const now = new Date().toISOString();

    caseState.update((s) => ({
      ...s,
      status: "submitted",
      referenceNumber,
      timeline: [
        ...(s.timeline ?? []),
        {
          title: "Application submitted",
          description: `Reference number ${referenceNumber}`,
          time: now,
          status: "complete",
        },
      ],
    }));

    return {
      submitted: true,
      reference_number: referenceNumber,
      case_state: caseState.get(),
    };
  },
});
