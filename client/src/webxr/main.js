import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  WebXRDefaultExperience,
  WebXRState,
} from "@babylonjs/core";
import { publishMockScene, subscribeToSceneChanges } from "./backendClient.js";

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

const SCENE_THEMES = {
  waiting: { background: 0x0c1426, cube: 0x4f83ff },
  "remove-headset": { background: 0x2a0f10, cube: 0xff8c76 },
  castle: { background: 0x2a1a12, cube: 0xffc477 },
  church: { background: 0x10253a, cube: 0x8bc5ff },
  boats: { background: 0x0e2f33, cube: 0x6ce5db },
  default: { background: 0x1d1d1f, cube: 0xd7d7d7 },
};

const support = {
  vr: false,
  ar: false,
};

let activeSceneId = "waiting";
let sceneSource = "not-connected";
let currentSessionId = "";
let unsubscribeScene = null;

let appMode = "idle";

let engine = null;
let scene = null;
let camera = null;
let cube = null;
let cubeMaterial = null;
let xrExperience = null;
let renderLoopActive = false;
let resizeHandlerRegistered = false;

/**
 * Updates the status line with the latest client event.
 */
function setStatus(message) {
  statusEl.textContent = message;
}

/**
 * Shows the active scene that arrived through onSceneChange.
 */
function setSceneIndicator(sceneId) {
  sceneIndicatorEl.textContent = `Active scene: ${sceneId}`;
}

/**
 * Sets which primary UI buttons should be enabled.
 */
function setButtons({ canStartVr, canStartAr, canStartSim, canEnd }) {
  startVrButton.disabled = !canStartVr;
  startArButton.disabled = !canStartAr;
  startSimButton.disabled = !canStartSim;
  endButton.disabled = !canEnd;
}

/**
 * Restores the button state when no XR session or simulation is running.
 */
function enableIdleButtons() {
  setButtons({
    canStartVr: support.vr,
    canStartAr: support.ar,
    canStartSim: true,
    canEnd: false,
  });
}

/**
 * Returns the visual theme configuration for a scene.
 */
function getTheme(sceneId) {
  return SCENE_THEMES[sceneId] || SCENE_THEMES.default;
}

/**
 * Converts a numeric hex color into a Babylon Color3 instance.
 */
function toColor3(hexColor) {
  return Color3.FromHexString(`#${hexColor.toString(16).padStart(6, "0")}`);
}

/**
 * Converts a numeric hex color into a Babylon Color4 instance.
 */
function toColor4(hexColor, alpha = 1) {
  const color = toColor3(hexColor);
  return new Color4(color.r, color.g, color.b, alpha);
}

/**
 * Synchronizes the engine size with the current canvas layout.
 */
function syncEngineSize() {
  if (!engine) {
    return;
  }

  engine.resize();
}

/**
 * Enables or disables desktop camera controls based on app state.
 */
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

/**
 * Starts the Babylon render loop if it is not already running.
 */
function startRenderLoop() {
  if (!engine || renderLoopActive) {
    return;
  }

  engine.runRenderLoop(renderFrame);
  renderLoopActive = true;
}

/**
 * Stops the Babylon render loop when the app returns to idle.
 */
function stopRenderLoop() {
  if (!engine || !renderLoopActive) {
    return;
  }

  engine.stopRenderLoop(renderFrame);
  renderLoopActive = false;
}

/**
 * Initializes the Babylon scene, camera, lights, and preview mesh.
 */
function ensureBabylonContext() {
  if (engine) {
    return;
  }

  engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    xrCompatible: true,
  });
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

  scene = new Scene(engine);
  scene.clearColor = toColor4(SCENE_THEMES.default.background);

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

  cube = MeshBuilder.CreateBox("scene-cube", { size: 0.6 }, scene);
  cube.position = new Vector3(0, 1.45, -1.4);

  cubeMaterial = new StandardMaterial("scene-cube-material", scene);
  cubeMaterial.diffuseColor = toColor3(SCENE_THEMES.waiting.cube);
  cubeMaterial.specularColor = new Color3(0.12, 0.12, 0.12);
  cube.material = cubeMaterial;

  syncEngineSize();
  if (!resizeHandlerRegistered) {
    window.addEventListener("resize", syncEngineSize);
    resizeHandlerRegistered = true;
  }
  applySceneTheme();
}

/**
 * Creates the Babylon WebXR helper the first time XR mode is requested.
 */
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

/**
 * Applies the active scene theme to the Babylon background and preview mesh.
 */
function applySceneTheme() {
  if (!scene || !cubeMaterial) {
    return;
  }

  const theme = getTheme(activeSceneId);
  cubeMaterial.diffuseColor = toColor3(theme.cube);
  cubeMaterial.alpha = appMode === "xr-ar" ? 0.85 : 1;

  if (appMode === "xr-ar") {
    scene.clearColor = new Color4(0, 0, 0, 0);
    return;
  }

  scene.clearColor = toColor4(theme.background);
}

/**
 * Renders and animates the preview scene for both XR and desktop simulation.
 */
function renderFrame() {
  if (!scene || !cube) {
    return;
  }

  const seconds = performance.now() * 0.001;
  cube.rotation.x = 0.2 + seconds * 0.5;
  cube.rotation.y = seconds * 0.9;
  cube.position.y = 1.45 + Math.sin(seconds * 1.5) * 0.05;

  scene.render();
}

/**
 * Handles incoming scene IDs from onSceneChange and refreshes the preview.
 */
function applySceneChange(sceneId) {
  if (!sceneId || typeof sceneId !== "string") {
    return;
  }

  activeSceneId = sceneId;
  setSceneIndicator(activeSceneId);
  applySceneTheme();
  setStatus(`Scene updated via onSceneChange (${sceneSource}): ${activeSceneId}`);
}

/**
 * Connects the client to the scene stream for a session ID.
 */
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

  const { source, unsubscribe } = subscribeToSceneChanges(sessionId, applySceneChange);
  currentSessionId = sessionId;
  sceneSource = source;
  unsubscribeScene = typeof unsubscribe === "function" ? unsubscribe : null;
  sendMockSceneButton.disabled = sceneSource !== "mock-broadcast-channel";
  connectSessionButton.textContent = "Reconnect Scene Stream";
  setStatus(`Connected to onSceneChange for session ${sessionId} (${sceneSource}).`);
}

/**
 * Sends a mock scene through BroadcastChannel for quick local testing.
 */
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

/**
 * Runs when the browser exits an XR session and restores idle client state.
 */
function onSessionEnded() {
  if (appMode === "xr-vr" || appMode === "xr-ar") {
    appMode = "idle";
  }

  stopRenderLoop();
  setCameraControlsEnabled(true);
  enableIdleButtons();
  applySceneTheme();
  setStatus(`XR session ended. Latest scene: ${activeSceneId}`);
}

/**
 * Starts an immersive VR or AR session and enters Babylon WebXR mode.
 */
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
    setCameraControlsEnabled(false);
    applySceneTheme();
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
    stopRenderLoop();
    setCameraControlsEnabled(true);
    enableIdleButtons();
    applySceneTheme();
    setStatus(`Could not start ${mode}: ${error.message}`);
  }
}

/**
 * Starts desktop simulation of the same Babylon scene without a headset.
 */
function startSimulation() {
  try {
    ensureBabylonContext();
    appMode = "simulation";
    setCameraControlsEnabled(true);
    applySceneTheme();
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

/**
 * Ends the active XR session or the desktop simulation.
 */
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

/**
 * Checks whether the browser supports immersive VR/AR and updates the UI.
 */
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
