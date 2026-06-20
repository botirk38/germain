import { ToolLoopAgent, InferAgentUIMessage, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { germainTools } from "../tools";
import { germainSystemPrompt } from "../prompts";

const germainCallOptionsSchema = z.object({
  caseContext: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  userProfile: z.record(z.unknown()).optional(),
});

export type GermainCallOptions = z.infer<typeof germainCallOptionsSchema>;
export type GermainAgent = ToolLoopAgent<GermainCallOptions, typeof germainTools>;
export type GermainUIMessage = InferAgentUIMessage<GermainAgent>;

function isGermainToolName(toolName: string): toolName is keyof typeof germainTools {
  return Object.hasOwn(germainTools, toolName);
}

export function createGermainAgent(): GermainAgent {
  return new ToolLoopAgent({
    // Tool-calling model. gemini-3.1-flash-lite is restricted on the gateway
    // free tier; gpt-oss-120b leaks tool calls as text. gpt-4.1-mini also works
    // cleanly if a swap is ever needed.
    model: gateway("openai/gpt-5.4-mini"),
    callOptionsSchema: germainCallOptionsSchema,
    instructions: germainSystemPrompt,
    prepareCall: ({ options, instructions, ...settings }) => {
      const profileSection = options.userProfile
        ? `\n\nUser profile (from onboarding):\n${JSON.stringify(options.userProfile, null, 2)}`
        : "";
      return {
        ...settings,
        instructions: `${instructions}\n\n${options.caseContext}${profileSection}`,
      };
    },
    tools: germainTools,
    stopWhen: [
      stepCountIs(20),
      // Stop when we hit a client-interaction tool (no execute function)
      // The agent will wait for user interaction via addToolOutput
      (options) => {
        const lastStep = options.steps[options.steps.length - 1];
        if (!lastStep) return false;
        const lastCall = lastStep.toolCalls[lastStep.toolCalls.length - 1];
        if (!lastCall) return false;
        // Check if this tool has no execute function (client-interaction tool)
        if (!isGermainToolName(lastCall.toolName)) return false;
        const tool = germainTools[lastCall.toolName];
        if (!tool) return false;
        // Tools without execute are client-interaction tools
        return !tool.execute;
      },
    ],
    maxOutputTokens: 4000,
    temperature: 0.2, // Lower temperature for consistent, factual responses
  });
}
