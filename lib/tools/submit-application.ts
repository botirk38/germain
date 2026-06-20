import { tool } from "ai";
import { z } from "zod";

export const submitApplicationTool = tool({
  description: "Submit the visa application using Browser Use. Opens a real browser session on the consulate portal, fills the application form with case data, and displays a live browser view. The user watches the agent fill the form and must approve before final submission.",
  inputSchema: z.object({
    portalUrl: z.string().describe("URL of the consulate visa application portal"),
    formData: z.record(z.string()).describe("Form fields to fill"),
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
  }),
  outputSchema: z.object({
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
  }),
  // No execute — client-interaction tool
  // The UI renders a BrowserPanel showing the live session
  // Browser Use SDK orchestration happens server-side when user approves
});

export const approveSubmissionTool = tool({
  description: "Human-in-the-loop approval gate. The user reviews the filled application in the live browser view and explicitly approves or rejects the submission. This must be called after submitApplication shows the completed form.",
  inputSchema: z.object({
    sessionId: z.string(),
    liveViewUrl: z.string(),
    formSummary: z.record(z.string()).describe("Summary of filled form fields for user review"),
    appointmentSummary: z.string().optional(),
    totalFees: z.number(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    userNote: z.string().optional(),
  }),
  // No execute — client-side UI tool
  // Renders: live browser panel + form summary card + APPROVE/CANCEL buttons
});
