/**
 * Activity log for development and debugging.
 */
export default function ActivityLog({ log }) {
  return (
    <div>
      <div className="section-header">
        <span className="section-header__title">Aktivitet</span>
      </div>
      <div className="log-section">
        {log.length === 0 ? (
          <div className="log-line" style={{ opacity: 0.5 }}>
            -- ingen aktivitet --
          </div>
        ) : (
          log.map((entry, index) => (
            <div key={index} className="log-line">
              {entry}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
