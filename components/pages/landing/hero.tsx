import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { HeroMock } from "@/components/pages/landing/hero-mock";

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap">
        <div className="hero-copy">
          <div className="kicker">AI VISA AGENT</div>
          <h1>Stop losing weeks to visa paperwork.</h1>
          <p className="sub">
            Upload your documents. Attache checks them against the consulate&rsquo;s requirements, fills the official application, and books your embassy slot — then monitors until there&rsquo;s a decision. You get plain-language updates at every step.
          </p>
          <div className="cta">
            <Show when="signed-in">
              <Link className="key" href="/onboarding">Open the console</Link>
            </Show>
            <Show when="signed-out">
              <Link className="key" href="/sign-up">Start your application free</Link>
            </Show>
            <a className="quiet" href="#how">See how it works</a>
          </div>
          <div className="hero-note">DEMO CASE · TUNIS → BERLIN · TOURIST VISA (SCHENGEN)</div>
        </div>
        <HeroMock />
      </div>
    </section>
  );
}
