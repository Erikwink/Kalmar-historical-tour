import { useEffect, useState } from "react";
import { adapter } from "./adapter-mock";
import SessionPage from "./pages/SessionPage";
import MainPage from "./pages/MainPage";

const statusMap = {
  CONNECTED: "Connected",
  CONNECTING: "Connecting",
  ERROR: "Error",
};

function generateSessionId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function App() {
  const [page, setPage] = useState("session");
  const [activeScene, setActiveScene] = useState("waiting");
  const [SaasStatus, setSaasStatus] = useState(null);
  const [headsets, setHeadsets] = useState([]);
  const [sessionId] = useState(generateSessionId);

  useEffect(() => {
    const unsubscribe = adapter.onHeadsetsChange(setHeadsets);

    async function init() {
      try {
        setSaasStatus(statusMap.CONNECTING);
        await adapter.connect(sessionId);
        setSaasStatus(statusMap.CONNECTED);
      } catch (e) {
        console.error("failed to connect to adapter:", e);
        setSaasStatus(statusMap.ERROR);
      }
    }
    init();

    return unsubscribe;
  }, [sessionId]);

  async function handleScenePress(sceneId) {
    try {
      await adapter.publish(sceneId, sessionId);
      setActiveScene(sceneId);
    } catch (e) {
      console.error("failed to publish scene:", e);
      setSaasStatus(statusMap.ERROR);
    }
  }

  if (page === "session") {
    return (
      <SessionPage
        sessionId={sessionId}
        headsets={headsets}
        adapterStatus={SaasStatus}
        onStart={() => setPage("main")}
      />
    );
  }

  return (
    <MainPage
      headsets={headsets}
      adapterStatus={SaasStatus}
      activeScene={activeScene}
      onScenePress={handleScenePress}
      onBack={() => setPage("session")}
    />
  );
}

export default App;
