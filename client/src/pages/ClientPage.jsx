import { useCallback, useEffect, useState } from "react";
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
import ActivityLog from "../components/ActivityLog";
import HeadsetForm from "../components/HeadsetForm";

/**
 * Development-style client shell with the WebXR session/tour/control runtime kept intact.
 */
export default function ClientPage() {
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem(SESSION_ID_KEY) ?? "");
  const [headsetLabel, setHeadsetLabel] = useState(() => sessionStorage.getItem(LABEL_KEY) ?? "");
  const [activeSessionId, setActiveSessionId] = useState(() => sessionStorage.getItem(ACTIVE_SESSION_KEY) ?? "");
  const [log, setLog] = useState([]);
  const [disconnectCancelFn, setDisconnectCancelFn] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_SCENE_ID);
  const [activeControlMap, setActiveControlMap] = useState({});
  const [tourState, setTourState] = useState(() => resolveTour(""));
  const [headsetId] = useState(() => getOrCreateHeadsetId());

  const activeSceneState = resolveScene(tourState, activeSceneId);
  const activeControlsState = resolveActiveControls(activeSceneState, activeControlMap);
  const activeTour = tourState.tour;
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

  /**
   * Appends a single line to the local activity log.
   */
  const appendLog = useCallback((message) => {
    setLog((entries) => [...entries, message]);
  }, []);

  useEffect(() => {
    loginClient()
      .then(() => appendLog("Inloggad i Firebase (anonymous)."))
      .catch((error) => appendLog(`Login fel: ${error.message}`));
  }, [appendLog]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    join(activeSessionId, headsetId, headsetLabel || headsetId)
      .then((result) => {
        setDisconnectCancelFn(() => result?.cancel);
        appendLog("Återansluten till session.");
      })
      .catch((error) => appendLog(`Fel vid återanslutning: ${error.message}`));
  }, [activeSessionId, appendLog, headsetId, headsetLabel]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const unsubscribe = onSceneChange(activeSessionId, (sceneId) => {
      if (sceneId === null) {
        appendLog("Sessionen avslutades av guide.");
        disconnectCancelFn?.();
        setActiveSessionId("");
        setSessionId("");
        setSessionEnded(true);
        setActiveSceneId(DEFAULT_SCENE_ID);
        setActiveControlMap({});
        setTourState(resolveTour(""));
        appendLog("Rensade aktiv tour och controls.");
        return;
      }

      const effectiveSceneId = typeof sceneId === "string" && sceneId.trim() ? sceneId.trim() : DEFAULT_SCENE_ID;
      setActiveSceneId(effectiveSceneId);
      appendLog(`Scen ändrad: ${effectiveSceneId}`);
    });

    return unsubscribe;
  }, [activeSessionId, appendLog, disconnectCancelFn]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const unsubscribe = onTourIdChange(activeSessionId, (tourId) => {
      const resolved = resolveTour(tourId);
      setTourState(resolved);
      appendLog(
        resolved.usedFallback
          ? `tourId saknas eller är ogiltigt. Fallback till ${resolved.resolvedTourId}.`
          : `Tour uppdaterad: ${resolved.resolvedTourId}`,
      );
    });

    return unsubscribe;
  }, [activeSessionId, appendLog]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const unsubscribe = onActiveControlsChange(activeSessionId, (activeControls) => {
      const nextControlMap = activeControls && typeof activeControls === "object" ? activeControls : {};
      setActiveControlMap(nextControlMap);
      appendLog(`Aktiva controls uppdaterade: ${Object.keys(nextControlMap).length}`);
    });

    return unsubscribe;
  }, [activeSessionId, appendLog]);

  /**
   * Joins the session, marks this headset ready, and opens the WebXR runtime.
   */
  const handleAddHeadset = async () => {
    const normalizedSessionId = normalizeSessionId(sessionId);
    if (!normalizedSessionId) {
      appendLog("Skapa session först.");
      return;
    }

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
      appendLog(`Headset ansluten och redo i session ${normalizedSessionId}.`);
      window.open(`${window.location.origin}/webxr.html?session=${normalizedSessionId}&tourId=${encodeURIComponent(activeTourId)}`, "_blank");
    } catch (error) {
      appendLog(`Fel vid headset: ${error.message}`);
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

        {/* For DEV ONLY remove this in production - shows the current activity log and session state for debugging purposes. */}
        {/* <ActivityLog
          log={[
            ...log,
            ...(sessionEnded ? ["Sessionen avslutades av guide."] : []),
            ...(activeTour ? [`Aktiv tour: ${activeTour.title} [${activeTourId}]`] : []),
            ...(activeControlsState.activeControls.length
              ? [
                `Aktiva controls: ${activeControlsState.activeControls
                  .map((control) => control.label || control.id)
                  .join(", ")}`,
              ]
              : []),
          ]}
        /> */}
      </div>
    </div>
  );
}
