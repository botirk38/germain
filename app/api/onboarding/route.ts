import { createAgentUIStreamResponse } from "ai";
import { auth } from "@clerk/nextjs/server";
import { createOnboardingAgent, type OnboardingUIMessage } from "@/lib/agents/onboarding";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rateCheck = checkRateLimit(`onboarding:${userId}`, { maxRequests: 20 });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck);
  }

  const body = await req.json();
  const uiMessages = (body.messages || []) as OnboardingUIMessage[];

  const agent = createOnboardingAgent();

  return createAgentUIStreamResponse({
    agent,
    uiMessages,
    options: {
      collectedFields: body.collectedFields,
    },
  });
}
