import { useEffect, useState } from "react";
import "./App.css";
import { scenes } from "./scenes";
import StatusBar from "./components/statusBar";
import { adapter } from "./adapter-mock";
import SceneBtn from "./components/sceneBtn";

const statusMap = {
  CONNECTED: "Connected",
  CONNECTING: "Connecting",
  ERROR: "Error",
  DISCONNECTED: "Disconnected",
};


function App() {
  const [activeScene, setActivescene] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // connect to headset
    async function init() {
      try {
        setStatus(statusMap.CONNECTING);
        await adapter.connect();
        setStatus(statusMap.CONNECTED);
      } catch (e) {
        console.error("failed to connect to adapter:", e);
        setStatus(statusMap.ERROR);
      }
    }
    init();
  }, []);

  async function handleScenePress(sceneId) {
    try {
      // när adapter / connection till Saas är på plats
      await adapter.publish(sceneId);
      setActivescene(sceneId);
    } catch (e) {
      console.error("failed to publish scene:", e);
      setStatus("error");
    }
  }
  return (
    <>
      <h1>Welcome to controller APP</h1>
      <StatusBar
        status={status}
        activeScene={scenes.find((s) => s.id === activeScene)}
      />
      {scenes.map((scene) => (
        <SceneBtn 
          key={scene.id}
          scene={scene}
          onClick={() => handleScenePress(scene.id)}
          />
      ))}
      
    </>
  );
}

export default App;
