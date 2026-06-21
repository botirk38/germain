import { createAgentUIStreamResponse } from "ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createAttacheAgent, type AttacheUIMessage } from "@/lib/attache/agent";
import { deriveCase, initialCaseState } from "@/lib/attache/case";
import { attacheUserPrompt } from "@/lib/attache/prompts";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rateCheck = checkRateLimit(`chat:${userId}`, { maxRequests: 30 });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck);
  }

  const user = await currentUser();
  const userProfile = user?.publicMetadata ?? {};

  const body = await req.json();
  const uiMessages = (body.messages || []) as AttacheUIMessage[];

  const caseState = uiMessages.length > 0 ? deriveCase(uiMessages) : initialCaseState;
  const agent = createAttacheAgent();

  return createAgentUIStreamResponse({
    agent,
    uiMessages,
    options: {
      caseContext: attacheUserPrompt(caseState),
      userId,
      orgId: orgId ?? undefined,
      userProfile,
    },
  });
}
