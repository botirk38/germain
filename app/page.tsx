import type { Metadata } from "next";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { HeroMock } from "@/components/landing/HeroMock";

export const metadata: Metadata = {
  title: "Attache — your visa, handled",
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
            <a className="link" href="#status">
              Always informed
            </a>
            <Show when="signed-in">
              <Link className="key" href="/chat">
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
                  Get started
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
            <h1>Your visa, handled.</h1>
            <p className="sub">
              Attache reviews your documents, fills in the official
              application, and books your embassy appointment — then keeps
              checking the consulate until there&rsquo;s a decision.
            </p>
            <div className="cta">
              <Show when="signed-in">
                <Link className="key" href="/chat">
                  Open the console
                </Link>
              </Show>
              <Show when="signed-out">
                <Link className="key" href="/sign-up">
                  Get started
                </Link>
              </Show>
              <a className="quiet" href="#how">
                How it works
              </a>
            </div>
            <div className="hero-note">
              DEMO CASE · TUNIS → BERLIN · TOURIST VISA (SCHENGEN)
            </div>
          </div>

          <HeroMock />
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="alt" id="how">
        <div className="wrap">
          <div className="sec-kicker">HOW IT WORKS</div>
          <h2>Three jobs, handled end to end.</h2>
          <p className="sec-sub">
            You upload what you have. Attache does the rest — and explains
            every step in plain words.
          </p>

          <div className="steps">
            <div className="step">
              <div className="num">01</div>
              <h3>Checks every document</h3>
              <p>
                Each file is checked against the consulate&rsquo;s official
                checklist. Problems come with the reason and the fix.
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
                  Expires 2 Nov 2026 — it&rsquo;s 43 days short. Renew before
                  submitting.
                </div>
              </div>
            </div>
            <div className="step">
              <div className="num">02</div>
              <h3>Files the application</h3>
              <p>
                It fills in the official portal form field by field, and shows
                you exactly what it entered.
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
              <h3>Books your appointment</h3>
              <p>
                It checks the consulate every two weeks, takes the first open
                slot, and puts it on your calendar.
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
          <h2>You always know where you stand.</h2>
          <p className="sec-sub">
            Every document and every step carries one of six plain words —
            with a mark, so color is never the only signal.
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
            blinks, nothing nags.
          </p>
        </div>
      </section>

      {/* ================= CLOSING ================= */}
      <section className="closing">
        <div className="wrap">
          <MonogramLogo size={64} className="mark" />
          <h2>See it handle a real case.</h2>
          <p
            className="sec-sub"
            style={{ marginLeft: "auto", marginRight: "auto" }}
          >
            A 25-second playback: five documents in, one problem caught,
            application filed, appointment booked.
          </p>
          <div className="cta">
            <Show when="signed-in">
              <Link className="key" href="/chat">
                Open the console
              </Link>
            </Show>
            <Show when="signed-out">
              <Link className="key" href="/sign-up">
                Get started
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
          <span className="fineprint">ATTACHE · AI VISA AGENT</span>
        </div>
      </footer>
    </div>
  );
}
