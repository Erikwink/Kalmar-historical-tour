/**
 * Activity log component showing headset actions and status updates
 */
function ActivityLog({ log }) {
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
          log.map((l, i) => (
            <div key={i} className="log-line">
              {l}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityLog;
