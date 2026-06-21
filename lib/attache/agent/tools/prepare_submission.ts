import { defineTool } from "eve/tools";
import { defineState } from "eve/context";
import { BrowserUse } from "browser-use-sdk/v3";
import { z } from "zod";
import { z as browserZ } from "zod/v4";

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

type CaseState = {
  readonly destinationCountry?: string;
  readonly portalUrl?: string;
  readonly documents: readonly { readonly type: string; readonly name: string; readonly storageKey?: string }[];
  readonly applicant: {
    readonly fullName?: string;
    readonly nationality?: string;
    readonly residenceCountry?: string;
    readonly residenceCity?: string;
    readonly employmentStatus?: string;
    readonly employer?: string;
    readonly jobTitle?: string;
  };
  readonly travel: {
    readonly purpose?: string;
    readonly destinationCity?: string;
    readonly arrivalDate?: string;
    readonly departureDate?: string;
  };
  readonly status: string;
} & Record<string, unknown>;

function initialCaseState(): CaseState {
  return {
    id: `case-${Date.now()}`,
    destinationCountry: "",
    documents: [],
    applicant: {},
    travel: {},
    status: "intake",
  };
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
    ? `\nAfter filling the form, look for appointment booking. Preferred dates: ${input.preferredAppointment.start} to ${input.preferredAppointment.end}. Select the earliest available slot.`
    : "";
  const task = `Navigate to ${input.portalUrl} and fill out the visa application form with the following information:

${formEntries}

Fill each field carefully. For dropdowns, select the closest matching option.
After filling all fields, DO NOT click the final submit button — stop at the review/preview page so the user can approve.
${appointmentInstructions}

Return structured output with any reference number shown, appointment details if available, the number of fields filled, status, and errors.`;
  const session = await client.sessions.create();
  const result = await client.run(task, {
    keepAlive: true,
    schema: browserSubmissionResultSchema,
    sessionId: session.id,
  });
  return { sessionId: session.id, liveViewUrl: session.liveUrl ?? "", result: result.output };
}

const inputSchema = z.object({
  portal_url: z
    .string()
    .url()
    .optional()
    .describe(
      "URL of the consular appointment/application portal. If omitted, the value stored in case state is used."
    ),
  preferred_appointment_start: z
    .string()
    .optional()
    .describe("Earliest preferred appointment date (ISO 8601)."),
  preferred_appointment_end: z
    .string()
    .optional()
    .describe("Latest preferred appointment date (ISO 8601)."),
});

export default defineTool({
  description:
    "Prepare the visa application for final submission. Fills the consular portal form using the " +
    "current case state and documents, stops at the final review page, and returns a live view URL " +
    "so the applicant can inspect before approving submission.",
  inputSchema,
  async execute(input) {
    const state = caseState.get();
    const portalUrl = input.portal_url ?? state.portalUrl;

    if (!portalUrl) {
      throw new Error(
        "No portal URL available. Ask the applicant for the consular portal URL before preparing submission."
      );
    }

    const formData = generateFormData(state);

    const preferredAppointment =
      input.preferred_appointment_start && input.preferred_appointment_end
        ? {
            start: input.preferred_appointment_start,
            end: input.preferred_appointment_end,
          }
        : undefined;

    const { sessionId, liveViewUrl, result } = await orchestrateSubmission({
      portalUrl,
      formData,
    preferredAppointment,
  });

    caseState.update((s) => ({
      ...s,
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
      reference_number: result.referenceNumber,
      appointment_date: result.appointmentDate,
      appointment_time: result.appointmentTime,
      appointment_location: result.appointmentLocation,
      confirmation_code: result.confirmationCode,
      payment_confirmation: result.paymentConfirmation,
      errors: result.errors,
      case_state: caseState.get(),
    };
  },
});
