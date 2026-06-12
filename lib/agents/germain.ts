import { ToolLoopAgent, InferAgentUIMessage, isLoopFinished } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { germainTools } from "../tools";
import { germainSystemPrompt } from "../prompts";

export type GermainAgent = ToolLoopAgent<never, typeof germainTools>;
export type GermainUIMessage = InferAgentUIMessage<GermainAgent>;

export function createGermainAgent(): GermainAgent {
  return new ToolLoopAgent({
    // Tool-calling model. gemini-3.1-flash-lite is restricted on the gateway
    // free tier; gpt-oss-120b leaks tool calls as text. gpt-4.1-mini also works
    // cleanly if a swap is ever needed.
    model: gateway("openai/gpt-5.4-mini"),
    instructions: germainSystemPrompt,
    tools: germainTools,
    stopWhen: isLoopFinished(), // Stop when the loop is naturally finished (no pending tool calls)
    maxOutputTokens: 4000,
    temperature: 0.2, // Lower temperature for consistent, factual responses
  });
}
