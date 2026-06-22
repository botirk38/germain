const items = [
  ["◈", "End-to-end encryption", "Documents are encrypted in transit and at rest. We never share your data with third parties."],
  ["◎", "You approve every action", "Nothing is submitted without your explicit approval. You see every field before it goes to the consulate."],
  ["▣", "Auto-delete after decision", "Once your visa is decided, documents are permanently deleted within 30 days. No lingering copies."],
] as const;

export function TrustSecurity() {
  return (
    <section className="alt" id="trust">
      <div className="wrap">
        <div className="sec-kicker">BUILT FOR TRUST</div>
        <h2>Your documents are safe with us.</h2>
        <p className="sec-sub">Visa documents are sensitive. We treat them that way.</p>
        <div className="trust-grid">
          {items.map(([icon, title, description]) => (
            <div key={title} className="trust-item">
              <div className="trust-icon">{icon}</div>
              <div>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
