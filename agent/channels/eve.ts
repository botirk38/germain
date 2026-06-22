import { createClerkClient } from "@clerk/backend";
import { eveChannel } from "eve/channels/eve";
import { localDev, UnauthenticatedError, type AuthFn } from "eve/channels/auth";
import type { SessionAuthContext } from "eve/context";

const MAX_TURNS_PER_MINUTE = 30;
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 1000;
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((timestamp) => timestamp > windowStart);

  if (recent.length >= MAX_TURNS_PER_MINUTE) {
    return true;
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return false;
}

function clerkAuth(): AuthFn<Request> {
  return async (request) => {
    const requestUrl = new URL(request.url);
    const hostname = requestUrl.hostname;
    const isLoopback =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1";

    if (isLoopback) {
      return null; // fall through to localDev if configured
    }

    const requestState = await clerkClient.authenticateRequest(request, {
      acceptsToken: "session_token",
    });

    if (!requestState.isAuthenticated) {
      return null;
    }

    const auth = requestState.toAuth();
    if (!auth.isAuthenticated || !auth.userId) {
      return null;
    }

    if (isRateLimited(auth.userId)) {
      throw new UnauthenticatedError({
        code: "rate_limited",
        message: "Too many messages. Please wait a moment.",
      });
    }

    const attributes: SessionAuthContext["attributes"] = {
      userId: auth.userId,
      ...(auth.orgId ? { orgId: auth.orgId } : {}),
      ...(auth.orgRole ? { orgRole: auth.orgRole } : {}),
    };

    return {
      attributes,
      authenticator: "clerk",
      principalId: auth.userId,
      principalType: "user",
    } satisfies SessionAuthContext;
  };
}

export default eveChannel({
  auth:
    process.env.NODE_ENV === "production"
      ? [clerkAuth()]
      : [clerkAuth(), localDev()],
});
