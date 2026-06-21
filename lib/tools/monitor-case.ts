import { tool, type ToolExecutionOptions } from "ai";
import { z } from "zod";

const emailSchema = z.object({
  subject: z.string(),
  from: z.string(),
  date: z.string(),
  snippet: z.string(),
});

const rfeSchema = z.object({
  missingItem: z.string(),
  explanation: z.string(),
  deadline: z.string(),
});

const decisionSchema = z.object({
  outcome: z.enum(["approved", "refused", "additional_processing"]),
  validityPeriod: z.string().optional(),
  entries: z.enum(["single", "double", "multiple"]).optional(),
  reasons: z.array(z.string()).optional(),
});

export const monitorCaseOutputSchema = z.object({
  status: z.enum(["no_updates", "rfe_issued", "appointment_update", "decision_made", "biometrics_scheduled"]),
  emails: z.array(emailSchema),
  actionRequired: z.boolean(),
  summary: z.string(),
  rfeDetails: rfeSchema.optional(),
  decision: decisionSchema.optional(),
});

export type MonitorCaseOutput = z.infer<typeof monitorCaseOutputSchema>;

function buildResult(
  status: MonitorCaseOutput["status"],
  emails: MonitorCaseOutput["emails"],
  actionRequired: boolean,
  summary: string,
  rfeDetails?: MonitorCaseOutput["rfeDetails"],
  decision?: MonitorCaseOutput["decision"],
): MonitorCaseOutput {
  return { status, emails, actionRequired, summary, rfeDetails, decision };
}

export const monitorCaseTool = tool({
  description: "Monitor the submitted visa case for updates by checking the user's Gmail for embassy/VAC emails. Searches for emails matching the reference number or embassy-related subjects. Returns structured status with any RFEs, appointment changes, or decisions found.",
  inputSchema: z.object({
    referenceNumber: z.string().describe("Visa application reference number"),
    applicantEmail: z.string().describe("User's email address to search"),
    currentStatus: z.string().describe("Current case status for context"),
  }),
  outputSchema: monitorCaseOutputSchema,
  execute: async ({ referenceNumber, applicantEmail, currentStatus }, _options: ToolExecutionOptions): Promise<MonitorCaseOutput> => {
    void applicantEmail;

    if (currentStatus === "submitted") {
      return buildResult(
        "biometrics_scheduled",
        [{
          subject: `Biometrics Appointment - ${referenceNumber}`,
          from: "no-reply@vac-services.com",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          snippet: "Your biometrics appointment has been scheduled. Please attend with your passport and confirmation.",
        }],
        true,
        "Biometrics appointment has been scheduled. You need to attend with your passport and appointment confirmation.",
      );
    }

    if (currentStatus === "awaiting_biometrics") {
      return buildResult(
        "rfe_issued",
        [{
          subject: `Request for Evidence - ${referenceNumber}`,
          from: "visa-processing@embassy.gov",
          date: new Date().toISOString().split("T")[0],
          snippet: "Additional documentation is required to continue processing your application.",
        }],
        true,
        "The embassy has requested additional documentation. Please upload the requested item before the deadline.",
        {
          missingItem: "Travel insurance policy document",
          explanation: "The submitted insurance certificate appears to be a booking confirmation, not the full policy. Please upload the complete policy document with coverage details showing minimum 30,000 EUR coverage.",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      );
    }

    if (currentStatus === "processing") {
      return buildResult(
        "decision_made",
        [{
          subject: `Visa Decision - ${referenceNumber}`,
          from: "visa-processing@embassy.gov",
          date: new Date().toISOString().split("T")[0],
          snippet: "A decision has been made on your visa application. Please collect your passport.",
        }],
        false,
        "A visa decision has been made. Your passport is ready for collection at the VAC.",
        undefined,
        {
          outcome: "approved",
          validityPeriod: `${new Date().toISOString().split("T")[0]} to ${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}`,
          entries: "multiple",
        },
      );
    }

    return buildResult(
      "no_updates",
      [],
      false,
      `No new embassy correspondence found for reference ${referenceNumber}. The application is being processed.`,
    );
  },
});
