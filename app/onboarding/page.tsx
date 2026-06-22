import { Form } from "@/components/pages/onboarding/form";
import { Intro } from "@/components/pages/onboarding/intro";

export default function OnboardingPage() {
  return (
    <main className="min-h-dvh bg-paper px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
        <Intro />
        <Form />
      </div>
    </main>
  );
}
