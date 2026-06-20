import { createAgentUIStreamResponse } from "ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createGermainAgent, type GermainUIMessage } from "@/lib/agents/germain";
import { deriveCase, initialCaseState } from "@/lib/case-derive";
import { germainUserPrompt } from "@/lib/prompts";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit: 30 requests per minute per user
  const rateCheck = checkRateLimit(`chat:${userId}`, { maxRequests: 30 });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck);
  }

  const user = await currentUser();
  const userProfile = user?.publicMetadata ?? {};

  const body = await req.json();
  const uiMessages = (body.messages || []) as GermainUIMessage[];

  const caseState = uiMessages.length > 0 ? deriveCase(uiMessages) : initialCaseState;
  const agent = createGermainAgent();

  return createAgentUIStreamResponse({
    agent,
    uiMessages,
    options: {
      caseContext: germainUserPrompt(caseState),
      userId,
      orgId: orgId ?? undefined,
      userProfile,
    },
  });
}
