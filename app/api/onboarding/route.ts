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

  await recordUserDocument({ clerkUserId: userId, clerkOrgId: orgId }, {
    documentType: "passport",
    originalFilename: parsed.data.passportOriginalFilename,
  });

  return Response.json({ nextUrl: "/visas" });
}
