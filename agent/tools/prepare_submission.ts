import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { BrowserUse } from "browser-use-sdk/v3";
import { z } from "zod";
import { z as browserZ } from "zod/v4";
import { appendEvent, getVisaCaseView, updateVisaCase, upsertSubmission, type VisaCaseView } from "@/lib/db/queries";
import { activeVisaCase } from "../lib/state";

type SubmissionResult = {
  readonly referenceNumber?: string;
  readonly appointmentDate?: string;
  readonly appointmentTime?: string;
  readonly appointmentLocation?: string;
  readonly confirmationCode?: string;
  readonly paymentConfirmation?: string;
  readonly status: "completed" | "partial" | "failed";
  readonly formFieldsFilled: number;
  readonly errors?: readonly string[];
};

const browserSubmissionResultSchema = browserZ.object({
  referenceNumber: browserZ.string().optional(),
  appointmentDate: browserZ.string().optional(),
  appointmentTime: browserZ.string().optional(),
  appointmentLocation: browserZ.string().optional(),
  confirmationCode: browserZ.string().optional(),
  paymentConfirmation: browserZ.string().optional(),
  status: browserZ.enum(["completed", "partial", "failed"]),
  formFieldsFilled: browserZ.number(),
  errors: browserZ.array(browserZ.string()).optional(),
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

function generateFormData(caseView: VisaCaseView): Record<string, string> {
  const { visaCase, intake } = caseView;
  return {
    fullName: intake?.applicantFullName ?? "",
    nationality: intake?.applicantNationality ?? "",
    residenceCountry: intake?.applicantResidenceCountry ?? "",
    residenceCity: intake?.applicantResidenceCity ?? "",
    employmentStatus: intake?.applicantEmploymentStatus ?? "",
    employer: intake?.applicantEmployer ?? "",
    jobTitle: intake?.applicantJobTitle ?? "",
    purposeOfTravel: visaCase.travelPurpose,
    destinationCountry: visaCase.destinationCountry,
    destinationCity: intake?.destinationCity ?? "",
    arrivalDate: intake?.arrivalDate ?? "",
    departureDate: intake?.departureDate ?? "",
    fundingSource: intake?.applicantEmployer ? "Employment income" : "Personal savings",
  };
}

function assertSafePortalUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  const hostname = url.hostname.toLowerCase();
  const blockedHosts = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);
  const isPrivateIpv4 = /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(hostname);

  if (url.protocol !== "https:") {
    throw new Error("Portal URL must use HTTPS.");
  }
  if (blockedHosts.has(hostname) || hostname.endsWith(".localhost") || isPrivateIpv4) {
    throw new Error("Portal URL cannot point to a local or private network address.");
  }

  return url.toString();
}

async function orchestrateSubmission(input: {
  readonly portalUrl: string;
  readonly formData: Record<string, string>;
  readonly preferredAppointment?: { readonly start: string; readonly end: string };
}): Promise<{ readonly sessionId: string; readonly liveViewUrl: string; readonly result: SubmissionResult }> {
  const client = getBrowserUseClient();
  const formEntries = Object.entries(input.formData)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
  const appointmentInstructions = input.preferredAppointment
    ? `\nAfter filling the form, look for appointment booking. Preferred dates: ${input.preferredAppointment.start} to ${input.preferredAppointment.end}. Do not reserve or confirm an appointment unless the portal requires it to reach the review page.`
    : "";
  const task = `Navigate to ${input.portalUrl} and fill out the visa application form with the following information:

${formEntries}

Fill each field carefully. For dropdowns, select the closest matching option.
Do not pay fees, reserve appointments, upload files, or click the final submit button. Stop at the review/preview page so the applicant can inspect before approving.
${appointmentInstructions}

Return structured output with any reference number shown, appointment details if visible, the number of fields filled, status, and errors.`;
  const session = await client.sessions.create();
  const result = await client.run(task, {
    keepAlive: true,
    schema: browserSubmissionResultSchema,
    sessionId: session.id,
  });
  return { sessionId: session.id, liveViewUrl: session.liveUrl ?? "", result: result.output };
}

const inputSchema = z.object({
  portal_url: z.string().url().optional().describe("HTTPS URL of the official consular application portal."),
  preferred_appointment_start: z.string().date().optional().describe("Earliest preferred appointment date."),
  preferred_appointment_end: z.string().date().optional().describe("Latest preferred appointment date."),
});

const outputSchema = z.object({
  live_view_url: z.string(),
  form_fields_filled: z.number(),
  status: z.enum(["completed", "partial", "failed"]),
  reference_number: z.string().optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  appointment_location: z.string().optional(),
  confirmation_code: z.string().optional(),
  payment_confirmation: z.string().optional(),
  errors: z.array(z.string()).optional(),
  case_view: z.unknown(),
});

export default defineTool({
  description:
    "With applicant approval, open the official consular portal, fill a draft application from case state, and stop at review.",
  inputSchema,
  outputSchema,
  needsApproval: always(),
  async execute(input, ctx) {
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
    const portalUrl = input.portal_url ?? caseView.caseSubmission?.portalUrl;

    if (!portalUrl) {
      throw new Error("No portal URL available. Ask the applicant for the official consular portal URL first.");
    }

    const safePortalUrl = assertSafePortalUrl(portalUrl);
    const formData = generateFormData(caseView);
    const preferredAppointment =
      input.preferred_appointment_start && input.preferred_appointment_end
        ? { start: input.preferred_appointment_start, end: input.preferred_appointment_end }
        : undefined;

    await updateVisaCase(owner, {
      internalStatus: "portal_draft_requested",
      candidateStatus: "preparing_application",
    });
    await upsertSubmission(owner, {
      portalUrl: safePortalUrl,
      submissionStatus: "draft_requested",
      submissionResult: { formData },
    });
    await appendEvent(owner, state.visaCaseId, {
      eventType: "portal_draft_requested",
      fromStatus: caseView.visaCase.internalStatus,
      toStatus: "portal_draft_requested",
      payload: { portalUrl: safePortalUrl },
    });

    try {
      const { sessionId, liveViewUrl, result } = await orchestrateSubmission({
        portalUrl: safePortalUrl,
        formData,
        preferredAppointment,
      });

      await upsertSubmission(owner, {
        portalUrl: safePortalUrl,
        browserUseSessionId: sessionId,
        liveViewUrl,
        submissionStatus: result.status === "failed" ? "failed" : "draft_ready",
        submissionResult: { ...result, formData },
        referenceNumber: result.referenceNumber,
      });
      await updateVisaCase(owner, {
        internalStatus: result.status === "failed" ? "portal_draft_requested" : "portal_draft_ready",
        candidateStatus: result.status === "failed" ? "action_needed" : "waiting_for_approval",
      });
      await appendEvent(owner, state.visaCaseId, {
        eventType: result.status === "failed" ? "portal_draft_failed" : "portal_draft_ready",
        fromStatus: "portal_draft_requested",
        toStatus: result.status === "failed" ? "portal_draft_requested" : "portal_draft_ready",
        visibleToCandidate: true,
        payload: { liveViewAvailable: Boolean(liveViewUrl), formFieldsFilled: result.formFieldsFilled },
      });

      const nextCaseView = await getVisaCaseView(owner);

      return {
        live_view_url: liveViewUrl,
        form_fields_filled: result.formFieldsFilled,
        status: result.status,
        ...(result.referenceNumber ? { reference_number: result.referenceNumber } : {}),
        ...(result.appointmentDate ? { appointment_date: result.appointmentDate } : {}),
        ...(result.appointmentTime ? { appointment_time: result.appointmentTime } : {}),
        ...(result.appointmentLocation ? { appointment_location: result.appointmentLocation } : {}),
        ...(result.confirmationCode ? { confirmation_code: result.confirmationCode } : {}),
        ...(result.paymentConfirmation ? { payment_confirmation: result.paymentConfirmation } : {}),
        ...(result.errors ? { errors: [...result.errors] } : {}),
        case_view: nextCaseView,
      };
    } catch (error) {
      await upsertSubmission(owner, {
        portalUrl: safePortalUrl,
        submissionStatus: "failed",
        submissionResult: { error: error instanceof Error ? error.message : "Unknown Browser Use failure" },
      });
      await updateVisaCase(owner, {
        internalStatus: "portal_draft_requested",
        candidateStatus: "action_needed",
      });
      throw error;
    }
  },
  toModelOutput(output) {
    return {
      type: "json",
      value: {
        prepared: output.status,
        form_fields_filled: output.form_fields_filled,
        has_live_review: Boolean(output.live_view_url),
        errors: output.errors,
      },
    };
  },
});
