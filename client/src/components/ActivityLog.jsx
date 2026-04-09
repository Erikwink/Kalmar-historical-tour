/**
 * Development log for local session and headset events.
 */
export default function ActivityLog({ log }) {
  return (
    <div className="card log-card">
      <div className="log-section">
        {log.length === 0 ? (
          <div className="log-line log-line--empty">No activity yet.</div>
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
