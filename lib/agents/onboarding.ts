import { ToolLoopAgent, InferAgentUIMessage, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { onboardingTools } from "../tools/onboarding-tools";
import { onboardingSystemPrompt } from "../prompts/onboarding";

const onboardingCallOptionsSchema = z.object({
  collectedFields: z.record(z.unknown()).optional(),
});

export type OnboardingCallOptions = z.infer<typeof onboardingCallOptionsSchema>;
export type OnboardingAgent = ToolLoopAgent<OnboardingCallOptions, typeof onboardingTools>;
export type OnboardingUIMessage = InferAgentUIMessage<OnboardingAgent>;

function isOnboardingToolName(toolName: string): toolName is keyof typeof onboardingTools {
  return Object.hasOwn(onboardingTools, toolName);
}

export function createOnboardingAgent(): OnboardingAgent {
  return new ToolLoopAgent({
    model: gateway("openai/gpt-5.4-mini"),
    callOptionsSchema: onboardingCallOptionsSchema,
    instructions: onboardingSystemPrompt,
    prepareCall: ({ options, instructions, ...settings }) => {
      const context = options.collectedFields
        ? `\n\nFields already collected:\n${JSON.stringify(options.collectedFields, null, 2)}`
        : "";
      return {
        ...settings,
        instructions: `${instructions}${context}`,
      };
    },
    tools: onboardingTools,
    stopWhen: [
      stepCountIs(30),
      // Stop on client-interaction tools (no execute function)
      (agentOptions) => {
        const lastStep = agentOptions.steps[agentOptions.steps.length - 1];
        if (!lastStep) return false;
        const lastCall = lastStep.toolCalls[lastStep.toolCalls.length - 1];
        if (!lastCall) return false;
        if (!isOnboardingToolName(lastCall.toolName)) return false;
        const tool = onboardingTools[lastCall.toolName];
        return !tool.execute;
      },
    ],
    maxOutputTokens: 2000,
  });
}
