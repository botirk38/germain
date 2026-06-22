import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { MonogramLogo } from "@/components/attache/MonogramLogo";

export function Closing() {
  return (
    <section className="closing">
      <div className="wrap">
        <MonogramLogo size={64} className="mark" />
        <h2>Your next visa starts here.</h2>
        <p className="sec-sub" style={{ marginLeft: "auto", marginRight: "auto" }}>
          Upload your documents, get your approval odds in 3 minutes, and let Attache handle the rest. No credit card required.
        </p>
        <div className="cta">
          <Show when="signed-in">
            <Link className="key" href="/onboarding">Open the console</Link>
          </Show>
          <Show when="signed-out">
            <Link className="key" href="/sign-up">Start your application — it&rsquo;s free</Link>
          </Show>
        </div>
      </div>
    </section>
  );
}
