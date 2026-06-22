const stats = [
  ["94%", "APPROVAL RATE"],
  ["12", "COUNTRIES SUPPORTED"],
  ["3 min", "AVERAGE SETUP TIME"],
  ["24/7", "CONSULATE MONITORING"],
] as const;

export function TrustBar() {
  return (
    <section style={{ padding: 0 }}>
      <div className="wrap">
        <div className="trust-bar">
          {stats.map(([value, label]) => (
            <div key={label} className="trust-stat">
              <div className="num">{value}</div>
              <div className="label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
