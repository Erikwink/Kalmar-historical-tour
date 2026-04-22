import { useState, useEffect } from "react";
import { loginClient, join, leave, onSceneChange, ready } from "../../../saas-adapter/src/index";
import {
  SESSION_ID_KEY,
  ACTIVE_SESSION_KEY,
  LABEL_KEY,
  DEFAULT_SCENE_ID,
  normalizeSessionId,
  getOrCreateHeadsetId,
} from "../utils/sessionStorage";
import HeadsetForm from "../components/HeadsetForm";
import ActivityLog from "../components/ActivityLog";

/**
 * Main client page component.
 * Handles joining/leaving sessions and subscribing to scene changes.
 */
function ClientPage() {
  const [sessionId, setSessionId] = useState(() =>
    sessionStorage.getItem(SESSION_ID_KEY) ?? ""
  );
  const [headsetLabel, setHeadsetLabel] = useState(() =>
    sessionStorage.getItem(LABEL_KEY) ?? ""
  );
  const [activeSessionId, setActiveSessionId] = useState(() =>
    sessionStorage.getItem(ACTIVE_SESSION_KEY) ?? ""
  );
  const [log, setLog] = useState([]);
  //const [isReady, setIsReady] = useState(false);
  const [disconnectCancelFn, setDisconnectCancelFn] = useState(null);
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_SCENE_ID);

  const xrSceneUrl = activeSessionId
    ? `${window.location.origin}/webxr.html?session=${activeSessionId}`
    : "";

  // Stable client ID — generated once and persisted in sessionStorage.
  const [headsetId] = useState(() => getOrCreateHeadsetId());

  // Keep sessionStorage in sync with state.
  useEffect(() => {
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    sessionStorage.setItem(LABEL_KEY, headsetLabel);
  }, [headsetLabel]);

  useEffect(() => {
    sessionStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
  }, [activeSessionId]);

  /**
   * Appends a message to the activity log.
   */
  const appendLog = (msg) => setLog((l) => [...l, msg]);

  // Initialize Firebase login
  useEffect(() => {
    loginClient()
      .then(() => appendLog("Inloggad i Firebase (anonymous)"))
      .catch((e) => appendLog("Login fel: " + e.message));
  }, []);

  // Re-join automatically on reload if we were already in a session.
  useEffect(() => {
    if (!activeSessionId) return;
    join(activeSessionId, headsetId, headsetLabel || headsetId)
      .then((result) => {
        setDisconnectCancelFn(() => result?.cancel);
        appendLog("Återansluten till session.");
      })
      .catch((e) => appendLog("Fel vid återanslutning: " + e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to scene changes when an active session exists.
  // Also detects when the room is deleted (sceneId becomes null).
  useEffect(() => {
    if (!activeSessionId) return;
    const unsubscribe = onSceneChange(activeSessionId, (sceneId) => {
      // Null means the room was deleted by the controller
      if (sceneId === null) {
        appendLog("Sessionen avslutades av guide.");
        // Cancel the onDisconnect handler to prevent room recreation
        if (disconnectCancelFn) {
          disconnectCancelFn();
        }
        // Clear the session state
        setActiveSessionId("");
        setSessionId("");
        return;
      }
      const effectiveSceneId =
        typeof sceneId === "string" && sceneId.trim()
          ? sceneId.trim()
          : DEFAULT_SCENE_ID;
      setActiveSceneId(effectiveSceneId);
      appendLog(`Scen ändrad: ${effectiveSceneId}`);
    });
    return unsubscribe;
  }, [activeSessionId, disconnectCancelFn]);

  /**
   * Joins the session using the stable headset ID and the user-provided label.
   */
  const handleAddHeadset = async () => {

    const normalizedSessionId = normalizeSessionId(sessionId);
    if (!normalizedSessionId) {
      appendLog("Skapa session först.");
      return;
    }
    const url = `${window.location.origin}/webxr.html?session=${normalizedSessionId}&autostart=sim`;
    window.open(url, "_blank");
    try {
      setSessionId(normalizedSessionId);

      const result = await join(
        normalizedSessionId,
        headsetId,
        headsetLabel || headsetId
      );

      setDisconnectCancelFn(() => result?.cancel);
      setActiveSessionId(normalizedSessionId);

      appendLog(`Headset ansluten till session ${normalizedSessionId}.`);



    } catch (e) {
      appendLog("Fel vid headset: " + e.message);
    }
  };

  /**
   * Toggles the headset ready state and syncs it to Firebase.
   */
  /*  const handleToggleReady = async () => {
     try {
       await ready(activeSessionId, headsetId, !isReady, xrSceneUrl);
       setIsReady(!isReady);
       // Open the XR scene in a new tab when user is ready.
       if (!isReady) {
         window.open(xrSceneUrl, "_blank");
       }
       appendLog(
         !isReady ? "Headset är nu redo." : "Headset är inte längre redo."
       );
     } catch (e) {
       appendLog("Fel vid ready: " + e.message);
     }
   }; */

  /**
   * Removes the headset from the current session.
   */
  /* const handleRemoveHeadset = async () => {
    if (!activeSessionId) {
      appendLog("Anslut till session först.");
      return;
    }
    try {
      await leave(activeSessionId, headsetId);
      setActiveSessionId("");
      setSessionId("");
      setDisconnectCancelFn(null);
      appendLog("Headset har lämnat sessionen.");
    } catch (e) {
      appendLog("Fel vid headset: " + e.message);
    }
  };
 */
  return (
    <div className="page">

      <div className="page-content">
        <HeadsetForm
          sessionId={sessionId}
          setSessionId={setSessionId}
          headsetLabel={headsetLabel}
          setHeadsetLabel={setHeadsetLabel}
          activeSceneId={activeSceneId}
          onAddHeadset={handleAddHeadset}
          //onRemoveHeadset={handleRemoveHeadset}
          //onToggleReady={handleToggleReady}
          //isReady={isReady}
          activeSessionId={activeSessionId}
          xrSceneUrl={xrSceneUrl}
        />

        <ActivityLog log={log} />
      </div>
    </div>
  );
}

export default ClientPage;
