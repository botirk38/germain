import { getBrowserUseClient } from "./client";

interface SubmissionResult {
  referenceNumber?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentLocation?: string;
  confirmationCode?: string;
  paymentConfirmation?: string;
  status: "completed" | "partial" | "failed";
  formFieldsFilled: number;
  errors?: string[];
}

interface SubmissionInput {
  portalUrl: string;
  formData: Record<string, string>;
  documents: Array<{ type: string; name: string; storageKey?: string }>;
  preferredAppointment?: { start: string; end: string };
}

export async function orchestrateSubmission(
  input: SubmissionInput
): Promise<{ sessionId: string; liveViewUrl: string; result: SubmissionResult }> {
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

Return the following information as JSON:
- referenceNumber: any reference number shown
- appointmentDate, appointmentTime, appointmentLocation, confirmationCode: appointment details if available
- paymentConfirmation: payment confirmation if fees were paid
- formFieldsFilled: number of form fields successfully filled
- status: "completed" if all fields filled, "partial" if some missing, "failed" if errors
- errors: array of any errors encountered`;

  const session = await client.sessions.create();

  const result = await client.run(task, {
    sessionId: session.id,
  });

  // Parse the output as SubmissionResult
  const output = typeof result.output === "string"
    ? parseSubmissionOutput(result.output)
    : { status: "completed" as const, formFieldsFilled: 0 };

  return {
    sessionId: session.id,
    liveViewUrl: session.liveUrl ?? "",
    result: output,
  };
}

function parseSubmissionOutput(raw: string): SubmissionResult {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      return {
        referenceNumber: typeof parsed.referenceNumber === "string" ? parsed.referenceNumber : undefined,
        appointmentDate: typeof parsed.appointmentDate === "string" ? parsed.appointmentDate : undefined,
        appointmentTime: typeof parsed.appointmentTime === "string" ? parsed.appointmentTime : undefined,
        appointmentLocation: typeof parsed.appointmentLocation === "string" ? parsed.appointmentLocation : undefined,
        confirmationCode: typeof parsed.confirmationCode === "string" ? parsed.confirmationCode : undefined,
        paymentConfirmation: typeof parsed.paymentConfirmation === "string" ? parsed.paymentConfirmation : undefined,
        status: (parsed.status === "completed" || parsed.status === "partial" || parsed.status === "failed") ? parsed.status : "partial",
        formFieldsFilled: typeof parsed.formFieldsFilled === "number" ? parsed.formFieldsFilled : 0,
        errors: Array.isArray(parsed.errors) ? parsed.errors.filter((e): e is string => typeof e === "string") : undefined,
      };
    }
  } catch {
    // Fall through to default
  }
  return { status: "partial", formFieldsFilled: 0 };
}

export async function finalizeSubmission(sessionId: string): Promise<{
  referenceNumber: string;
  submitted: boolean;
}> {
  const client = getBrowserUseClient();

  const result = await client.run(
    "Click the final submit button on the current page to submit the visa application. Return the reference number and whether submission was successful as JSON: { referenceNumber: string, submitted: boolean }",
    { sessionId }
  );

  const raw = typeof result.output === "string" ? result.output : "";
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      return {
        referenceNumber: typeof parsed.referenceNumber === "string" ? parsed.referenceNumber : `REF-${Date.now()}`,
        submitted: parsed.submitted === true,
      };
    }
  } catch {
    // Fall through
  }

  return { referenceNumber: `REF-${Date.now()}`, submitted: false };
}
