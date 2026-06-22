import type { Metadata } from "next";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { HeroMock } from "@/components/landing/HeroMock";

export const metadata: Metadata = {
  title: "Attache — stop losing weeks to visa paperwork",
  description:
    "Attache is an AI visa agent that checks your documents, fills the official application, and books your embassy appointment. From upload to decision in days, not weeks.",
};

export default function Home() {
  return (
    <div className="landing">
      {/* ================= NAV ================= */}
      <header className="nav">
        <div className="wrap">
          <a className="lockup" href="#top">
            <MonogramLogo size={34} className="mark" />
            <span className="wm">ATTACHE</span>
          </a>
          <nav>
            <a className="link" href="#how">
              How it works
            </a>
            <a className="link" href="#trust">
              Security
            </a>
            <Show when="signed-in">
              <Link className="key" href="/onboarding">
                Open the console
              </Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button type="button" className="link">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className="key">
                  Start free
                </button>
              </SignUpButton>
            </Show>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="hero" id="top">
        <div className="wrap">
          <div className="hero-copy">
            <div className="kicker">AI VISA AGENT</div>
            <h1>Stop losing weeks to visa paperwork.</h1>
            <p className="sub">
              Upload your documents. Attache checks them against the consulate&rsquo;s
              requirements, fills the official application, and books your embassy
              slot — then monitors until there&rsquo;s a decision. You get plain-language
              updates at every step.
            </p>
            <div className="cta">
              <Show when="signed-in">
                <Link className="key" href="/onboarding">
                  Open the console
                </Link>
              </Show>
              <Show when="signed-out">
                <Link className="key" href="/sign-up">
                  Start your application free
                </Link>
              </Show>
              <a className="quiet" href="#how">
                See how it works
              </a>
            </div>
            <div className="hero-note">
              DEMO CASE · TUNIS → BERLIN · TOURIST VISA (SCHENGEN)
            </div>
          </div>

          <HeroMock />
        </div>
      </section>

      {/* ================= SOCIAL PROOF ================= */}
      <section style={{ padding: 0 }}>
        <div className="wrap">
          <div className="trust-bar">
            <div className="trust-stat">
              <div className="num">94%</div>
              <div className="label">APPROVAL RATE</div>
            </div>
            <div className="trust-stat">
              <div className="num">12</div>
              <div className="label">COUNTRIES SUPPORTED</div>
            </div>
            <div className="trust-stat">
              <div className="num">3 min</div>
              <div className="label">AVERAGE SETUP TIME</div>
            </div>
            <div className="trust-stat">
              <div className="num">24/7</div>
              <div className="label">CONSULATE MONITORING</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="alt" id="how">
        <div className="wrap">
          <div className="sec-kicker">HOW IT WORKS</div>
          <h2>Three headaches. Gone.</h2>
          <p className="sec-sub">
            Visa applications fail because of one missed requirement, one typo,
            or one full appointment calendar. Attache handles all three — and
            explains every step in plain words.
          </p>

          <div className="steps">
            <div className="step">
              <div className="num">01</div>
              <h3>Catches problems before the consulate does</h3>
              <p>
                Every document is checked against the consulate&rsquo;s official
                checklist. Problems come with the reason, the fix, and how it
                affects your approval odds.
              </p>
              <div className="demo demo-review">
                <div className="r">
                  <span>Photo</span>
                  <s />
                  <span className="g">● Verified</span>
                </div>
                <div className="r">
                  <span>Passport</span>
                  <s />
                  <span className="p">✕ Problem</span>
                </div>
                <div className="why">
                  Expires 2 Nov 2026 — it&rsquo;s 43 days short of the 6-month
                  requirement. Renew before submitting.
                </div>
              </div>
            </div>
            <div className="step">
              <div className="num">02</div>
              <h3>Fills the form so you don&rsquo;t have to</h3>
              <p>
                The official portal form is filled field by field. You see exactly
                what was entered and approve before submission.
              </p>
              <div className="demo demo-machine">
                <div>
                  Name: Mohamed Atoui{" "}
                  <span style={{ color: "var(--sage)" }}>✓</span>
                </div>
                <div>
                  Insurance: AXA AX-99214{" "}
                  <span style={{ color: "var(--sage)" }}>✓</span>
                </div>
                <div className="done">Application submitted</div>
                <div className="bar">
                  <i />
                </div>
              </div>
            </div>
            <div className="step">
              <div className="num">03</div>
              <h3>Gets you the first available slot</h3>
              <p>
                Embassy calendars fill up fast. Attache checks every two weeks,
                takes the first open slot, and puts it on your calendar
                automatically.
              </p>
              <div className="demo demo-slot">
                <div className="box">
                  <b>● Appointment found</b> — Thu 3 Jul, 09:40
                  <br />
                  German Embassy, Tunis
                </div>
                <div className="cal">
                  <i>▦</i>Added to Google Calendar
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATUS LANGUAGE ================= */}
      <section id="status">
        <div className="wrap">
          <div className="sec-kicker">ALWAYS INFORMED</div>
          <h2>No ambiguity. Ever.</h2>
          <p className="sec-sub">
            Every document and every step carries one of six plain words —
            with a mark, so color is never the only signal. No jargon, no
            guessing.
          </p>
          <div className="vocab">
            <span className="g">● Verified</span>
            <span className="a">▲ Check this</span>
            <span className="p">✕ Problem</span>
            <span className="m">— Missing</span>
            <span className="rcv">○ Received</span>
            <span style={{ color: "var(--ink-3)" }}>Waiting</span>
          </div>
          <p className="vocab-note">
            When something needs you, a single &ldquo;Action needed&rdquo; lamp
            comes on — and goes off the moment it&rsquo;s resolved. Nothing
            blinks, nothing nags, nothing gets lost in email.
          </p>
        </div>
      </section>

      {/* ================= TRUST & SECURITY ================= */}
      <section className="alt" id="trust">
        <div className="wrap">
          <div className="sec-kicker">BUILT FOR TRUST</div>
          <h2>Your documents are safe with us.</h2>
          <p className="sec-sub">
            Visa documents are sensitive. We treat them that way.
          </p>
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">◈</div>
              <div>
                <h4>End-to-end encryption</h4>
                <p>
                  Documents are encrypted in transit and at rest. We never share
                  your data with third parties.
                </p>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">◎</div>
              <div>
                <h4>You approve every action</h4>
                <p>
                  Nothing is submitted without your explicit approval. You see
                  every field before it goes to the consulate.
                </p>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">▣</div>
              <div>
                <h4>Auto-delete after decision</h4>
                <p>
                  Once your visa is decided, documents are permanently deleted
                  within 30 days. No lingering copies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CLOSING ================= */}
      <section className="closing">
        <div className="wrap">
          <MonogramLogo size={64} className="mark" />
          <h2>Your next visa starts here.</h2>
          <p
            className="sec-sub"
            style={{ marginLeft: "auto", marginRight: "auto" }}
          >
            Upload your documents, get your approval odds in 3 minutes, and let
            Attache handle the rest. No credit card required.
          </p>
          <div className="cta">
            <Show when="signed-in">
              <Link className="key" href="/onboarding">
                Open the console
              </Link>
            </Show>
            <Show when="signed-out">
              <Link className="key" href="/sign-up">
                Start your application — it&rsquo;s free
              </Link>
            </Show>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer>
        <div className="wrap">
          <a className="lockup" href="#top">
            <MonogramLogo size={26} />
            <span className="wm" style={{ fontSize: 14 }}>
              ATTACHE
            </span>
          </a>
          <div className="footer-links">
            <a href="#how">How it works</a>
            <a href="#trust">Security</a>
            <a href="#status">Status language</a>
          </div>
          <span className="fineprint">ATTACHE · AI VISA AGENT · MADE FOR TRAVELERS</span>
        </div>
      </footer>
    </div>
  );
}
