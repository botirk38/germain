import { SignUp } from "@clerk/nextjs";
import { MonogramLogo } from "@/components/attache/MonogramLogo";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bone px-4">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <MonogramLogo size={48} title="Attache" />
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink2">
          YOUR VISA JOURNEY STARTS HERE
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 text-left text-[13px] text-ink2">
          <li className="flex items-center gap-2">
            <span className="text-sage">●</span> Document verification in seconds
          </li>
          <li className="flex items-center gap-2">
            <span className="text-sage">●</span> Official form filled automatically
          </li>
          <li className="flex items-center gap-2">
            <span className="text-sage">●</span> Embassy appointment booked for you
          </li>
        </ul>
      </div>
      <SignUp
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
