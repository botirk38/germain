export function Workflow() {
  return (
    <section className="alt" id="how">
      <div className="wrap">
        <div className="sec-kicker">HOW IT WORKS</div>
        <h2>Three headaches. Gone.</h2>
        <p className="sec-sub">Visa applications fail because of one missed requirement, one typo, or one full appointment calendar. Attache handles all three — and explains every step in plain words.</p>
        <div className="steps">
          <div className="step">
            <div className="num">01</div>
            <h3>Catches problems before the consulate does</h3>
            <p>Every document is checked against the consulate&rsquo;s official checklist. Problems come with the reason, the fix, and how it affects your approval odds.</p>
            <div className="demo demo-review">
              <div className="r"><span>Photo</span><s /><span className="g">● Verified</span></div>
              <div className="r"><span>Passport</span><s /><span className="p">✕ Problem</span></div>
              <div className="why">Expires 2 Nov 2026 — it&rsquo;s 43 days short of the 6-month requirement. Renew before submitting.</div>
            </div>
          </div>
          <div className="step">
            <div className="num">02</div>
            <h3>Fills the form so you don&rsquo;t have to</h3>
            <p>The official portal form is filled field by field. You see exactly what was entered and approve before submission.</p>
            <div className="demo demo-machine">
              <div>Name: Mohamed Atoui <span style={{ color: "var(--sage)" }}>✓</span></div>
              <div>Insurance: AXA AX-99214 <span style={{ color: "var(--sage)" }}>✓</span></div>
              <div className="done">Application submitted</div>
              <div className="bar"><i /></div>
            </div>
          </div>
          <div className="step">
            <div className="num">03</div>
            <h3>Gets you the first available slot</h3>
            <p>Embassy calendars fill up fast. Attache checks every two weeks, takes the first open slot, and puts it on your calendar automatically.</p>
            <div className="demo demo-slot">
              <div className="box"><b>● Appointment found</b> — Thu 3 Jul, 09:40<br />German Embassy, Tunis</div>
              <div className="cal"><i>▦</i>Added to Google Calendar</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
