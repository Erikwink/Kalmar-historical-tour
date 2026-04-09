/**
 * Summary card showing the current tour, session, and active controls.
 */
export default function SessionSummaryCard({ sessionId, headsetId, activeTourTitle, activeSceneDisplay, activeControlsDisplay }) {
  return (
    <div className="card card--elevated tour-info-card">
      <div className="tour-info-card__header">
        <div className="tour-info-card__eyebrow">Current XR context</div>
      </div>
      <div className="tour-info-grid">
        <div className="tour-info-card__item">
          <span className="tour-info-card__label">Session</span>
          <span className="tour-info-card__value">{sessionId || "Not joined"}</span>
        </div>
        <div className="tour-info-card__item">
          <span className="tour-info-card__label">Headset ID</span>
          <span className="tour-info-card__value tour-info-card__value--mono">{headsetId}</span>
        </div>
        <div className="tour-info-card__item">
          <span className="tour-info-card__label">Tour</span>
          <span className="tour-info-card__value">{activeTourTitle}</span>
        </div>
        <div className="tour-info-card__item">
          <span className="tour-info-card__label">Active controls</span>
          <span className="tour-info-card__value">{activeControlsDisplay}</span>
        </div>
      </div>
      <div className="tour-info-section">
        <p className="tour-info-section__description">{activeSceneDisplay}</p>
      </div>
    </div>
  );
}
