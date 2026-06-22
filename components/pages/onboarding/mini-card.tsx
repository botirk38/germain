export function MiniCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="border border-line bg-panel px-3 py-3 shadow-sm">
      <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink2">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
