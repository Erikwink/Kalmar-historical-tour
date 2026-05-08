import { useEffect, useState } from "react";
import { join, loginClient, onActiveControlsChange, onSceneChange, onTourIdChange, ready } from "../../../saas-adapter/src/index";
import {
  ACTIVE_SESSION_KEY,
  DEFAULT_SCENE_ID,
  LABEL_KEY,
  SESSION_ID_KEY,
  getOrCreateHeadsetId,
  normalizeSessionId,
} from "../utils/sessionStorage";
import { resolveActiveControls, resolveScene, resolveTour } from "../toursClient.js";
import HeadsetForm from "../components/HeadsetForm";

/**
 * Development-style client shell with the WebXR session/tour/control runtime kept intact.
 */
export default function ClientPage() {
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem(SESSION_ID_KEY) ?? "");
  const [headsetLabel, setHeadsetLabel] = useState(() => sessionStorage.getItem(LABEL_KEY) ?? "");
  const [activeSessionId, setActiveSessionId] = useState(() => sessionStorage.getItem(ACTIVE_SESSION_KEY) ?? "");
 // const [log, setLog] = useState([]);
  const [disconnectCancelFn, setDisconnectCancelFn] = useState(null);
  const [_sessionEnded, setSessionEnded] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_SCENE_ID);
  const [activeControlMap, setActiveControlMap] = useState({});
  const [tourState, setTourState] = useState(() => resolveTour(""));
  const [headsetId] = useState(() => getOrCreateHeadsetId());

  const activeSceneState = resolveScene(tourState, activeSceneId);
  const _activeControlsState = resolveActiveControls(activeSceneState, activeControlMap);

  const activeTourId = tourState.resolvedTourId;
  const xrSceneUrl = activeSessionId
    ? `${window.location.origin}/webxr.html?session=${activeSessionId}&tourId=${encodeURIComponent(activeTourId)}`
    : "";

  useEffect(() => {
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    sessionStorage.setItem(LABEL_KEY, headsetLabel);
  }, [headsetLabel]);

  useEffect(() => {
    sessionStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    loginClient().catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    join(activeSessionId, headsetId, headsetLabel || headsetId)
      .then((result) => setDisconnectCancelFn(() => result?.cancel))
      .catch(console.error);
  }, [activeSessionId, headsetId, headsetLabel]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const unsubscribe = onSceneChange(activeSessionId, (sceneId) => {
      if (sceneId === null) {
        disconnectCancelFn?.();
        setActiveSessionId("");
        setSessionId("");
        setSessionEnded(true);
        setActiveSceneId(DEFAULT_SCENE_ID);
        setActiveControlMap({});
        setTourState(resolveTour(""));
        return;
      }

      const effectiveSceneId = typeof sceneId === "string" && sceneId.trim() ? sceneId.trim() : DEFAULT_SCENE_ID;
      setActiveSceneId(effectiveSceneId);
    });

    return unsubscribe;
  }, [activeSessionId, disconnectCancelFn]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const unsubscribe = onTourIdChange(activeSessionId, (tourId) => {
      setTourState(resolveTour(tourId));
    });

    return unsubscribe;
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const unsubscribe = onActiveControlsChange(activeSessionId, (activeControls) => {
      setActiveControlMap(activeControls && typeof activeControls === "object" ? activeControls : {});
    });

    return unsubscribe;
  }, [activeSessionId]);

  /**
   * Joins the session, marks this headset ready, and opens the WebXR runtime.
   */
  const handleAddHeadset = async () => {
    const normalizedSessionId = normalizeSessionId(sessionId);
    if (!normalizedSessionId) return;

    try {
      setSessionId(normalizedSessionId);
      const result = await join(normalizedSessionId, headsetId, headsetLabel || headsetId);
      await ready(normalizedSessionId, headsetId, true);
      setDisconnectCancelFn(() => result?.cancel);
      setActiveSessionId(normalizedSessionId);
      setSessionEnded(false);
      setActiveSceneId(DEFAULT_SCENE_ID);
      setActiveControlMap({});
      setTourState(resolveTour(""));
      window.open(`${window.location.origin}/webxr.html?session=${normalizedSessionId}&tourId=${encodeURIComponent(activeTourId)}`, "_blank");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="page">
      <div className="page-content">
        <HeadsetForm
          sessionId={sessionId}
          setSessionId={setSessionId}
          headsetLabel={headsetLabel}
          setHeadsetLabel={setHeadsetLabel}
          onAddHeadset={handleAddHeadset}
          activeSessionId={activeSessionId}
          xrSceneUrl={xrSceneUrl}
        />

        
      </div>
    </div>
  );
}
