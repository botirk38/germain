import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { BrowserUse } from "browser-use-sdk/v3";
import { z } from "zod";
import { z as browserZ } from "zod/v4";
import { appendEvent, getVisaCaseView, updateVisaCase, upsertSubmission } from "@/lib/db/queries";
import { activeVisaCase } from "../lib/state";

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
  case_view: z.unknown(),
});

export default defineTool({
  description:
    "Submit the prepared visa application by clicking the final submit button on the consular portal. Requires explicit approval.",
  inputSchema,
  outputSchema,
  needsApproval: always(),
  async execute(_input, ctx) {
    const state = activeVisaCase.get();
    const userId = ctx.session.auth.current?.attributes.userId;
    const orgId = ctx.session.auth.current?.attributes.orgId;

    if (typeof userId !== "string") {
      throw new Error("No authenticated user found for this Eve session.");
    }
    if (!state.visaCaseId) {
      throw new Error("No loaded visa case found. Call load_case first.");
    }

    const owner = {
      clerkUserId: userId,
      clerkOrgId: typeof orgId === "string" ? orgId : null,
      visaCaseId: state.visaCaseId,
    };
    const caseView = await getVisaCaseView(owner);
    if (!caseView) throw new Error("Visa case not found for the authenticated user.");
    if (
      caseView.visaCase.internalStatus !== "portal_draft_ready" &&
      caseView.visaCase.internalStatus !== "final_submission_requested"
    ) {
      throw new Error("The application is not ready for final submission. Prepare and review it first.");
    }
    if (!caseView.caseSubmission?.browserUseSessionId) {
      throw new Error("No prepared submission session found. Call prepare_submission first.");
    }
    if (caseView.caseSubmission.submissionStatus === "failed") {
      throw new Error("No successful submission preview exists. Review the portal draft before submitting.");
    }
    await updateVisaCase(owner, {
      internalStatus: "final_submission_requested",
      candidateStatus: "waiting_for_approval",
    });
    await upsertSubmission(owner, {
      submissionStatus: "approved_for_submit",
    });
    await appendEvent(owner, state.visaCaseId, {
      eventType: "final_submission_approved",
      fromStatus: caseView.visaCase.internalStatus,
      toStatus: "final_submission_requested",
    });

    const { referenceNumber, submitted } = await finalizeSubmission(caseView.caseSubmission.browserUseSessionId);

    if (!submitted) {
      throw new Error("Submission could not be completed. Please review the portal and try again.");
    }

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

    const nextCaseView = await getVisaCaseView(owner);

    return {
      submitted: true,
      reference_number: referenceNumber,
      case_view: nextCaseView,
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
