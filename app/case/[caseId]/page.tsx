import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { CaseComposer } from "@/components/pages/case/composer";
import { CaseConversation } from "@/components/pages/case/conversation";
import { CaseHeader } from "@/components/pages/case/header";
import { CasePageProvider } from "@/components/pages/case/provider";
import { CaseSidebar } from "@/components/pages/case/sidebar";
import { getVisaCaseView } from "@/lib/db/queries";

export default async function VisaCasePage({ params }: { readonly params: Promise<{ readonly caseId: string }> }) {
  const { caseId } = await params;
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const caseView = await getVisaCaseView({
    clerkUserId: userId,
    clerkOrgId: orgId,
    visaCaseId: caseId,
  });

  if (!caseView) {
    notFound();
  }

  return (
    <CasePageProvider caseId={caseId} initialCaseView={caseView}>
      <div className="flex h-dvh overflow-hidden">
        <CaseSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <CaseHeader />
          <CaseConversation />
          <CaseComposer />
        </main>
      </div>
    </CasePageProvider>
  );
}
