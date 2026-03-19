// client/src/App.jsx
import { useState, useEffect } from "react";
import { join, leave, onSceneChange, ready } from "../../saas-adapter/src/index"

/**
 * Root application component for the VR headset client.
 * Handles joining/leaving sessions and subscribing to scene changes.
 *
 * @component
 * @returns {JSX.Element}
 */
const SESSION_STORAGE_KEY = "headset_client_id";
const SESSION_ID_KEY = "headset_session_id";
const ACTIVE_SESSION_KEY = "headset_active_session_id";
const LABEL_KEY = "headset_label";
const DEFAULT_SCENE_ID = "waiting";

function normalizeSessionId(raw) {
  return (raw || "").replace(/\D/g, "").slice(0, 6);
}

/**
 * Returns a stable unique client ID for this headset.
 * Reuses the ID from sessionStorage if it exists, otherwise generates a new one.
 * @returns {string} A unique client ID.
 */
function getOrCreateHeadsetId() {
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const newId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
  return newId;
}

function App() {
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem(SESSION_ID_KEY) ?? "");
  const [headsetLabel, setHeadsetLabel] = useState(() => sessionStorage.getItem(LABEL_KEY) ?? "");
  const [activeSessionId, setActiveSessionId] = useState(() => sessionStorage.getItem(ACTIVE_SESSION_KEY) ?? "");
  const [log, setLog] = useState([]);
  const [isReady, setIsReady] = useState(false)
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_SCENE_ID);

  const xrSceneUrl = activeSessionId ? `${window.location.origin}/webxr.html?session=${activeSessionId}` : "";

  // Stable client ID — generated once and persisted in sessionStorage.
  const [headsetId] = useState(() => getOrCreateHeadsetId());

  // Keep sessionStorage in sync with state.
  useEffect(() => { sessionStorage.setItem(SESSION_ID_KEY, sessionId); }, [sessionId]);
  useEffect(() => { sessionStorage.setItem(LABEL_KEY, headsetLabel); }, [headsetLabel]);
  useEffect(() => { sessionStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId); }, [activeSessionId]);

  /**
   * Appends a message to the activity log.
   * @param {string} msg - The message to append.
   */
  const appendLog = (msg) => setLog((l) => [...l, msg]);

  // Re-join automatically on reload if we were already in a session.
  useEffect(() => {
    if (!activeSessionId) return;
    join(activeSessionId, headsetId, headsetLabel || headsetId)
      .then(() => appendLog("Återansluten till session."))
      .catch((e) => appendLog("Fel vid återanslutning: " + e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — only runs on mount

  // Subscribe to scene changes when an active session exists.
  useEffect(() => {
    if (!activeSessionId) return;
    const unsubscribe = onSceneChange(activeSessionId, (sceneId) => {
      const effectiveSceneId = typeof sceneId === "string" && sceneId.trim() ? sceneId.trim() : DEFAULT_SCENE_ID;
      setActiveSceneId(effectiveSceneId);
      appendLog(`Scen ändrad: ${effectiveSceneId}`);
    });
    return unsubscribe;
  }, [activeSessionId]);

  /**
   * Joins the session using the stable headset ID and the user-provided label.
   * @returns {Promise<void>}
   */
  const handleAddHeadset = async () => {
    const normalizedSessionId = normalizeSessionId(sessionId);
    if (!normalizedSessionId) {
      appendLog("Skapa session först.");
      return;
    }
    try {
      setSessionId(normalizedSessionId);
      await join(normalizedSessionId, headsetId, headsetLabel || headsetId);
      setActiveSessionId(normalizedSessionId);
      appendLog(`Headset ansluten till session ${normalizedSessionId}.`);
    } catch (e) {
      appendLog("Fel vid headset: " + e.message);
    }
  };

  /**
   * Toggles the headset ready state and syncs it to Firebase.
   * @returns {Promise<void>}
   */
  const handleToggleReady = async () => {
    try {
      await ready(activeSessionId, headsetId, !isReady);
      setIsReady(!isReady);
      appendLog(!isReady ? "Headset är nu redo." : "Headset är inte längre redo.");
    } catch (e) {
      appendLog("Fel vid ready: " + e.message);
    }
  };

  /**
   * Removes the headset from the current session.
   * @returns {Promise<void>}
   */
  const handleRemoveHeadset = async () => {
    if (!activeSessionId) {
      appendLog("Anslut till session först.");
      return;
    }
    try {
      await leave(activeSessionId, headsetId);
      setActiveSessionId("");
      setSessionId("");
      appendLog("Headset har lämnat sessionen.");
    } catch (e) {
      appendLog("Fel vid headset: " + e.message);
    }
  };

  return (
    <div className="page">
      <div className="top-app-bar top-app-bar--medium">
        <h1 className="top-app-bar__title">Kalmar Historical Tour</h1>
      </div>

      <div className="page-content">
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
                onChange={(e) => setSessionId(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            <div className="form-group">
              <label>Aktiv scen</label>
              <input
                type="text"
                value={activeSceneId}
                readOnly
              />
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
              <button onClick={handleAddHeadset} disabled={!sessionId || sessionId.length < 6}>
                Lägg till headset
              </button>
              <button onClick={handleRemoveHeadset} disabled={!activeSessionId}>
                Ta bort headset
              </button>
            </div>
            <button onClick={handleToggleReady} disabled={!activeSessionId} style={{ marginTop: '8px', width: '100%' }}>
              {isReady ? "Inte redo" : "Jag är redo"}
            </button>
            {activeSessionId ? (
              <a
                href={xrSceneUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", marginTop: "10px" }}
              >
                Öppna WebXR-scenen för sessionen
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <div className="section-header">
            <span className="section-header__title">Aktivitet</span>
          </div>
          <div className="log-section">
            {log.length === 0 ? (
              <div className="log-line" style={{ opacity: 0.5 }}>-- ingen aktivitet --</div>
            ) : (
              log.map((l, i) => (
                <div key={i} className="log-line">{l}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
