import { ToolLoopAgent, InferAgentUIMessage } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { germainTools } from "../tools";
import { germainSystemPrompt } from "../prompts";

export type GermainAgent = ToolLoopAgent<never, typeof germainTools>;
export type GermainUIMessage = InferAgentUIMessage<GermainAgent>;

export function createGermainAgent(): GermainAgent {
  return new ToolLoopAgent({
    model: gateway("openai/gpt-5.4-mini"),
    instructions: germainSystemPrompt,
    tools: germainTools,
    stopWhen: [
      // Stop when we hit a client-interaction tool (no execute function)
      // The agent will wait for user interaction via addToolOutput
      (options) => {
        const lastStep = options.steps[options.steps.length - 1];
        if (!lastStep) return false;
        const lastCall = lastStep.toolCalls[lastStep.toolCalls.length - 1];
        if (!lastCall) return false;
        // Check if this tool has no execute function (client-interaction tool)
        const tool = germainTools[lastCall.toolName as keyof typeof germainTools];
        if (!tool) return false;
        // Tools without execute are client-interaction tools
        return !tool.execute;
      },
    ],
    maxOutputTokens: 4000,
    temperature: 0.2, // Lower temperature for consistent, factual responses
  });
}
