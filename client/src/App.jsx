// client/src/App.jsx
import { useState } from "react";
import { connect, join } from "../../saas-adapter/src/index"

function App() {
  const [sessionId, setSessionId] = useState("");
  const [headsetId, setHeadsetId] = useState("");
  const [log, setLog] = useState([]);

  const appendLog = (msg) => setLog((l) => [...l, msg]);

  const handleCreateSession = async () => {
    if (!/^\d{6}$/.test(sessionId)) {
      appendLog("Ange en 6‑siffrig kod!");
      return;
    }
    try {
      await connect(sessionId);
      appendLog(`Session ${sessionId} skapad/ansluten.`);
    } catch (e) {
      appendLog("Fel vid skapande: " + e.message);
    }
  };

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
      appendLog(`Headset ${headsetId} lagts till.`);
    } catch (e) {
      appendLog("Fel vid headset: " + e.message);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Enkel Firebase‑test</h1>

      <div>
        <label>Sessionskod (6 siffror): </label>
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <button onClick={handleCreateSession}>Skapa/anslut</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Headset‑id/namn: </label>
        <input
          value={headsetId}
          onChange={(e) => setHeadsetId(e.target.value)}
        />
        <button onClick={handleAddHeadset}>Lägg till headset</button>
      </div>

      <div style={{ marginTop: 20, whiteSpace: "pre" }}>
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

export default App;