import {
  ArcRotateCamera,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  UniversalCamera,
  Vector3,
  WebXRDefaultExperience,
  WebXRState,
} from "@babylonjs/core";
import {
  publishMockScene,
  subscribeToActiveControlsChanges,
  subscribeToSceneChanges,
  subscribeToTourIdChanges,
} from "./backendClient.js";
import { createAudioPlaybackManager } from "./audioPlayback.js";
import { createSceneManager, DEFAULT_SCENE_ID } from "./scenes/sceneCatalog.js";
import {
  getRenderableSceneControlSignature,
  getSelectableScenes,
  resolveActiveControls,
  resolveScene,
  resolveTour,
} from "../toursClient.js";

const statusEl = document.getElementById("status");
const tourIndicatorEl = document.getElementById("tour-indicator");
const sceneIndicatorEl = document.getElementById("scene-indicator");
const controlsIndicatorEl = document.getElementById("controls-indicator");
const sessionInput = document.getElementById("session-id");
const connectSessionButton = document.getElementById("connect-session");
const mockSceneSelect = document.getElementById("mock-scene-select");
const sendMockSceneButton = document.getElementById("send-mock-scene");
const startVrButton = document.getElementById("start-vr");
const startArButton = document.getElementById("start-ar");
const startSimButton = document.getElementById("start-sim");
const endButton = document.getElementById("end-xr");
const canvas = document.getElementById("xr-canvas");
const sceneDebugEl = document.getElementById("scene-debug");
const SCENE_DEBUG_EVENT = "kalmar:webxr-scene-debug";
const LOCOMOTION_TEST_SCENE_ID = "locomotion-test";
const LEFT_HANDEDNESS = "left";
const RIGHT_HANDEDNESS = "right";
const XR_MOVE_SPEED_METERS_PER_SECOND = 2.2;
const XR_MOVE_DEADZONE = 0.18;
const DESKTOP_EYE_HEIGHT_METERS = 1.7;
const FORWARD_AXIS = new Vector3(0, 0, 1);
const RIGHT_AXIS = new Vector3(1, 0, 0);

function getAutostartMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("autostart");
}

function handleAutoStart() {
  const mode = getAutostartMode();

  if (!mode) return;

  // Om vi vill auto-starta
  if (mode === "sim") {
    // Om VR stöds → prioritera VR
    if (support.vr) {
      startXR("immersive-vr");
      return;
    }

    // annars fallback
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

function normalizeSessionId(rawSessionId) {
  return typeof rawSessionId === "string" ? rawSessionId.trim() : "";
}

function getSessionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return normalizeSessionId(params.get("session"));
}

function getTourIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawTourId = params.get("tourId");
  return typeof rawTourId === "string" ? rawTourId.trim() : "";
}

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
let activeLocomotion = { enabled: false, floorMeshes: [] };
let registeredTeleportFloorMeshes = [];

let appMode = "idle";

let engine = null;
let scene = null;
let orbitCamera = null;
let desktopCamera = null;
let xrExperience = null;
let renderLoopActive = false;
let resizeHandlerRegistered = false;
let sceneManager = null;
let desktopLocomotionWasActive = false;
let autoLaunchResolved = false;
let autoVrGestureLaunchArmed = false;
let xrStartInFlight = false;
let sceneRefreshTimer = null;
const SCENE_REFRESH_DEBOUNCE_MS = 80;
const tmpForward = new Vector3();
const tmpRight = new Vector3();
const tmpMovement = new Vector3();
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

function setStatus(message) {
  statusEl.textContent = message;
}

function setTourIndicator(tourState) {
  if (!tourIndicatorEl) {
    return;
  }

  const title = tourState.tour?.title ?? tourState.resolvedTourId;
  const suffix = tourState.usedFallback ? " (fallback)" : "";
  tourIndicatorEl.textContent = `Active tour: ${title} [${tourState.resolvedTourId}]${suffix}`;
}

function setSceneIndicator(sceneState) {
  const label = sceneState.scene?.label ?? sceneState.resolvedSceneId;
  const suffix = sceneState.usedFallback ? " (fallback)" : "";
  sceneIndicatorEl.textContent = `Active scene: ${label} [${sceneState.resolvedSceneId}]${suffix}`;
}

function setControlsIndicator(controlsState) {
  if (!controlsIndicatorEl) {
    return;
  }

  const activeControlLabels = controlsState.activeControls.map((control) => control.label || control.id);
  controlsIndicatorEl.textContent = activeControlLabels.length
    ? `Active controls: ${activeControlLabels.join(", ")}`
    : "Active controls: none";
}

function setSceneDebug(message, tone = "info") {
  if (!sceneDebugEl) {
    return;
  }

  sceneDebugEl.textContent = message;
  sceneDebugEl.dataset.tone = tone;
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

function isUserActivationError(error) {
  const name = typeof error?.name === "string" ? error.name : "";
  const message = typeof error?.message === "string" ? error.message : "";
  return (
    name === "SecurityError" ||
    /user activation|transient activation|gesture|requestsession/i.test(message)
  );
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
  if (scene) {
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
  const nextRenderableSignature = getRenderableSceneControlSignature(activeControlsState.activeControls);
  if (scene && previousRenderableSignature !== nextRenderableSignature) {
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
}

function enableIdleButtons() {
  setButtons({
    canStartVr: support.vr,
    canStartAr: support.ar,
    canStartSim: true,
    canEnd: false,
  });
}

function syncEngineSize() {
  if (!engine) {
    return;
  }

  engine.resize();
}

function detachPreviewCameraControls() {
  orbitCamera?.detachControl();
  desktopCamera?.detachControl();
}

function setCameraControlsEnabled(enabled) {
  if (!orbitCamera || !desktopCamera) {
    return;
  }

  if (!enabled) {
    detachPreviewCameraControls();
    return;
  }

  syncPreviewCamera();
}

function startRenderLoop() {
  if (!engine || renderLoopActive) {
    return;
  }

  engine.runRenderLoop(renderFrame);
  renderLoopActive = true;
}

function stopRenderLoop() {
  if (!engine || !renderLoopActive) {
    return;
  }

  engine.stopRenderLoop(renderFrame);
  renderLoopActive = false;
}

function getSceneManager() {
  if (!scene) {
    return null;
  }

  if (!sceneManager) {
    sceneManager = createSceneManager(scene);
  }
  return sceneManager;
}

/**
 * Stores locomotion metadata for the active scene and syncs XR features when available.
 */
function applyLocomotionState(renderState) {
  activeLocomotion = renderState?.locomotion || { enabled: false, floorMeshes: [] };
  syncXRTeleportationState();
}

/**
 * Returns true only when the dedicated locomotion scene is active in immersive VR.
 */
function isVRLocomotionActive() {
  return appMode === "xr-vr" && activeSceneId === LOCOMOTION_TEST_SCENE_ID && activeLocomotion.enabled;
}

/**
 * Returns true only when the locomotion test scene is active in desktop simulation mode.
 */
function isDesktopLocomotionActive() {
  return appMode === "simulation" && activeSceneId === LOCOMOTION_TEST_SCENE_ID && activeLocomotion.enabled;
}

/**
 * Enables or disables Babylon teleportation and keeps its floor meshes aligned with the active scene.
 */
function syncXRTeleportationState() {
  if (!xrExperience?.teleportation) {
    return;
  }

  registeredTeleportFloorMeshes.forEach((mesh) => {
    if (!mesh.isDisposed()) {
      xrExperience.teleportation.removeFloorMesh(mesh);
    }
  });
  registeredTeleportFloorMeshes = [];

  const shouldEnableTeleportation = isVRLocomotionActive();
  xrExperience.teleportation.teleportationEnabled = shouldEnableTeleportation;

  if (!shouldEnableTeleportation) {
    if (activeSceneId === LOCOMOTION_TEST_SCENE_ID) {
      setSceneDebug(
        "Locomotion test scene is loaded. Teleportation and thumbstick movement will activate in immersive-vr; headset verification is still required.",
      );
    }
    return;
  }

  activeLocomotion.floorMeshes.forEach((mesh) => {
    if (!mesh || mesh.isDisposed()) {
      return;
    }

    xrExperience.teleportation.addFloorMesh(mesh);
    registeredTeleportFloorMeshes.push(mesh);
  });

  setSceneDebug(
    "Locomotion test scene is active. Teleportation is wired to the right-hand controller; left thumbstick movement is enabled in VR.",
    "success",
  );
}

/**
 * Reads the left controller thumbstick/touchpad and applies smooth locomotion to the XR camera.
 */
function updateXRThumbstickMovement(deltaSeconds) {
  if (!isVRLocomotionActive() || !xrExperience?.input || !xrExperience?.baseExperience?.camera) {
    return;
  }

  const leftController = xrExperience.input.controllers.find((controller) => {
    return controller.inputSource.handedness === LEFT_HANDEDNESS && controller.motionController;
  });
  const movementComponent =
    leftController?.motionController?.getComponentOfType("thumbstick") ||
    leftController?.motionController?.getComponentOfType("touchpad");

  if (!movementComponent) {
    return;
  }

  const moveX = Math.abs(movementComponent.axes.x) > XR_MOVE_DEADZONE ? movementComponent.axes.x : 0;
  const moveY = Math.abs(movementComponent.axes.y) > XR_MOVE_DEADZONE ? movementComponent.axes.y : 0;
  if (!moveX && !moveY) {
    return;
  }

  const xrCamera = xrExperience.baseExperience.camera;
  xrCamera.getDirectionToRef(FORWARD_AXIS, tmpForward);
  xrCamera.getDirectionToRef(RIGHT_AXIS, tmpRight);

  tmpForward.y = 0;
  tmpRight.y = 0;
  if (tmpForward.lengthSquared() < 0.0001 || tmpRight.lengthSquared() < 0.0001) {
    return;
  }

  tmpForward.normalize();
  tmpRight.normalize();
  tmpMovement.copyFrom(tmpRight).scaleInPlace(moveX);
  tmpMovement.addInPlace(tmpForward.scale(-moveY));

  if (tmpMovement.lengthSquared() < 0.0001) {
    return;
  }

  tmpMovement.normalize().scaleInPlace(XR_MOVE_SPEED_METERS_PER_SECOND * deltaSeconds);
  xrCamera.position.addInPlace(tmpMovement);
}

/**
 * Resets the desktop locomotion preview camera to a predictable starting pose.
 */
function resetDesktopLocomotionCamera() {
  if (!desktopCamera) {
    return;
  }

  desktopCamera.position.set(0, DESKTOP_EYE_HEIGHT_METERS, 4.5);
  desktopCamera.rotation.set(0, Math.PI, 0);
}

/**
 * Switches between orbit preview and desktop locomotion preview based on mode and active scene.
 */
function syncPreviewCamera() {
  if (!scene || !orbitCamera || !desktopCamera) {
    return;
  }

  const shouldUseDesktopLocomotion = isDesktopLocomotionActive();
  if (shouldUseDesktopLocomotion && !desktopLocomotionWasActive) {
    resetDesktopLocomotionCamera();
  }
  desktopLocomotionWasActive = shouldUseDesktopLocomotion;

  const nextCamera = shouldUseDesktopLocomotion ? desktopCamera : orbitCamera;
  if (scene.activeCamera !== nextCamera) {
    scene.activeCamera = nextCamera;
  }

  detachPreviewCameraControls();
  if (appMode === "xr-vr" || appMode === "xr-ar") {
    return;
  }

  nextCamera.attachControl(canvas, true);
  if (shouldUseDesktopLocomotion) {
    canvas.focus();
    setSceneDebug(
      "Desktop locomotion active. Use W/A/S/D or arrow keys to move, drag with the mouse to look around, and double-click a floor surface to teleport.",
      "success",
    );
  }
}

/**
 * Teleports the desktop preview camera to the clicked locomotion surface for local scene verification.
 */
function teleportDesktopPreviewToPointer() {
  if (!isDesktopLocomotionActive() || !scene || !desktopCamera) {
    return;
  }

  const pick = scene.pick(scene.pointerX, scene.pointerY, (mesh) => {
    return activeLocomotion.floorMeshes.includes(mesh);
  });
  if (!pick?.hit || !pick.pickedPoint) {
    return;
  }

  desktopCamera.position.set(
    pick.pickedPoint.x,
    pick.pickedPoint.y + DESKTOP_EYE_HEIGHT_METERS,
    pick.pickedPoint.z,
  );
  setSceneDebug(
    "Desktop teleport applied. Use W/A/S/D or arrow keys to continue moving around the locomotion test scene.",
    "success",
  );
}

function applySceneTheme() {
  if (!scene) {
    return;
  }

  const manager = getSceneManager();
  if (!manager) {
    return;
  }

  const mode = appMode === "xr-ar" ? "xr-ar" : appMode === "xr-vr" ? "xr-vr" : "simulation";
  const renderState = manager.setScene(
    {
      ...(activeSceneState.scene || { id: activeSceneId }),
      activeControls: activeControlsState.activeControls,
    },
    mode,
  );
  applyLocomotionState(renderState);
  syncPreviewCamera();
  syncActiveMediaPlayback();

  if (renderState?.clearColor) {
    scene.clearColor = renderState.clearColor;
  }
}

function scheduleSceneThemeRefresh() {
  if (sceneRefreshTimer !== null) {
    window.clearTimeout(sceneRefreshTimer);
  }

  sceneRefreshTimer = window.setTimeout(() => {
    sceneRefreshTimer = null;
    if (!scene) {
      return;
    }

    try {
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
  setSceneIndicator(activeSceneState);
  setControlsIndicator(activeControlsState);
  if (!scene) {
    const requestedSceneId = activeSceneState.requestedSceneId || activeSceneState.resolvedSceneId;
    setSceneDebug(
      `Scene '${requestedSceneId}' resolved to '${activeSceneState.resolvedSceneId}'. Babylon scene not initialized yet; render will start when XR/simulation starts.`,
    );
  } else {
    setSceneDebug(`Scene '${activeSceneId}' is active. Waiting for scene-specific diagnostics...`);
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

function onModeChanged(mode) {
  if (!scene) {
    syncActiveMediaPlayback();
    return;
  }

  const manager = getSceneManager();
  if (!manager) {
    return;
  }

  const renderState = manager.setMode(mode);
  applyLocomotionState(renderState);
  syncPreviewCamera();
  syncActiveMediaPlayback();
  if (!renderState?.clearColor) {
    return;
  }

  const nextColor = mode === "xr-ar" ? new Color4(0, 0, 0, 0) : renderState.clearColor;
  scene.clearColor = nextColor;
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

function ensureSceneManager() {
  getSceneManager();
}

function renderFrame() {
  if (!scene) {
    return;
  }

  const t = performance.now() * 0.001;
  const dt = engine?.getDeltaTime() ? engine.getDeltaTime() / 1000 : 0.016;

  const screen = scene.getMeshByName("screen-orb") || scene.getMeshByName("screen-pedestal") || null;
  if (screen) {
    screen.rotation.y = t * 0.2;
  }

  updateXRThumbstickMovement(dt);
  scene.render();
}

function ensureBabylonContext() {
  if (scene) {
    return;
  }

  engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    xrCompatible: true,
  });
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

  scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0, 1);

  orbitCamera = new ArcRotateCamera(
    "preview-camera",
    -Math.PI / 2,
    Math.PI / 2.35,
    3.1,
    new Vector3(0, 1.45, -1.4),
    scene,
  );
  orbitCamera.lowerRadiusLimit = 0.8;
  orbitCamera.upperRadiusLimit = 6;
  orbitCamera.wheelPrecision = 35;
  orbitCamera.panningSensibility = 0;

  desktopCamera = new UniversalCamera(
    "desktop-locomotion-camera",
    new Vector3(0, DESKTOP_EYE_HEIGHT_METERS, 4.5),
    scene,
  );
  desktopCamera.minZ = 0.05;
  desktopCamera.speed = 0.18;
  desktopCamera.angularSensibility = 3500;
  desktopCamera.keysUp.push(87);
  desktopCamera.keysLeft.push(65);
  desktopCamera.keysDown.push(83);
  desktopCamera.keysRight.push(68);
  resetDesktopLocomotionCamera();
  scene.activeCamera = orbitCamera;
  orbitCamera.attachControl(canvas, true);

  const hemiLight = new HemisphericLight("hemi-light", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 1.05;

  const keyLight = new DirectionalLight("key-light", new Vector3(-0.6, -1, -0.7), scene);
  keyLight.position = new Vector3(1.5, 2.2, 1.8);
  keyLight.intensity = 0.9;

  syncEngineSize();
  if (!resizeHandlerRegistered) {
    window.addEventListener("resize", syncEngineSize);
    resizeHandlerRegistered = true;
  }

  ensureSceneManager();
  applySceneTheme();
}

async function ensureXRExperience() {
  if (xrExperience) {
    return xrExperience;
  }

  xrExperience = await WebXRDefaultExperience.CreateAsync(scene, {
    disableDefaultUI: true,
    disableNearInteraction: true,
    disablePointerSelection: false,
    disableTeleportation: false,
    floorMeshes: [],
    teleportationOptions: {
      forceHandedness: RIGHT_HANDEDNESS,
      backwardsMovementEnabled: false,
      timeToTeleportStart: 0,
    },
  });
  xrExperience.teleportation.teleportationEnabled = false;
  xrExperience.baseExperience.onStateChangedObservable.add((state) => {
    if (state === WebXRState.NOT_IN_XR && (appMode === "xr-vr" || appMode === "xr-ar")) {
      onSessionEnded();
    }
  });

  return xrExperience;
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
  if (appMode === "xr-vr" || appMode === "xr-ar") {
    appMode = "idle";
  }

  stopRenderLoop();
  setCameraControlsEnabled(true);
  enableIdleButtons();
  onModeChanged("simulation");
  applySceneTheme();
  syncXRTeleportationState();
  setStatus(`XR session ended. Latest scene: ${activeSceneId}`);
}

async function startXR(mode) {
  if (xrStartInFlight) {
    return { started: false, error: new Error("XR session start already in progress.") };
  }

  if (xrExperience && xrExperience.baseExperience.state !== WebXRState.NOT_IN_XR) {
    return { started: true, error: null };
  }

  xrStartInFlight = true;
  try {
    ensureBabylonContext();
    startRenderLoop();
    setStatus(`Starting ${mode}...`);

    const xr = await ensureXRExperience();
    const referenceSpaceType = mode === "immersive-ar" ? "local" : "local-floor";
    const sessionInit = {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
    };
    if (mode === "immersive-ar") {
      sessionInit.requiredFeatures = ["local"];
    }

    appMode = mode === "immersive-ar" ? "xr-ar" : "xr-vr";
    onModeChanged(appMode);
    setCameraControlsEnabled(false);
    setButtons({
      canStartVr: false,
      canStartAr: false,
      canStartSim: false,
      canEnd: true,
    });

    await xr.baseExperience.enterXRAsync(
      mode,
      referenceSpaceType,
      xr.renderTarget,
      sessionInit,
    );
    syncXRTeleportationState();
    setStatus(`${mode} active. Rendering Babylon.js scene '${activeSceneId}'.`);
    return { started: true, error: null };
  } catch (error) {
    appMode = "idle";
    onModeChanged(appMode);
    stopRenderLoop();
    setCameraControlsEnabled(true);
    enableIdleButtons();
    applySceneTheme();
    syncXRTeleportationState();
    setStatus(`Could not start ${mode}: ${error.message}`);
    return { started: false, error };
  } finally {
    xrStartInFlight = false;
  }
}

function startSimulation() {
  try {
    ensureBabylonContext();
    appMode = "simulation";
    setCameraControlsEnabled(true);
    onModeChanged(appMode);
    syncXRTeleportationState();
    setButtons({
      canStartVr: false,
      canStartAr: false,
      canStartSim: false,
      canEnd: true,
    });

    startRenderLoop();
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
  if (xrExperience && xrExperience.baseExperience.state !== WebXRState.NOT_IN_XR) {
    await xrExperience.baseExperience.sessionManager.exitXRAsync();
    return;
  }

  if (appMode === "simulation") {
    appMode = "idle";
    stopRenderLoop();
    setCameraControlsEnabled(true);
    enableIdleButtons();
    applySceneTheme();
    syncXRTeleportationState();
    setStatus("Simulation ended.");
  }
}

/**
 * Chooses the preferred startup mode for the current device class.
 * VR-capable runtimes prefer immersive-vr, while laptops and AR/non-XR devices use browser simulation.
 */
async function maybeAutoLaunchPreferredMode(trigger = "auto") {
  if (autoLaunchResolved || appMode !== "idle") {
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
connectSessionButton.addEventListener("click", connectSceneStream);
sendMockSceneButton.addEventListener("click", sendMockScene);
canvas.tabIndex = 0;
canvas.addEventListener("dblclick", teleportDesktopPreviewToPointer);
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
