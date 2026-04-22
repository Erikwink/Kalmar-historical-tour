import "./HeadsetForm.css";

/**
 * Minimal development-style headset connection modal.
 */
function HeadsetForm({ sessionId, setSessionId, onAddHeadset, activeSessionId }) {
  return (
    <div className="modal-card">
      <div className="modal-header">
        <h2>Enter session code to connect</h2>
        {activeSessionId ? <p>Headset anslutet till session {activeSessionId}</p> : null}
      </div>

      <div className="form-group">
        <input
          type="text"
          value={sessionId}
          maxLength={6}
          inputMode="numeric"
          pattern="\d*"
          onChange={(event) => setSessionId(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <button onClick={onAddHeadset} disabled={!sessionId || sessionId.length < 6}>
          OK
        </button>
      </div>
    </div>
  );
}

export default HeadsetForm;
