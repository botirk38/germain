import { auth } from "@clerk/nextjs/server";
import { searchEmails } from "@/lib/gmail/client";
import { classifyEmails, buildGmailQuery } from "@/lib/gmail/email-parser";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rateCheck = checkRateLimit(`gmail:${userId}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck);
  }

  const body = await req.json();
  const { accessToken, referenceNumber } = body;

  if (!accessToken) {
    return Response.json(
      { error: "Gmail access token required. Connect your Gmail account." },
      { status: 400 }
    );
  }

  try {
    const query = buildGmailQuery(referenceNumber);
    const emails = await searchEmails(accessToken, query);
    const classified = classifyEmails(emails, referenceNumber);

    return Response.json({
      emails: classified,
      query,
      count: classified.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail query failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
