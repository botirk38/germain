import { SignIn } from "@clerk/nextjs";
import { MonogramLogo } from "@/components/attache/MonogramLogo";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bone px-4">
      <div className="mb-6 flex flex-col items-center gap-3">
        <MonogramLogo size={48} title="Attache" />
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink2">
          WELCOME BACK
        </p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: "font-sans",
            card: "shadow-card",
          },
        }}
      />
    </div>
  );
}
