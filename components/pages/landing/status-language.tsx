export function StatusLanguage() {
  return (
    <section id="status">
      <div className="wrap">
        <div className="sec-kicker">ALWAYS INFORMED</div>
        <h2>No ambiguity. Ever.</h2>
        <p className="sec-sub">Every document and every step carries one of six plain words — with a mark, so color is never the only signal. No jargon, no guessing.</p>
        <div className="vocab">
          <span className="g">● Verified</span>
          <span className="a">▲ Check this</span>
          <span className="p">✕ Problem</span>
          <span className="m">— Missing</span>
          <span className="rcv">○ Received</span>
          <span style={{ color: "var(--ink-3)" }}>Waiting</span>
        </div>
        <p className="vocab-note">When something needs you, a single &ldquo;Action needed&rdquo; lamp comes on — and goes off the moment it&rsquo;s resolved. Nothing blinks, nothing nags, nothing gets lost in email.</p>
      </div>
    </section>
  );
}
