// Dark instrument inset (.tk): staggered teletype lines, optional runway
// animation, optional bold sage final line.
export function MachinePanel({
  lines,
  final,
  showRunway,
}: {
  lines: string[];
  final?: string;
  showRunway?: boolean;
}) {
  return (
    <div className="tk">
      {lines.map((line, i) => (
        <div
          key={i}
          className="tk-line"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          {line}
        </div>
      ))}
      {showRunway ? (
        <div className="runway">
          <span className="rw-plane">✈</span>
        </div>
      ) : null}
      {final ? (
        <div
          className="tk-final"
          style={{ animationDelay: `${lines.length * 120}ms` }}
        >
          {final}
        </div>
      ) : null}
    </div>
  );
}
