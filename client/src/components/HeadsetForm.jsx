/**
 * Form for entering session ID and headset label
 */
/* function HeadsetForm({
  sessionId,
  setSessionId,
  headsetLabel,
  setHeadsetLabel,
  activeSceneId,
  onAddHeadset,
  onRemoveHeadset,
  onToggleReady,
  isReady,
  activeSessionId
}) {
  return (
    <div className="card">
      <div style={{ padding: '20px' }}>
        <div className="form-group">
          <label>Sessionskod (6 siffror)</label>
          <input
            type="text"
            value={sessionId}
            maxLength={6}
            inputMode="numeric"
            pattern="\d*"
            onChange={(e) =>
              setSessionId(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
        </div>

        <div className="form-group">
          <label>Aktiv scen</label>
          <input type="text" value={activeSceneId} readOnly />
        </div>

        <div className="form-group">
          <label>Headset‑id/namn</label>
          <input
            type="text"
            value={headsetLabel}
            maxLength={20}
            onChange={(e) => setHeadsetLabel(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={onAddHeadset}
            disabled={!sessionId || sessionId.length < 6}
          >
            Lägg till headset
          </button>
          <button onClick={onRemoveHeadset} disabled={!activeSessionId}>
            Ta bort headset
          </button>
        </div>

        <button
          onClick={onToggleReady}
          disabled={!activeSessionId}
          style={{ marginTop: '8px', width: '100%' }}
        >
          {isReady ? "Inte redo" : "Jag är redo"}
        </button>
      </div>
    </div>
  );
}

export default HeadsetForm; */
import './HeadsetForm.css';
function HeadsetForm({
  sessionId,
  setSessionId,
  headsetLabel,
  setHeadsetLabel,
  onAddHeadset,
  activeSessionId,
  statusText
}) {
  const headerText = activeSessionId ? "Headset-information" : "Väntar på headset";
  const status = statusText || (activeSessionId ? "Headset anslutet" : "Ingen session aktiv");

  return (
    <div className="modal-card">
      <div className="modal-header">
        <h2>Enter session code to connect</h2>
      </div>

      <div className="form-group">
        <input
          type="text"
          value={sessionId}
          maxLength={6}
          inputMode="numeric"
          pattern="\d*"
          onChange={(e) =>
            setSessionId(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
        <button
          onClick={onAddHeadset}
          disabled={!sessionId || sessionId.length < 6}
        >
          OK
        </button>
      </div>

      {/* Om du vill ha headsetLabel, lägg till här, men det var inte i prompten */}
    </div>
  );
}

export default HeadsetForm;