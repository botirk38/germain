import { auth } from "@clerk/nextjs/server";
import { orchestrateSubmission, finalizeSubmission } from "@/lib/browser-use/orchestrate";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rateCheck = checkRateLimit(`browser:${userId}`, {
    maxRequests: 5,
    windowMs: 300_000,
  });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck);
  }

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "start": {
        const { portalUrl, formData, documents, preferredAppointment } = body;
        const result = await orchestrateSubmission({
          portalUrl,
          formData,
          documents,
          preferredAppointment,
        });
        return Response.json(result);
      }

      case "finalize": {
        const { sessionId } = body;
        const result = await finalizeSubmission(sessionId);
        return Response.json(result);
      }

      default:
        return new Response("Invalid action", { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browser session failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
