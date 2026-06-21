import { tool } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// uploadDocuments — bulk initial upload
// ---------------------------------------------------------------------------

export const uploadDocumentsOutputSchema = z.object({
  success: z.boolean(),
  uploadedCount: z.number(),
  documents: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    status: z.literal("uploaded"),
  })),
});

export type UploadDocumentsOutput = z.infer<typeof uploadDocumentsOutputSchema>;

export const uploadDocumentsInputSchema = z.object({
  requiredTypes: z.array(z.enum([
    "passport", "bank_statement", "employment_letter", "insurance",
    "hotel_booking", "flight_itinerary", "invitation_letter", "property_deed",
  ])),
  criticalDocuments: z.array(z.string()),
});

export type UploadDocumentsInput = z.infer<typeof uploadDocumentsInputSchema>;

export const uploadDocumentsTool = tool({
  description: "UI tool: Prompt user to upload ALL required documents at once. Displays a bulk document uploader with all slots visible. Use this for the INITIAL upload phase when the user hasn't uploaded anything yet.",
  inputSchema: uploadDocumentsInputSchema,
  outputSchema: uploadDocumentsOutputSchema,
});

// ---------------------------------------------------------------------------
// uploadDocument — single follow-up upload
// ---------------------------------------------------------------------------

const documentTypeEnum = z.enum([
  "passport", "bank_statement", "employment_letter", "insurance",
  "hotel_booking", "flight_itinerary", "invitation_letter",
  "property_deed", "photo", "marriage_certificate", "birth_certificate",
]);

export const uploadDocumentOutputSchema = z.object({
  uploaded: z.boolean(),
  document: z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    status: z.literal("uploaded"),
  }),
});

export type UploadDocumentOutput = z.infer<typeof uploadDocumentOutputSchema>;

export const uploadDocumentInputSchema = z.object({
  documentType: documentTypeEnum,
  reason: z.string(),
  guidance: z.string(),
  critical: z.boolean(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

export const uploadDocumentTool = tool({
  description:
    "UI tool: Request a SINGLE document from the user with full context. " +
    "Use this for follow-up requests when documents are insufficient after review, " +
    "need replacement, or for RFE responses. Renders a focused upload card explaining " +
    "why the document is needed and what makes a good upload. Call once per document — " +
    "the user sees one focused card at a time for a guided step-by-step experience.",
  inputSchema: uploadDocumentInputSchema,
  outputSchema: uploadDocumentOutputSchema,
});
