import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { BrowserUse } from "browser-use-sdk/v3";
import { z } from "zod";
import { z as browserZ } from "zod/v4";
import { appendEvent, updateVisaCase, upsertSubmission } from "@/lib/db/queries";
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
  async execute(_input, ctx) {
    const state = caseState.get();
    const userId = ctx.session.auth.current?.attributes.userId;
    const orgId = ctx.session.auth.current?.attributes.orgId;

    if (typeof userId !== "string") {
      throw new Error("No authenticated user found for this Eve session.");
    }
    if (!state.visaCaseId) {
      throw new Error("No loaded visa case found. Call load_case first.");
    }
    if (state.status !== "portal_draft_ready" && state.status !== "final_submission_requested") {
      throw new Error("The application is not ready for final submission. Prepare and review it first.");
    }
    if (!state.browserUseSessionId) {
      throw new Error("No prepared submission session found. Call prepare_submission first.");
    }
    if (!state.submissionPreview || state.submissionPreview.status === "failed") {
      throw new Error("No successful submission preview exists. Review the portal draft before submitting.");
    }

    const owner = {
      clerkUserId: userId,
      clerkOrgId: typeof orgId === "string" ? orgId : null,
      visaCaseId: state.visaCaseId,
    };

    await updateVisaCase(owner, {
      internalStatus: "final_submission_requested",
      candidateStatus: "waiting_for_approval",
    });
    await upsertSubmission(owner, {
      submissionStatus: "approved_for_submit",
    });
    await appendEvent(owner, state.visaCaseId, {
      eventType: "final_submission_approved",
      fromStatus: state.status,
      toStatus: "final_submission_requested",
    });

    const { referenceNumber, submitted } = await finalizeSubmission(state.browserUseSessionId);

    if (!submitted) {
      throw new Error("Submission could not be completed. Please review the portal and try again.");
    }

    const now = new Date().toISOString();

    await upsertSubmission(owner, {
      submissionStatus: "submitted",
      referenceNumber,
      submittedAt: new Date(),
      browserUseSessionId: null,
      submissionResult: { submitted: true, referenceNumber },
    });
    await updateVisaCase(owner, {
      internalStatus: "submitted",
      candidateStatus: "submitted",
      referenceNumber,
    });
    await appendEvent(owner, state.visaCaseId, {
      eventType: "application_submitted",
      fromStatus: "final_submission_requested",
      toStatus: "submitted",
      visibleToCandidate: true,
      payload: { referenceNumber },
    });

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
