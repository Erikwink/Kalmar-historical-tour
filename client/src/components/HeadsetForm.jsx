/**
 * Form for entering session ID and headset label.
 */
export default function HeadsetForm({
  sessionId,
  setSessionId,
  headsetLabel,
  setHeadsetLabel,
  activeSceneId,
  onAddHeadset,
  onRemoveHeadset,
  onToggleReady,
  isReady,
  activeSessionId,
}) {
  return (
    <div className="card">
      <div style={{ padding: "20px" }}>
        <div className="form-group">
          <label>Sessionskod (6 siffror)</label>
          <input
            type="text"
            value={sessionId}
            maxLength={6}
            inputMode="numeric"
            pattern="\d*"
            placeholder="123456"
            onChange={(event) => setSessionId(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>

        <div className="form-group">
          <label>Aktiv scen</label>
          <input type="text" value={activeSceneId} readOnly />
        </div>

        <div className="form-group">
          <label>Headset-id/namn</label>
          <input
            type="text"
            value={headsetLabel}
            maxLength={20}
            placeholder="Quest Pro"
            onChange={(event) => setHeadsetLabel(event.target.value)}
          />
        </div>

        <div className="headset-form__actions">
          <button className="headset-form__button headset-form__button--primary" onClick={onAddHeadset} disabled={!sessionId || sessionId.length < 6}>
            Lägg till headset
          </button>
          <button className="headset-form__button headset-form__button--secondary" onClick={onRemoveHeadset} disabled={!activeSessionId}>
            Ta bort headset
          </button>
        </div>

        <button
          className="headset-form__button headset-form__button--ready"
          onClick={onToggleReady}
          disabled={!activeSessionId}
        >
          {isReady ? "Inte redo" : "Jag är redo"}
        </button>
      </div>
    </div>
  );
}
