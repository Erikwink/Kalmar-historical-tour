/**
 * Session and headset controls card for the headset client.
 */
export default function HeadsetForm({
  sessionId,
  setSessionId,
  headsetLabel,
  setHeadsetLabel,
  onAddHeadset,
  onRemoveHeadset,
  onToggleReady,
  isReady,
  activeSessionId,
  xrSceneUrl,
}) {
  return (
    <div className="card card--elevated form-card">
      <div className="form-grid">
        <div className="form-group">
          <label>Session code</label>
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
          <label>Headset label</label>
          <input
            type="text"
            value={headsetLabel}
            maxLength={20}
            placeholder="Quest Pro"
            onChange={(event) => setHeadsetLabel(event.target.value)}
          />
        </div>
      </div>

      <div className="button-row">
        <button onClick={onAddHeadset} disabled={!sessionId || sessionId.length < 6}>
          Connect headset
        </button>
        <button className="button--secondary" onClick={onRemoveHeadset} disabled={!activeSessionId}>
          Remove headset
        </button>
      </div>

      <div className="button-stack">
        <button onClick={onToggleReady} disabled={!activeSessionId}>
          {isReady ? "Mark as not ready" : "I am ready"}
        </button>
        <a
          className={`action-link${activeSessionId ? "" : " action-link--disabled"}`}
          href={activeSessionId ? xrSceneUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!activeSessionId}
          onClick={(event) => {
            if (!activeSessionId) {
              event.preventDefault();
            }
          }}
        >
          Open WebXR scene
        </a>
      </div>
    </div>
  );
}
