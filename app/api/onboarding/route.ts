import { auth } from "@clerk/nextjs/server";
import { onboardingSchema } from "@/lib/db/onboarding";
import { createVisaCaseFromOnboarding } from "@/lib/db/queries";

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

  const projection = await createVisaCaseFromOnboarding(
    { clerkUserId: userId, clerkOrgId: orgId },
    { ...parsed.data, rawIntake: parsed.data },
  );

  if (!projection) {
    return Response.json({ error: "Could not create visa case" }, { status: 500 });
  }

  return Response.json({ visaCaseId: projection.visaCase.id });
}
