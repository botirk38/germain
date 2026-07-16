import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { VisaSelector } from "@/components/pages/visas/selector";
import { hasUserDocument } from "@/lib/db/queries";
import { enabledVisaOptions } from "@/lib/db/visa-selection";

export default async function VisasPage() {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const hasPassport = await hasUserDocument({ clerkUserId: userId, clerkOrgId: orgId }, "passport");
  if (!hasPassport) {
    redirect("/onboarding");
  }

  return <VisaSelector options={enabledVisaOptions} />;
}
