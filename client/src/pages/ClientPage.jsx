import { useCallback, useEffect, useState } from "react";
import {
  join,
  leave,
  loginClient,
  onActiveControlsChange,
  onSceneChange,
  onTourIdChange,
  ready,
} from "../../../saas-adapter/src/index";
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
import TopAppBar from "../components/TopAppBar";

/**
 * Main headset client page with session controls, current XR context, and debug activity.
 */
export default function ClientPage() {
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem(SESSION_ID_KEY) ?? "");
  const [headsetLabel, setHeadsetLabel] = useState(() => sessionStorage.getItem(LABEL_KEY) ?? "");
  const [activeSessionId, setActiveSessionId] = useState(() => sessionStorage.getItem(ACTIVE_SESSION_KEY) ?? "");
  const [log, setLog] = useState([]);
  const [isReady, setIsReady] = useState(false);
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
  const activeSceneLabel = activeSceneState.scene?.label ?? activeSceneState.resolvedSceneId;
  const activeSceneDisplay = `${activeSceneLabel} [${activeSceneState.resolvedSceneId}]${
    activeSceneState.usedFallback ? " (fallback)" : ""
  }`;
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
      .then(() => appendLog("Logged into Firebase anonymously."))
      .catch((error) => appendLog(`Login error: ${error.message}`));
  }, [appendLog]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    join(activeSessionId, headsetId, headsetLabel || headsetId)
      .then((result) => {
        setDisconnectCancelFn(() => result?.cancel);
        appendLog("Reconnected to the active session.");
      })
      .catch((error) => appendLog(`Reconnect failed: ${error.message}`));
  }, [activeSessionId, appendLog, headsetId, headsetLabel]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const unsubscribe = onSceneChange(activeSessionId, (sceneId) => {
      if (sceneId === null) {
        appendLog("The guide ended the session.");
        disconnectCancelFn?.();
        setActiveSessionId("");
        setSessionId("");
        setSessionEnded(true);
        setIsReady(false);
        setActiveSceneId(DEFAULT_SCENE_ID);
        setActiveControlMap({});
        setTourState(resolveTour(""));
        appendLog("Rensade aktiv tour och controls.");
        return;
      }

      const effectiveSceneId = typeof sceneId === "string" && sceneId.trim() ? sceneId.trim() : DEFAULT_SCENE_ID;
      setActiveSceneId(effectiveSceneId);
      appendLog(`Scene changed: ${effectiveSceneId}`);
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
          ? `tourId missing or invalid. Falling back to ${resolved.resolvedTourId}.`
          : `Tour updated: ${resolved.resolvedTourId}`,
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
      const activeCount = Object.keys(nextControlMap).length;
      appendLog(`Aktiva controls uppdaterade: ${activeCount}`);
    });

    return unsubscribe;
  }, [activeSessionId, appendLog]);

  /**
   * Joins the current session with the persisted headset identifier.
   */
  const handleAddHeadset = async () => {
    const normalizedSession = normalizeSessionId(sessionId);
    if (!normalizedSession) {
      appendLog("Enter a valid six-digit session code first.");
      return;
    }

    try {
      setSessionId(normalizedSession);
      const result = await join(normalizedSession, headsetId, headsetLabel || headsetId);
      setDisconnectCancelFn(() => result?.cancel);
      setActiveSessionId(normalizedSession);
      setSessionEnded(false);
      setActiveSceneId(DEFAULT_SCENE_ID);
      setActiveControlMap({});
      setTourState(resolveTour(""));
      appendLog(`Headset ansluten till session ${normalizedSession}.`);
    } catch (error) {
      appendLog(`Fel vid headset: ${error.message}`);
    }
  };

  /**
   * Toggles whether this headset is marked as ready for the XR experience.
   */
  const handleToggleReady = async () => {
    try {
      await ready(activeSessionId, headsetId, !isReady);
      setIsReady(!isReady);
      if (!isReady && xrSceneUrl) {
        window.open(xrSceneUrl, "_blank");
      }
      appendLog(!isReady ? "Headset är nu redo." : "Headset är inte längre redo.");
    } catch (error) {
      appendLog(`Fel vid ready: ${error.message}`);
    }
  };

  /**
   * Leaves the current session and clears local state.
   */
  const handleRemoveHeadset = async () => {
    if (!activeSessionId) {
      appendLog("Connect to a session first.");
      return;
    }

    try {
      await leave(activeSessionId, headsetId);
      setActiveSessionId("");
      setSessionId("");
      setDisconnectCancelFn(null);
      setIsReady(false);
      setSessionEnded(false);
      setActiveSceneId(DEFAULT_SCENE_ID);
      setActiveControlMap({});
      setTourState(resolveTour(""));
      appendLog("Headset har lämnat sessionen.");
    } catch (error) {
      appendLog(`Fel vid headset: ${error.message}`);
    }
  };

  return (
    <div className="page">
      <TopAppBar title="Kalmar Historical Tour" />

      <div className="page-content">
        <HeadsetForm
          sessionId={sessionId}
          setSessionId={setSessionId}
          headsetLabel={headsetLabel}
          setHeadsetLabel={setHeadsetLabel}
          activeSceneId={activeSceneDisplay}
          onAddHeadset={handleAddHeadset}
          onRemoveHeadset={handleRemoveHeadset}
          onToggleReady={handleToggleReady}
          isReady={isReady}
          activeSessionId={activeSessionId}
        />

        <ActivityLog
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
        />
      </div>
    </div>
  );
}
