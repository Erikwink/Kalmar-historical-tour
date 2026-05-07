import "./HeadsetForm.css";

/**
 * Minimal development-style headset connection modal.
 */
function HeadsetForm({
  sessionId,
  setSessionId,
  headsetLabel,
  setHeadsetLabel,
  onAddHeadset,
  activeSessionId,
}) {
  return (
    <div className="modal-card">
      <div className="modal-header">
        <h2>Enter session code to connect</h2>
        {activeSessionId ? <p>Headset anslutet till session {activeSessionId}</p> : null}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder='Sessionskod'
          value={sessionId}
          maxLength={6}
          inputMode="numeric"
          pattern="\d*"
          onChange={(event) => setSessionId(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Headset-namn"
          value={headsetLabel}
          maxLength={20}
          onChange={(event) => setHeadsetLabel(event.target.value)}
        />
      </div>

      <button onClick={onAddHeadset} disabled={!sessionId || sessionId.length < 6 || !headsetLabel}>
        OK
      </button>
    </div>
  );
}

export default HeadsetForm;
