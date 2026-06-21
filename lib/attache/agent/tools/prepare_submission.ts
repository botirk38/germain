import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { BrowserUse } from "browser-use-sdk/v3";
import { z } from "zod";
import { z as browserZ } from "zod/v4";
import { caseState, type CaseState } from "../lib/state";

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

function generateFormData(state: CaseState): Record<string, string> {
  return {
    fullName: state.applicant.fullName ?? "",
    nationality: state.applicant.nationality ?? "",
    residenceCountry: state.applicant.residenceCountry ?? "",
    residenceCity: state.applicant.residenceCity ?? "",
    employmentStatus: state.applicant.employmentStatus ?? "",
    employer: state.applicant.employer ?? "",
    jobTitle: state.applicant.jobTitle ?? "",
    purposeOfTravel: state.travel.purpose ?? "",
    destinationCountry: state.destinationCountry ?? "",
    destinationCity: state.travel.destinationCity ?? "",
    arrivalDate: state.travel.arrivalDate ?? "",
    departureDate: state.travel.departureDate ?? "",
    fundingSource: state.applicant.employer ? "Employment income" : "Personal savings",
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
  case_state: z.unknown(),
});

export default defineTool({
  description:
    "With applicant approval, open the official consular portal, fill a draft application from case state, and stop at review.",
  inputSchema,
  outputSchema,
  needsApproval: always(),
  async execute(input) {
    const state = caseState.get();
    const portalUrl = input.portal_url ?? state.portalUrl;

    if (!portalUrl) {
      throw new Error("No portal URL available. Ask the applicant for the official consular portal URL first.");
    }

    const safePortalUrl = assertSafePortalUrl(portalUrl);
    const formData = generateFormData(state);
    const preferredAppointment =
      input.preferred_appointment_start && input.preferred_appointment_end
        ? { start: input.preferred_appointment_start, end: input.preferred_appointment_end }
        : undefined;

    const { sessionId, liveViewUrl, result } = await orchestrateSubmission({
      portalUrl: safePortalUrl,
      formData,
      preferredAppointment,
    });

    caseState.update((s) => ({
      ...s,
      portalUrl: safePortalUrl,
      status: "preparing_submission",
      browserUseSessionId: sessionId,
      submissionPreview: {
        liveViewUrl,
        ...result,
      },
    }));

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
      case_state: caseState.get(),
    };
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
