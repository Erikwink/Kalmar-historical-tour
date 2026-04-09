import Fab from "./Fab";
import SessionCard from "./SessionCard";

/**
 * Session and headset controls using the controller-style card and action layout.
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
    <div className="client-control-panel">
      <div className="session-info-card">
        <SessionCard label="Session code">
          <input
            type="text"
            value={sessionId}
            maxLength={6}
            inputMode="numeric"
            pattern="\d*"
            placeholder="123456"
            onChange={(event) => setSessionId(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </SessionCard>

        <SessionCard label="Headset label">
          <input
            type="text"
            value={headsetLabel}
            maxLength={20}
            placeholder="Quest Pro"
            onChange={(event) => setHeadsetLabel(event.target.value)}
          />
        </SessionCard>
      </div>

      <div className="client-action-row">
        <Fab onClick={onAddHeadset} disabled={!sessionId || sessionId.length < 6}>
          Connect headset
        </Fab>
        <Fab variant="seccondary" onClick={onRemoveHeadset} disabled={!activeSessionId}>
          Remove headset
        </Fab>
      </div>

      <Fab onClick={onToggleReady} disabled={!activeSessionId}>
          {isReady ? "Mark as not ready" : "I am ready"}
      </Fab>
      <Fab
          variant="seccondary"
          href={activeSessionId ? xrSceneUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!activeSessionId}
        >
          Open WebXR scene
      </Fab>
    </div>
  );
}
