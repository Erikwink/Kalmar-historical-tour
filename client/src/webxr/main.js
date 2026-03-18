import {
  ArcRotateCamera,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
  WebXRDefaultExperience,
  WebXRState,
} from "@babylonjs/core";
import { publishMockScene, subscribeToSceneChanges } from "./backendClient.js";
import { createSceneManager, DEFAULT_SCENE_ID, SCENE_SEQUENCE } from "./scenes/sceneCatalog.js";

const statusEl = document.getElementById("status");
const sceneIndicatorEl = document.getElementById("scene-indicator");
const sessionInput = document.getElementById("session-id");
const connectSessionButton = document.getElementById("connect-session");
const mockSceneSelect = document.getElementById("mock-scene-select");
const sendMockSceneButton = document.getElementById("send-mock-scene");
const startVrButton = document.getElementById("start-vr");
const startArButton = document.getElementById("start-ar");
const startSimButton = document.getElementById("start-sim");
const endButton = document.getElementById("end-xr");
const canvas = document.getElementById("xr-canvas");

const support = {
  vr: false,
  ar: false,
};

let activeSceneId = DEFAULT_SCENE_ID;
let sceneSource = "not-connected";
let currentSessionId = "";
let unsubscribeScene = null;

let appMode = "idle";

let engine = null;
let scene = null;
let camera = null;
let xrExperience = null;
let renderLoopActive = false;
let resizeHandlerRegistered = false;
let sceneManager = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function setSceneIndicator(sceneId) {
  sceneIndicatorEl.textContent = `Active scene: ${sceneId}`;
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

function setCameraControlsEnabled(enabled) {
  if (!camera) {
    return;
  }

  if (enabled) {
    camera.attachControl(canvas, true);
    return;
  }

  camera.detachControl();
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
  if (!sceneManager) {
    sceneManager = createSceneManager(scene);
  }
  return sceneManager;
}

function applySceneTheme() {
  const manager = getSceneManager();
  const mode = appMode === "xr-ar" ? "xr-ar" : appMode === "xr-vr" ? "xr-vr" : "simulation";
  const renderState = manager.setScene(activeSceneId, mode);

  if (renderState?.clearColor) {
    scene.clearColor = renderState.clearColor;
  }
}

function applySceneChange(sceneId) {
  if (!sceneId || typeof sceneId !== "string") {
    return;
  }

  activeSceneId = sceneId;
  setSceneIndicator(activeSceneId);
  applySceneTheme();
  setStatus(`Scene updated via onSceneChange (${sceneSource}): ${activeSceneId}`);
}

function onModeChanged(mode) {
  const manager = getSceneManager();
  const renderState = manager.setMode(mode);
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
  SCENE_SEQUENCE.forEach((sceneId) => {
    const option = document.createElement("option");
    option.value = sceneId;
    option.textContent = sceneId;
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

  const screen = scene.getMeshByName("screen-orb") || scene.getMeshByName("screen-pedestal") || null;
  if (screen) {
    screen.rotation.y = t * 0.2;
  }

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

  camera = new ArcRotateCamera(
    "preview-camera",
    -Math.PI / 2,
    Math.PI / 2.35,
    3.1,
    new Vector3(0, 1.45, -1.4),
    scene,
  );
  camera.lowerRadiusLimit = 0.8;
  camera.upperRadiusLimit = 6;
  camera.wheelPrecision = 35;
  camera.panningSensibility = 0;
  camera.attachControl(canvas, true);

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
    disablePointerSelection: true,
    disableTeleportation: true,
  });
  xrExperience.baseExperience.onStateChangedObservable.add((state) => {
    if (state === WebXRState.NOT_IN_XR && (appMode === "xr-vr" || appMode === "xr-ar")) {
      onSessionEnded();
    }
  });

  return xrExperience;
}

function connectSceneStream() {
  const sessionId = sessionInput.value.trim();
  if (!sessionId) {
    setStatus("Session ID is required.");
    return;
  }

  if (typeof unsubscribeScene === "function") {
    unsubscribeScene();
    unsubscribeScene = null;
  }

  const subscription = subscribeToSceneChanges(sessionId, applySceneChange);
  currentSessionId = sessionId;
  sceneSource = subscription.source;
  unsubscribeScene = typeof subscription.unsubscribe === "function" ? subscription.unsubscribe : null;
  sendMockSceneButton.disabled = sceneSource !== "mock-broadcast-channel";
  connectSessionButton.textContent = "Reconnect Scene Stream";
  setStatus(`Connected to onSceneChange for session ${sessionId} (${sceneSource}).`);
}

function sendMockScene() {
  if (!currentSessionId) {
    setStatus("Connect a session before sending a mock scene.");
    return;
  }

  if (sceneSource !== "mock-broadcast-channel") {
    setStatus("Mock scenes can only be sent when the mock BroadcastChannel is active.");
    return;
  }

  const sceneId = mockSceneSelect.value;
  publishMockScene(currentSessionId, sceneId);
  setStatus(`Mock scene sent: ${sceneId}`);
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
  setStatus(`XR session ended. Latest scene: ${activeSceneId}`);
}

async function startXR(mode) {
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
    setStatus(`${mode} active. Rendering Babylon.js scene '${activeSceneId}'.`);
  } catch (error) {
    appMode = "idle";
    onModeChanged(appMode);
    stopRenderLoop();
    setCameraControlsEnabled(true);
    enableIdleButtons();
    applySceneTheme();
    setStatus(`Could not start ${mode}: ${error.message}`);
  }
}

function startSimulation() {
  try {
    ensureBabylonContext();
    appMode = "simulation";
    setCameraControlsEnabled(true);
    onModeChanged(appMode);
    setButtons({
      canStartVr: false,
      canStartAr: false,
      canStartSim: false,
      canEnd: true,
    });

    startRenderLoop();
    setStatus(`Simulation active. Rendering scene '${activeSceneId}'.`);
  } catch (error) {
    appMode = "idle";
    enableIdleButtons();
    setStatus(`Could not start simulation: ${error.message}`);
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
    setStatus("Simulation ended.");
  }
}

async function initSupport() {
  if (!window.isSecureContext) {
    setStatus("WebXR requires a secure context (HTTPS or localhost). Simulation is available.");
    enableIdleButtons();
    return;
  }

  if (!("xr" in navigator)) {
    setStatus("WebXR API is not available here. Use a WebXR headset/browser for VR or AR, or use simulation.");
    enableIdleButtons();
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
      return;
    }
    if (vrSupported) {
      setStatus("WebXR ready: immersive-vr is supported (immersive-ar is unavailable).");
      return;
    }
    if (arSupported) {
      setStatus("WebXR ready: immersive-ar is supported (immersive-vr is unavailable).");
      return;
    }

    setStatus("WebXR API is present, but immersive-vr/ar is not supported here. Simulation still works.");
  } catch (error) {
    enableIdleButtons();
    setStatus(`Could not verify WebXR support: ${error.message}`);
  }
}

populateMockSceneSelect();
startVrButton.addEventListener("click", () => startXR("immersive-vr"));
startArButton.addEventListener("click", () => startXR("immersive-ar"));
startSimButton.addEventListener("click", startSimulation);
endButton.addEventListener("click", endCurrentSession);
connectSessionButton.addEventListener("click", connectSceneStream);
sendMockSceneButton.addEventListener("click", sendMockScene);
window.addEventListener("beforeunload", () => {
  if (typeof unsubscribeScene === "function") {
    unsubscribeScene();
  }
});

setSceneIndicator(activeSceneId);
enableIdleButtons();
initSupport();
