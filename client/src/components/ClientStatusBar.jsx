/**
 * Compact status bar summarizing headset session state.
 */
export default function ClientStatusBar({ activeSessionId, isReady, sessionEnded }) {
  let variant = "ok";
  let title = activeSessionId ? "Headset connected" : "Awaiting session";
  let detail = activeSessionId ? (isReady ? "Ready for XR" : "Connected but not ready") : "Enter a session code to join";

  if (sessionEnded) {
    variant = "warning";
    title = "Session ended";
    detail = "The guide closed the room. Join a new session to continue.";
  } else if (activeSessionId && !isReady) {
    variant = "warning";
  }

  return (
    <div className="card headset-status-bar-wrapper">
      <div className={`headset-status-bar headset-status-bar--${variant}`}>
        <span className="ms headset-status-bar__icon" aria-hidden="true">
          headset_mic
        </span>
        <span className="headset-status-bar__text">
          <strong>{title}</strong>
          <span className="headset-status-bar__detail">{detail}</span>
        </span>
        {variant === "warning" ? (
          <span className="ms headset-status-bar__warning" aria-hidden="true">
            warning
          </span>
        ) : null}
      </div>
    </div>
  );
}
