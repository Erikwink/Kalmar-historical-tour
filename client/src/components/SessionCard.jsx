/**
 * A labeled info block used inside the session info layout.
 */
export default function SessionCard({ label, children }) {
  return (
    <div className="session-info-card__code-block card--elevated">
      <div className="session-card__label">{label}</div>
      {children}
    </div>
  );
}
