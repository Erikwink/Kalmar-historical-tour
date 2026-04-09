import SessionCard from "./SessionCard";

/**
 * Summary card showing the current XR context using the same info-card pattern as the controller.
 */
export default function SessionSummaryCard({
  sessionId,
  headsetId,
  activeTourTitle,
  activeSceneDisplay,
  activeControlsDisplay,
}) {
  return (
    <div className="tour-info-card">
      <div className="session-info-card">
        <SessionCard label="Session">
          <div className="session-card__sessionId">{sessionId || "------"}</div>
        </SessionCard>
        <SessionCard label="Tour">
          <div className="session-card__meta">{activeTourTitle}</div>
        </SessionCard>
        <SessionCard label="Headset ID">
          <div className="session-card__meta session-card__meta--mono">{headsetId}</div>
        </SessionCard>
        <SessionCard label="Active controls">
          <div className="session-card__meta">{activeControlsDisplay}</div>
        </SessionCard>
      </div>

      <div className="tour-info-section">
        <p className="tour-info-section__description">{activeSceneDisplay}</p>
      </div>
    </div>
  );
}
