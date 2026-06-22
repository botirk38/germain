// Master-caution style annunciator: dim until something needs the user,
// then amber + pulsing via the .mcaution.on rule.
export function CautionLamp({ on }: { on: boolean }) {
  return (
    <div className={on ? "mcaution on" : "mcaution"}>
      <span className="sq" />
      ACTION NEEDED
    </div>
  );
}
