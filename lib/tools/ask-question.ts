import { tool } from "ai";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string().describe("Unique identifier for this question"),
  question: z.string().describe("The question text to display"),
  options: z
    .array(z.string())
    .describe("Predefined answer choices shown as clickable buttons"),
  allowFreeText: z
    .boolean()
    .optional()
    .describe(
      "When true, show an additional free-text input alongside the options",
    ),
});

const answerSchema = z.object({
  questionId: z.string(),
  selectedOption: z.string().optional(),
  freeText: z.string().optional(),
  skipped: z.boolean().optional(),
});

const askQuestionOutputSchema = z.object({
  answers: z.array(answerSchema),
});

export const askQuestionTool = tool({
  description:
    "UI tool: Present one or more structured questions to the user with " +
    "predefined clickable options. Use this instead of free-form text when " +
    "you need specific information (visa type, travel purpose, yes/no " +
    "confirmations, document clarifications, etc.). Each question can " +
    "optionally allow a free-text response alongside the predefined options. " +
    "The user sees all questions at once and submits answers together. " +
    "Users may skip individual questions they prefer not to answer.",
  inputSchema: z.object({
    questions: z.array(questionSchema).min(1),
    context: z
      .string()
      .optional()
      .describe("Brief heading or context shown above the questions"),
  }),
  outputSchema: askQuestionOutputSchema,
});

export type AskQuestionOutput = z.infer<typeof askQuestionOutputSchema>;
