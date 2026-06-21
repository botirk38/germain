import { ToolLoopAgent, InferAgentUIMessage, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { attacheTools } from "../tools";
import { attacheSystemPrompt } from "./prompts";

const callOptionsSchema = z.object({
  caseContext: z.string(),
  userId: z.string(),
  orgId: z.string().optional(),
  userProfile: z.record(z.unknown()).optional(),
});

export type AttacheCallOptions = z.infer<typeof callOptionsSchema>;
export type AttacheAgent = ToolLoopAgent<AttacheCallOptions, typeof attacheTools>;
export type AttacheUIMessage = InferAgentUIMessage<AttacheAgent>;

function isAttacheToolName(toolName: string): toolName is keyof typeof attacheTools {
  return Object.hasOwn(attacheTools, toolName);
}

export function createAttacheAgent(): AttacheAgent {
  return new ToolLoopAgent({
    model: gateway("openai/gpt-5.4-mini"),
    callOptionsSchema,
    instructions: attacheSystemPrompt,
    prepareCall: ({ options, instructions, ...settings }) => {
      const profileSection = options.userProfile
        ? `\n\nUser profile (from onboarding):\n${JSON.stringify(options.userProfile, null, 2)}`
        : "";
      return {
        ...settings,
        instructions: `${instructions}\n\n${options.caseContext}${profileSection}`,
      };
    },
    tools: attacheTools,
    stopWhen: [
      stepCountIs(20),
      (options) => {
        const lastStep = options.steps[options.steps.length - 1];
        if (!lastStep) return false;
        const lastCall = lastStep.toolCalls[lastStep.toolCalls.length - 1];
        if (!lastCall) return false;
        if (!isAttacheToolName(lastCall.toolName)) return false;
        const tool = attacheTools[lastCall.toolName];
        if (!tool) return false;
        return !tool.execute;
      },
    ],
    maxOutputTokens: 4000,
    temperature: 0.2,
  });
}
