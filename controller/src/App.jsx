import { useEffect, useState } from "react";
import { connect, onHeadsetsChange, publish } from "../../saas-adapter/src/index"
import SessionPage from "./pages/SessionPage";
import MainPage from "./pages/MainPage";
import { FIREBASE_STATUS } from "./utils/status_maps";
import JoinMock from "./JoinMock"; // DEV: remove when real client exists



/** Generate session id.
 * 
 * @returns 6-digit number
 */
function generateSessionId() {
  //return Math.floor(100000 + Math.random() * 900000).toString();
  const num = 123456
  return num.toString()
}

function getSessionId(){
  const stored = localStorage.getItem("sessionId");
  if(stored) {
    return stored;
  }
  const newId = generateSessionId();
  localStorage.setItem("sessionId", newId);
  return newId;
}

function App() {
  const [page, setPage] = useState("session");
  const [activeScene, setActiveScene] = useState("waiting");
  const [SaasStatus, setSaasStatus] = useState(null);
  const [headsets, setHeadsets] = useState([]);
  const [sessionId] = useState(getSessionId);

  useEffect(() => {
    // subscribe to headsets
    const unsubscribe = onHeadsetsChange(sessionId, setHeadsets);

    /** Connect to Firebase/backend
     *
     */
    async function init() {
      try {
        setSaasStatus(FIREBASE_STATUS.CONNECTING);
        await connect(sessionId);
        setSaasStatus(FIREBASE_STATUS.CONNECTED);
      } catch (e) {
        console.error("failed to connect to adapter:", e);
        setSaasStatus(FIREBASE_STATUS.ERROR);
      }
    }
    init();

    return unsubscribe;
  }, [sessionId]);

   /** Send scene to backend and set active scene.
   * 
   * @param {String} sceneId - Value beeing sent to Saas
   */
  async function handleScenePress(sceneId) {
    try {
      await publish(sessionId, sceneId);
      setActiveScene(sceneId);
    } catch (e) {
      console.error("failed to publish scene:", e);
      setSaasStatus(FIREBASE_STATUS.ERROR);
    }
  }

  if (page === "session") {
    return (
      <>
        <SessionPage
          sessionId={sessionId}
          headsets={headsets}
          adapterStatus={SaasStatus}
          onStart={() => setPage("main")}
        />
        {/* REMOVE MOCK ONCE CLIENT IS IMPLEMENTED */}
        <JoinMock sessionId={sessionId} headsets={headsets} />
      </>
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
