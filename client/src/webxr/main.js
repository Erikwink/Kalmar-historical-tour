import {
  publishMockScene,
  subscribeToActiveControlsChanges,
  subscribeToSceneChanges,
  subscribeToTourIdChanges,
} from "./backendClient.js";
import { createAudioPlaybackManager } from "./audioPlayback.js";
import { createBabylonRuntime } from "./babylonRuntime.js";
import { getWebXRDom } from "./domElements.js";
import {
  enterXRWithFallbacks,
  isUserActivationError,
} from "./xrSession.js";
import {
  getAutostartMode,
  getSessionFromUrl,
  getTourIdFromUrl,
  normalizeSessionId,
  resolveRuntimeMode,
} from "./runtimeConfig.js";
import { createWebXRUiController } from "./uiController.js";
import { createSceneManager, DEFAULT_SCENE_ID } from "./scenes/sceneCatalog.js";
import {
  getRenderableSceneControls,
  getRenderableSceneControlSignature,
  getSelectableScenes,
  resolveActiveControls,
  resolveScene,
  resolveTour,
} from "../toursClient.js";

const dom = getWebXRDom();
const {
  sessionInput,
  connectSessionButton,
  mockSceneSelect,
  sendMockSceneButton,
  startVrButton,
  startArButton,
  startSimButton,
  endButton,
  resumeVrButton,
  canvas,
} = dom;
const SCENE_DEBUG_EVENT = "kalmar:webxr-scene-debug";

function handleAutoStart() {
  const mode = getAutostartMode();

  if (!mode) return;

  if (mode === "sim") {
    if (support.vr) {
      startXR("immersive-vr");
      return;
    }
    startSimulation();
  }

  if (mode === "vr") {
    if (support.vr) {
      startXR("immersive-vr");
    } else {
      setStatus("VR stöds inte, startar simulation istället.");
      startSimulation();
    }
  }

  if (mode === "ar") {
    if (support.ar) {
      startXR("immersive-ar");
    } else {
      setStatus("AR stöds inte.");
    }
  }
}

const runtimeMode = resolveRuntimeMode();
const isLaptopPreviewPage = runtimeMode === "preview";
const isHeadsetRuntimePage = !isLaptopPreviewPage;
document.body.dataset.headsetMode = isHeadsetRuntimePage ? "true" : "false";
document.body.dataset.runtimeMode = runtimeMode;

const support = {
  vr: false,
  ar: false,
};

let activeTourState = resolveTour(getTourIdFromUrl());
let activeSceneState = resolveScene(activeTourState, DEFAULT_SCENE_ID, { includeDevelopmentScenes: true });
let activeSceneId = activeSceneState.resolvedSceneId;
let activeControlsState = resolveActiveControls(activeSceneState, {});
let sceneSource = "not-connected";
let currentSessionId = "";
let unsubscribeScene = null;
let unsubscribeTour = null;
let unsubscribeActiveControls = null;

let appMode = "idle";
let autoLaunchResolved = false;
let autoVrGestureLaunchArmed = false;
let xrStartInFlight = false;
let sceneRefreshTimer = null;
let pendingVrResumeAfterSceneChange = false;
let sceneTransitionExitInFlight = false;
const SCENE_REFRESH_DEBOUNCE_MS = 80;

const ui = createWebXRUiController({
  elements: dom,
  isHeadsetRuntimePage: () => isHeadsetRuntimePage,
  isXRSessionActive,
  isSceneReadyForVr,
  support,
  isXrStartInFlight: () => xrStartInFlight,
});
const {
  setStatus,
  setTourIndicator,
  setSceneIndicator,
  setControlsIndicator,
  setSceneDebug,
  setResumeVrPromptVisible,
} = ui;

const babylonRuntime = createBabylonRuntime({
  canvas,
  createSceneManager,
  onXRSessionEnded() {
    if (appMode === "xr-vr" || appMode === "xr-ar") {
      onSessionEnded();
    }
  },
});

const audioPlaybackManager = createAudioPlaybackManager({
  onPlaybackEvent(detail) {
    if (!detail?.message) {
      return;
    }

    const tone = detail.status === "error" ? "error" : detail.status === "loaded" ? "success" : "info";
    const errorSuffix = detail.error ? ` Error: ${detail.error}` : "";
    const debugMessage = `[media] ${detail.message}${errorSuffix}`;
    setSceneDebug(debugMessage, tone);

    if (detail.status === "error") {
      console.error(`[webxr] ${debugMessage}`);
      return;
    }

    console.info(`[webxr] ${debugMessage}`);
  },
});

function isSceneReadyForVr() {
  return activeSceneId !== DEFAULT_SCENE_ID && getRenderableSceneControls(activeControlsState.activeControls).length > 0;
}

function isXRSessionActive() {
  return babylonRuntime.isXRSessionActive();
}

function shouldDeferSceneRenderForActiveVr() {
  return appMode === "xr-vr" && isXRSessionActive();
}

async function exitXRForSceneTransition(reason) {
  if (!isXRSessionActive()) {
    return;
  }

  pendingVrResumeAfterSceneChange = true;
  setResumeVrPromptVisible(false);
  setStatus(`${reason} Leaving VR to load the scene safely...`);
  setSceneDebug("Scene update received during immersive VR. Exiting VR before rebuilding the panorama.", "info");

  if (sceneTransitionExitInFlight) {
    return;
  }

  sceneTransitionExitInFlight = true;
  try {
    await babylonRuntime.exitXR();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pendingVrResumeAfterSceneChange = false;
    setResumeVrPromptVisible(false);
    setStatus(`Could not leave VR for scene transition: ${message}`);
    setSceneDebug(`Could not leave VR for scene transition. Error: ${message}`, "error");
    console.error("[webxr] Failed to exit XR for scene transition:", error);
  } finally {
    sceneTransitionExitInFlight = false;
  }
}

function deferSceneRenderIfActiveVr(reason) {
  if (!shouldDeferSceneRenderForActiveVr()) {
    return false;
  }

  exitXRForSceneTransition(reason);
  return true;
}

/**
 * Syncs active audio and narration controls to the browser media layer.
 * Playback only runs while simulation or XR mode is active.
 */
function syncActiveMediaPlayback() {
  audioPlaybackManager.sync(activeControlsState.activeControls, {
    enabled: appMode === "simulation" || appMode === "xr-vr" || appMode === "xr-ar",
  });
}

function isImmersiveVrPreferredRuntime() {
  return support.vr;
}

function isBrowserSimulationPreferredRuntime() {
  return !isImmersiveVrPreferredRuntime();
}

function isInteractiveLaunchTarget(target) {
  return target instanceof Element && Boolean(target.closest("button, input, select, a, textarea"));
}

async function handleAutoVrGestureLaunch(event) {
  disarmAutoVrGestureLaunch();
  if (isInteractiveLaunchTarget(event?.target)) {
    armAutoVrGestureLaunch();
    return;
  }

  await maybeAutoLaunchPreferredMode("gesture");
}

function armAutoVrGestureLaunch() {
  if (autoVrGestureLaunchArmed || autoLaunchResolved || !isImmersiveVrPreferredRuntime()) {
    return;
  }

  autoVrGestureLaunchArmed = true;
  window.addEventListener("pointerdown", handleAutoVrGestureLaunch, { once: true, passive: true });
  window.addEventListener("keydown", handleAutoVrGestureLaunch, { once: true });
}

function disarmAutoVrGestureLaunch() {
  if (!autoVrGestureLaunchArmed) {
    return;
  }

  autoVrGestureLaunchArmed = false;
  window.removeEventListener("pointerdown", handleAutoVrGestureLaunch);
  window.removeEventListener("keydown", handleAutoVrGestureLaunch);
}

/**
 * Resolves the active tour from session or URL state and keeps the UI indicator in sync.
 */
function applyTourId(rawTourId) {
  const nextRawTourId = typeof rawTourId === "string" && rawTourId.trim() ? rawTourId.trim() : getTourIdFromUrl();
  activeTourState = resolveTour(nextRawTourId);
  setTourIndicator(activeTourState);
  populateMockSceneSelect();

  activeSceneState = resolveScene(activeTourState, activeSceneId, { includeDevelopmentScenes: true });
  activeControlsState = resolveActiveControls(activeSceneState, activeControlsState.controlMap);
  activeSceneId = activeSceneState.resolvedSceneId;
  setSceneIndicator(activeSceneState);
  setControlsIndicator(activeControlsState);
  if (babylonRuntime.hasScene()) {
    if (deferSceneRenderIfActiveVr(`Tour changed to '${activeTourState.resolvedTourId}'.`)) {
      return;
    }
    scheduleSceneThemeRefresh();
  }
}

/**
 * Resolves and stores active controls for the current scene from the session control-map.
 */
function applyActiveControls(rawActiveControls) {
  const previousRenderableSignature = getRenderableSceneControlSignature(activeControlsState.activeControls);
  activeControlsState = resolveActiveControls(activeSceneState, rawActiveControls);
  setControlsIndicator(activeControlsState);
  if (!isSceneReadyForVr()) {
    pendingVrResumeAfterSceneChange = false;
  }
  setResumeVrPromptVisible(isSceneReadyForVr());
  const nextRenderableSignature = getRenderableSceneControlSignature(activeControlsState.activeControls);
  if (babylonRuntime.hasScene() && previousRenderableSignature !== nextRenderableSignature) {
    if (deferSceneRenderIfActiveVr(`Controls changed for scene '${activeSceneId}'.`)) {
      return;
    }
    scheduleSceneThemeRefresh();
    return;
  }

  syncActiveMediaPlayback();
}

function setButtons({ canStartVr, canStartAr, canStartSim, canEnd }) {
  startVrButton.disabled = !canStartVr;
  startArButton.disabled = !canStartAr;
  startSimButton.disabled = !canStartSim;
  endButton.disabled = !canEnd;
  setResumeVrPromptVisible(pendingVrResumeAfterSceneChange);
}

function enableIdleButtons() {
  setButtons({
    canStartVr: support.vr,
    canStartAr: support.ar,
    canStartSim: true,
    canEnd: false,
  });
}

function applySceneTheme() {
  if (!babylonRuntime.hasScene()) {
    return;
  }

  const mode = appMode === "xr-ar" ? "xr-ar" : appMode === "xr-vr" ? "xr-vr" : "simulation";
  babylonRuntime.applyScene(
    {
      ...(activeSceneState.scene || { id: activeSceneId }),
      activeControls: activeControlsState.activeControls,
    },
    mode,
  );
  syncActiveMediaPlayback();
}

function scheduleSceneThemeRefresh() {
  if (sceneRefreshTimer !== null) {
    window.clearTimeout(sceneRefreshTimer);
  }

  sceneRefreshTimer = window.setTimeout(() => {
    sceneRefreshTimer = null;
    if (!babylonRuntime.hasScene()) {
      return;
    }

    try {
      if (deferSceneRenderIfActiveVr(`Scene '${activeSceneId}' refresh is pending.`)) {
        return;
      }
      applySceneTheme();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSceneDebug(`[scene-refresh] Failed to apply scene update. Error: ${message}`, "error");
      setStatus(`Scene refresh failed: ${message}`);
      console.error("[webxr] Scene refresh failed:", error);
    }
  }, SCENE_REFRESH_DEBOUNCE_MS);
}

function applySceneChange(sceneId) {
  activeSceneState = resolveScene(activeTourState, sceneId, { includeDevelopmentScenes: true });
  activeControlsState = resolveActiveControls(activeSceneState, activeControlsState.controlMap);
  activeSceneId = activeSceneState.resolvedSceneId;
  if (!isSceneReadyForVr()) {
    pendingVrResumeAfterSceneChange = false;
  }
  setSceneIndicator(activeSceneState);
  setControlsIndicator(activeControlsState);
  setResumeVrPromptVisible(isSceneReadyForVr());
  if (!babylonRuntime.hasScene()) {
    const requestedSceneId = activeSceneState.requestedSceneId || activeSceneState.resolvedSceneId;
    setSceneDebug(
      `Scene '${requestedSceneId}' resolved to '${activeSceneState.resolvedSceneId}'. Babylon scene not initialized yet; render will start when XR/simulation starts.`,
    );
  } else {
    setSceneDebug(`Scene '${activeSceneId}' is active. Waiting for scene-specific diagnostics...`);
    if (deferSceneRenderIfActiveVr(`Scene '${activeSceneId}' received.`)) {
      const fallbackSuffix =
        activeSceneState.usedFallback && activeSceneState.requestedSceneId
          ? ` (fallback from '${activeSceneState.requestedSceneId}')`
          : "";
      setStatus(`Scene queued for safe VR transition (${sceneSource}): ${activeSceneId}${fallbackSuffix}`);
      return;
    }
    scheduleSceneThemeRefresh();
  }
  const fallbackSuffix =
    activeSceneState.usedFallback && activeSceneState.requestedSceneId
      ? ` (fallback from '${activeSceneState.requestedSceneId}')`
      : "";
  setStatus(`Scene updated via onSceneChange (${sceneSource}): ${activeSceneId}${fallbackSuffix}`);
}

function handleSceneDebug(event) {
  const detail = event.detail || {};
  const debugSceneId = typeof detail.sceneId === "string" ? detail.sceneId : "unknown";
  const status = typeof detail.status === "string" ? detail.status : "info";
  const message = typeof detail.message === "string" ? detail.message : "No diagnostics provided.";
  const error = typeof detail.error === "string" ? detail.error : "";

  const debugMessage = error ? `[${debugSceneId}] ${message} Error: ${error}` : `[${debugSceneId}] ${message}`;
  const tone = status === "error" ? "error" : status === "loaded" ? "success" : "info";
  setSceneDebug(debugMessage, tone);

  if (status === "error") {
    setStatus(`Scene error in '${debugSceneId}'. See diagnostics panel.`);
    console.error(`[webxr] ${debugMessage}`);
  } else {
    console.info(`[webxr] ${debugMessage}`);
  }
}

function applyModeChange(mode) {
  if (!babylonRuntime.hasScene()) {
    syncActiveMediaPlayback();
    return;
  }

  babylonRuntime.setMode(mode);
  syncActiveMediaPlayback();
}

function populateMockSceneSelect() {
  if (!mockSceneSelect) {
    return;
  }

  mockSceneSelect.innerHTML = "";
  getSelectableScenes(activeTourState, { includeDevelopmentScenes: true }).forEach((sceneRef) => {
    const option = document.createElement("option");
    option.value = sceneRef.id;
    option.textContent = sceneRef.id;
    mockSceneSelect.appendChild(option);
  });
  mockSceneSelect.value = activeSceneId;
}

function connectSceneStream() {
  const sessionId = normalizeSessionId(sessionInput.value);
  if (!sessionId) {
    setStatus("Session ID is required.");
    return;
  }

  if (typeof unsubscribeScene === "function") {
    unsubscribeScene();
    unsubscribeScene = null;
  }
  if (typeof unsubscribeTour === "function") {
    unsubscribeTour();
    unsubscribeTour = null;
  }
  if (typeof unsubscribeActiveControls === "function") {
    unsubscribeActiveControls();
    unsubscribeActiveControls = null;
  }

  const subscription = subscribeToSceneChanges(sessionId, applySceneChange);
  const tourSubscription = subscribeToTourIdChanges(sessionId, applyTourId);
  const activeControlsSubscription = subscribeToActiveControlsChanges(sessionId, applyActiveControls);
  currentSessionId = sessionId;
  sceneSource = subscription.source;
  unsubscribeScene = typeof subscription.unsubscribe === "function" ? subscription.unsubscribe : null;
  unsubscribeTour = typeof tourSubscription.unsubscribe === "function" ? tourSubscription.unsubscribe : null;
  unsubscribeActiveControls =
    typeof activeControlsSubscription.unsubscribe === "function" ? activeControlsSubscription.unsubscribe : null;
  sendMockSceneButton.disabled = false;
  connectSessionButton.textContent = "Reconnect Scene Stream";
  setStatus(`Connected to onSceneChange for session ${sessionId} (${sceneSource}).`);
}

function bootstrapFromQuery() {
  const sessionFromUrl = getSessionFromUrl();
  applyTourId(getTourIdFromUrl());
  if (!sessionFromUrl) {
    return;
  }

  sessionInput.value = sessionFromUrl;
  setStatus(`Auto-connecting to session ${sessionFromUrl} from URL...`);
  connectSceneStream();
}

function sendMockScene() {
  const sceneId = mockSceneSelect.value;
  if (sceneSource === "mock-broadcast-channel" && currentSessionId) {
    publishMockScene(currentSessionId, sceneId);
    setStatus(`Mock scene sent: ${sceneId}`);
    return;
  }

  applySceneChange(sceneId);
  setStatus(
    `Local scene preview applied: ${sceneId}. The connected scene stream (${sceneSource}) can still override this when it publishes a new scene.`,
  );
}

function onSessionEnded() {
  const shouldResumeAfterSceneChange = pendingVrResumeAfterSceneChange;

  if (appMode === "xr-vr" || appMode === "xr-ar") {
    appMode = shouldResumeAfterSceneChange ? "simulation" : "idle";
  }

  if (!shouldResumeAfterSceneChange) {
    babylonRuntime.stopRenderLoop();
  } else {
    babylonRuntime.startRenderLoop();
  }
  babylonRuntime.setCameraControlsEnabled(true);
  enableIdleButtons();
  applyModeChange("simulation");
  applySceneTheme();

  if (shouldResumeAfterSceneChange) {
    setResumeVrPromptVisible(isSceneReadyForVr());
    if (isSceneReadyForVr()) {
      setStatus(`Scene '${activeSceneId}' loaded outside VR. Press Fortsätt i VR to continue.`);
      setSceneDebug("Panorama updated outside the WebXR session. VR can be started again with the current scene.", "success");
    } else {
      pendingVrResumeAfterSceneChange = false;
      setStatus("Scene stopped. Waiting for the guide to start the next scene.");
      setSceneDebug("Scene stopped. Waiting outside VR for the next scene.", "info");
    }
    return;
  }

  setResumeVrPromptVisible(false);
  setStatus(`XR session ended. Latest scene: ${activeSceneId}`);
}

async function startXR(mode) {
  if (xrStartInFlight) {
    return { started: false, error: new Error("XR session start already in progress.") };
  }

  if (babylonRuntime.isXRSessionActive()) {
    return { started: true, error: null };
  }

  xrStartInFlight = true;
  try {
    babylonRuntime.ensureContext();
    babylonRuntime.startRenderLoop();
    setStatus(`Starting ${mode}...`);

    const xr = await babylonRuntime.ensureXRExperience();
    appMode = mode === "immersive-ar" ? "xr-ar" : "xr-vr";
    applyModeChange(appMode);
    babylonRuntime.setCameraControlsEnabled(false);
    setButtons({
      canStartVr: false,
      canStartAr: false,
      canStartSim: false,
      canEnd: true,
    });

    const resolvedAttempt = await enterXRWithFallbacks(xr, mode, { setStatus });
    if (mode === "immersive-vr") {
      pendingVrResumeAfterSceneChange = false;
      setResumeVrPromptVisible(false);
    }
    setStatus(`${mode} active using ${resolvedAttempt.label}. Rendering Babylon.js scene '${activeSceneId}'.`);
    return { started: true, error: null };
  } catch (error) {
    appMode = "idle";
    applyModeChange(appMode);
    babylonRuntime.stopRenderLoop();
    babylonRuntime.setCameraControlsEnabled(true);
    enableIdleButtons();
    applySceneTheme();
    setResumeVrPromptVisible(pendingVrResumeAfterSceneChange);
    setStatus(`Could not start ${mode}: ${error.message}`);
    return { started: false, error };
  } finally {
    xrStartInFlight = false;
    setResumeVrPromptVisible(pendingVrResumeAfterSceneChange);
  }
}

function startSimulation() {
  try {
    pendingVrResumeAfterSceneChange = false;
    setResumeVrPromptVisible(false);
    babylonRuntime.ensureContext();
    appMode = "simulation";
    babylonRuntime.setCameraControlsEnabled(true);
    applyModeChange(appMode);
    setButtons({
      canStartVr: false,
      canStartAr: false,
      canStartSim: false,
      canEnd: true,
    });

    babylonRuntime.startRenderLoop();
    setStatus(`Simulation active. Rendering scene '${activeSceneId}'.`);
    return { started: true, error: null };
  } catch (error) {
    appMode = "idle";
    enableIdleButtons();
    setStatus(`Could not start simulation: ${error.message}`);
    return { started: false, error };
  }
}

async function endCurrentSession() {
  if (babylonRuntime.isXRSessionActive()) {
    await babylonRuntime.exitXR();
    return;
  }

  if (appMode === "simulation") {
    appMode = "idle";
    babylonRuntime.stopRenderLoop();
    babylonRuntime.setCameraControlsEnabled(true);
    enableIdleButtons();
    applySceneTheme();
    setStatus("Simulation ended.");
  }
}

async function resumeVrAfterSceneTransition() {
  if (!isHeadsetRuntimePage || !isSceneReadyForVr()) {
    return;
  }

  setStatus(`Starting VR with scene '${activeSceneId}'...`);
  autoLaunchResolved = true;
  disarmAutoVrGestureLaunch();
  const result = await startXR("immersive-vr");
  if (result.started) {
    return;
  }

  pendingVrResumeAfterSceneChange = pendingVrResumeAfterSceneChange || isHeadsetRuntimePage;
  setResumeVrPromptVisible(true);
  const message = result.error instanceof Error ? result.error.message : "Unknown WebXR start error";
  setStatus(`Could not continue in VR: ${message}`);
}

/**
 * Chooses the preferred startup mode for the current device class.
 * VR-capable runtimes prefer immersive-vr, while laptops and AR/non-XR devices use browser simulation.
 */
async function maybeAutoLaunchPreferredMode(trigger = "auto") {
  if (autoLaunchResolved || appMode !== "idle") {
    return;
  }

  if (isLaptopPreviewPage && trigger === "auto") {
    const result = startSimulation();
    if (result.started) {
      autoLaunchResolved = true;
      setStatus(`Laptop preview active. Rendering scene '${activeSceneId}'.`);
    }
    return;
  }

  if (isHeadsetRuntimePage && trigger === "auto") {
    const result = startSimulation();
    if (result.started) {
      autoLaunchResolved = true;
      setResumeVrPromptVisible(isSceneReadyForVr());
      setStatus(
        isSceneReadyForVr()
          ? `Scene '${activeSceneId}' loaded. Press Fortsätt i VR to enter immersive VR.`
          : "Waiting for the guide to start the next scene.",
      );
    }
    return;
  }

  if (isBrowserSimulationPreferredRuntime()) {
    const result = startSimulation();
    if (result.started) {
      autoLaunchResolved = true;
      setStatus(`Scene browser simulation active. Rendering scene '${activeSceneId}'.`);
    }
    return;
  }

  const result = await startXR("immersive-vr");
  if (result.started) {
    autoLaunchResolved = true;
    disarmAutoVrGestureLaunch();
    return;
  }

  if (trigger === "auto" && isUserActivationError(result.error)) {
    armAutoVrGestureLaunch();
    setStatus("VR headset detected. Press anywhere once to enter immersive VR.");
    return;
  }

  if (trigger === "gesture") {
    setStatus("Could not enter immersive VR from the headset browser interaction. Use Start VR to retry.");
  }
}

async function initSupport() {
  if (!window.isSecureContext) {
    setStatus("WebXR requires a secure context (HTTPS or localhost). Simulation is available.");
    enableIdleButtons();
    await maybeAutoLaunchPreferredMode("auto");
    return;
  }

  if (!("xr" in navigator)) {
    setStatus("WebXR API is not available here. Use a WebXR headset/browser for VR or AR, or use simulation.");
    enableIdleButtons();
    await maybeAutoLaunchPreferredMode("auto");
    return;
  }

  try {
    const [vrSupported, arSupported] = await Promise.all([
      navigator.xr.isSessionSupported("immersive-vr"),
      navigator.xr.isSessionSupported("immersive-ar"),
    ]);

    support.vr = vrSupported;
    support.ar = arSupported;
    enableIdleButtons();

    if (vrSupported && arSupported) {
      setStatus("WebXR ready: both immersive-vr and immersive-ar are supported.");
      await maybeAutoLaunchPreferredMode("auto");
      return;
    }
    if (vrSupported) {
      setStatus("WebXR ready: immersive-vr is supported (immersive-ar is unavailable).");
      await maybeAutoLaunchPreferredMode("auto");
      return;
    }
    if (arSupported) {
      setStatus("WebXR ready: immersive-ar is supported (immersive-vr is unavailable).");
      await maybeAutoLaunchPreferredMode("auto");
      return;
    }

    setStatus("WebXR API is present, but immersive-vr/ar is not supported here. Simulation still works.");
    await maybeAutoLaunchPreferredMode("auto");
  } catch (error) {
    enableIdleButtons();
    setStatus(`Could not verify WebXR support: ${error.message}`);
    await maybeAutoLaunchPreferredMode("auto");
  }
}

populateMockSceneSelect();
sendMockSceneButton.disabled = false;
startVrButton.addEventListener("click", () => {
  disarmAutoVrGestureLaunch();
  autoLaunchResolved = true;
  startXR("immersive-vr");
});
startArButton.addEventListener("click", () => {
  disarmAutoVrGestureLaunch();
  autoLaunchResolved = true;
  startXR("immersive-ar");
});
startSimButton.addEventListener("click", startSimulation);
endButton.addEventListener("click", endCurrentSession);
resumeVrButton?.addEventListener("click", resumeVrAfterSceneTransition);
connectSessionButton.addEventListener("click", connectSceneStream);
sendMockSceneButton.addEventListener("click", sendMockScene);
canvas.tabIndex = 0;
window.addEventListener("beforeunload", () => {
  if (typeof unsubscribeScene === "function") {
    unsubscribeScene();
  }
  if (typeof unsubscribeTour === "function") {
    unsubscribeTour();
  }
  if (typeof unsubscribeActiveControls === "function") {
    unsubscribeActiveControls();
  }
  disarmAutoVrGestureLaunch();
  audioPlaybackManager.dispose();
});
window.addEventListener(SCENE_DEBUG_EVENT, handleSceneDebug);

setTourIndicator(activeTourState);
setSceneIndicator(activeSceneState);
setControlsIndicator(activeControlsState);
setSceneDebug("No scene diagnostics yet.");
enableIdleButtons();
initSupport().then(() => {
  bootstrapFromQuery();
  handleAutoStart();
});
// initSupport();
// bootstrapFromQuery();
// handleAutoStart();
