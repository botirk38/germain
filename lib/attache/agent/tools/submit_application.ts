import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { BrowserUse } from "browser-use-sdk/v3";
import { z } from "zod";
import { z as browserZ } from "zod/v4";
import { caseState } from "../lib/state";

const browserSubmissionConfirmationSchema = browserZ.object({
  referenceNumber: browserZ.string(),
  submitted: browserZ.boolean(),
});

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
  try {
    const result = await client.run(
      "Click the final submit button on the current page to submit the visa application. Return the reference number and whether submission was successful.",
      { schema: browserSubmissionConfirmationSchema, sessionId },
    );
    return result.output;
  } finally {
    await client.sessions.stop(sessionId);
  }
}

const inputSchema = z.object({});
const outputSchema = z.object({
  submitted: z.boolean(),
  reference_number: z.string(),
  case_state: z.unknown(),
});

export default defineTool({
  description:
    "Submit the prepared visa application by clicking the final submit button on the consular portal. Requires explicit approval.",
  inputSchema,
  outputSchema,
  needsApproval: always(),
  async execute() {
    const state = caseState.get();

    if (state.status !== "preparing_submission") {
      throw new Error("The application is not ready for final submission. Prepare and review it first.");
    }
    if (!state.browserUseSessionId) {
      throw new Error("No prepared submission session found. Call prepare_submission first.");
    }
    if (!state.submissionPreview || state.submissionPreview.status === "failed") {
      throw new Error("No successful submission preview exists. Review the portal draft before submitting.");
    }

    const { referenceNumber, submitted } = await finalizeSubmission(state.browserUseSessionId);

    if (!submitted) {
      throw new Error("Submission could not be completed. Please review the portal and try again.");
    }

    const now = new Date().toISOString();

    caseState.update((s) => ({
      ...s,
      status: "submitted",
      referenceNumber,
      browserUseSessionId: undefined,
      timeline: [
        ...s.timeline,
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
  toModelOutput(output) {
    return {
      type: "json",
      value: {
        submitted: output.submitted,
        reference_number: output.reference_number,
      },
    };
  },
});
