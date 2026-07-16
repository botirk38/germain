import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Form } from "@/components/pages/onboarding/form";
import { Intro } from "@/components/pages/onboarding/intro";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-dvh bg-paper px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
        <Intro />
        <Form />
      </div>
    </main>
  );
}
