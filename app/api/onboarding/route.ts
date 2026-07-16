import { auth } from "@clerk/nextjs/server";
import { onboardingSchema } from "@/lib/db/onboarding";
import { recordUserDocument } from "@/lib/db/queries";

export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid onboarding data", issues: parsed.error.issues }, { status: 400 });
  }
  if (!parsed.data.passportStorageKey) {
    return Response.json({ error: "Passport upload is required" }, { status: 400 });
  }

  try {
    await recordUserDocument({ clerkUserId: userId, clerkOrgId: orgId }, {
      documentType: "passport",
      originalFilename: parsed.data.passportOriginalFilename,
      storageKey: parsed.data.passportStorageKey,
    });
  } catch (cause) {
    return Response.json(
      { error: cause instanceof Error ? cause.message : "Could not save passport record" },
      { status: 400 },
    );
  }

  return Response.json({ nextUrl: "/visas" });
}
