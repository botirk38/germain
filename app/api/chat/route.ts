import { createAgentUIStreamResponse } from "ai";
import { createGermainAgent, type GermainUIMessage } from "@/lib/agents/germain";
import { deriveCase, initialCaseState } from "@/lib/case-derive";
import { germainUserPrompt } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const uiMessages = (body.messages || []) as GermainUIMessage[];

  // Derive current case state from message history
  const caseState = uiMessages.length > 0 ? deriveCase(uiMessages) : initialCaseState;

  // Create agent with current context
  const agent = createGermainAgent();

  // Build enhanced instructions with current case state
  const contextMessage = {
    id: "system-context",
    role: "system" as const,
    createdAt: new Date(),
    parts: [{ type: "text" as const, text: germainUserPrompt(caseState) }],
  };
  const enhancedMessages = [contextMessage, ...uiMessages];

  // Stream response using the agent
  return createAgentUIStreamResponse({
    agent,
    uiMessages: enhancedMessages,
  });
}
