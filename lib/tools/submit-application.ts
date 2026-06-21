import { tool } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// submitApplication
// ---------------------------------------------------------------------------

export const submitApplicationOutputSchema = z.object({
  sessionId: z.string(),
  liveViewUrl: z.string(),
  status: z.enum(["filling", "ready_for_review", "submitted", "failed"]),
  referenceNumber: z.string().optional(),
  appointmentDetails: z.object({
    date: z.string(),
    time: z.string(),
    location: z.string(),
    confirmationCode: z.string(),
  }).optional(),
  paymentConfirmation: z.string().optional(),
});

export type SubmitApplicationOutput = z.infer<typeof submitApplicationOutputSchema>;

export const submitApplicationInputSchema = z.object({
  portalUrl: z.string(),
  formData: z.record(z.string()),
  documents: z.array(z.object({
    type: z.string(),
    name: z.string(),
    storageKey: z.string().optional(),
  })),
  fees: z.object({ total: z.number() }),
  preferredAppointment: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationInputSchema>;

export const submitApplicationTool = tool({
  description: "Submit the visa application using Browser Use. Opens a real browser session on the consulate portal, fills the application form with case data, and displays a live browser view. The user watches the agent fill the form and must approve before final submission.",
  inputSchema: submitApplicationInputSchema,
  outputSchema: submitApplicationOutputSchema,
});

// ---------------------------------------------------------------------------
// approveSubmission
// ---------------------------------------------------------------------------

export const approveSubmissionOutputSchema = z.object({
  approved: z.boolean(),
  userNote: z.string().optional(),
});

export type ApproveSubmissionOutput = z.infer<typeof approveSubmissionOutputSchema>;

export const approveSubmissionInputSchema = z.object({
  sessionId: z.string(),
  liveViewUrl: z.string(),
  formSummary: z.record(z.string()),
  appointmentSummary: z.string().optional(),
  totalFees: z.number(),
});

export type ApproveSubmissionInput = z.infer<typeof approveSubmissionInputSchema>;

export const approveSubmissionTool = tool({
  description: "Human-in-the-loop approval gate. The user reviews the filled application in the live browser view and explicitly approves or rejects the submission. This must be called after submitApplication shows the completed form.",
  inputSchema: approveSubmissionInputSchema,
  outputSchema: approveSubmissionOutputSchema,
});
