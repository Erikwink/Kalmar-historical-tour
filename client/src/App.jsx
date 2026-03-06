// client/src/App.jsx
import { useState, useEffect } from "react";
import { join, leave, onSceneChange, ready } from "../../saas-adapter/src/index"

function App() {
  const [sessionId, setSessionId] = useState("");
  const [headsetId, setHeadsetId] = useState("");
  const [log, setLog] = useState([]);

  const appendLog = (msg) => setLog((l) => [...l, msg]);

  // log scene changes when room publishes a new scene
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = onSceneChange(sessionId, (sceneId) => {
      appendLog(`Scen ändrad: ${sceneId}`);
    });
    return unsubscribe;
  }, [sessionId]);

  const handleAddHeadset = async () => {
    if (!sessionId) {
      appendLog("Skapa session först.");
      return;
    }
    if (!headsetId) {
      appendLog("Ange headset‑id.");
      return;
    }
    try {
      await join(sessionId, headsetId, headsetId);
      appendLog(`Headset ${headsetId} lagts till (offline).`);
    } catch (e) {
      appendLog("Fel vid headset: " + e.message);
    }
  };

  const handleGoOnline = async () => {
    if (!sessionId) {
      appendLog("Skapa session först.");
      return;
    }
    if (!headsetId) {
      appendLog("Ange headset‑id.");
      return;
    }
    try {
      // change status via heartbeat to online
      await ready(sessionId, headsetId, true);
      appendLog(`Headset ${headsetId} är nu redo.`);
    } catch (e) {
      appendLog("Fel vid online‑sättning: " + e.message);
    }
  };

  const handleRemoveHeadset = async () => {
    if (!headsetId) {
      appendLog("Ange headset‑id.");
      return;
    }
    try {
      await leave(sessionId, headsetId);
      appendLog(`Headset ${headsetId} har tagits bort.`);
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
                onChange={(e) => setSessionId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Headset‑id/namn</label>
              <input
                type="text"
                value={headsetId}
                onChange={(e) => setHeadsetId(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={handleAddHeadset} disabled={!sessionId}>
                Lägg till headset
              </button>
              <button onClick={handleRemoveHeadset} disabled={!headsetId}>
                Ta bort headset
              </button>
            </div>
            <button onClick={handleGoOnline} disabled={!headsetId} style={{ marginTop: '8px', width: '100%' }}>
              Jag är redo
            </button>
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