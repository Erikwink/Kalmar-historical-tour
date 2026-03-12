import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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

let xrSession = null;
let appMode = "idle";

let renderer = null;
let scene = null;
let camera = null;
let cube = null;
let controls = null;

/**
 * Uppdaterar statusraden för senaste klienthändelse.
 */
function setStatus(message) {
  statusEl.textContent = message;
}

/**
 * Visar aktuell scen som kommer från onSceneChange.
 */
function setSceneIndicator(sceneId) {
  sceneIndicatorEl.textContent = `Aktiv scen: ${sceneId}`;
}

/**
 * Sätter vilka primära UI-knappar som ska vara aktiva.
 */
function setButtons({ canStartVr, canStartAr, canStartSim, canEnd }) {
  startVrButton.disabled = !canStartVr;
  startArButton.disabled = !canStartAr;
  startSimButton.disabled = !canStartSim;
  endButton.disabled = !canEnd;
}

/**
 * Återställer knappläge när ingen XR/simulering körs.
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
 * Hämtar visuell theme-konfiguration för en scen.
 */
function getTheme(sceneId) {
  return SCENE_THEMES[sceneId] || SCENE_THEMES.default;
}

/**
 * Synkar canvas-storlek och kamera-aspect mot aktuell layout.
 */
function syncRendererSize() {
  if (!renderer || !camera) {
    return;
  }

  const width = canvas.clientWidth || 640;
  const height = canvas.clientHeight || 360;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

/**
 * Konfigurerar OrbitControls för musdrag (rotate/pan) och mushjulszoom.
 */
function setupOrbitControls() {
  if (!renderer || !camera || controls) {
    return;
  }

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = true;
  controls.minDistance = 0.8;
  controls.maxDistance = 6.0;
  controls.target.set(0, 1.45, -1.4);
  controls.update();
}

/**
 * Slår av/på OrbitControls beroende på om XR-session körs eller inte.
 */
function setControlsEnabled(enabled) {
  if (!controls) {
    return;
  }
  controls.enabled = enabled;
}

/**
 * Initierar minimal Three.js-kontext: renderer, scen, kamera, ljus och kub.
 */
function ensureThreeContext() {
  if (renderer) {
    return;
  }

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.xr.enabled = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 50);
  camera.position.set(0, 1.6, 2.2);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x2b3f54, 1.05);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(1.5, 2.2, 1.8);
  scene.add(keyLight);

  const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const material = new THREE.MeshStandardMaterial({
    color: 0x4f83ff,
    roughness: 0.35,
    metalness: 0.15,
  });
  cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 1.45, -1.4);
  scene.add(cube);

  syncRendererSize();
  setupOrbitControls();
  window.addEventListener("resize", syncRendererSize);
  applySceneTheme();
}

/**
 * Tillämpa färgtema på scenbakgrund och kub baserat på aktiv scen och mode.
 */
function applySceneTheme() {
  if (!renderer || !scene || !cube) {
    return;
  }

  const theme = getTheme(activeSceneId);
  cube.material.color.setHex(theme.cube);

  if (appMode === "xr-ar") {
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    return;
  }

  scene.background = new THREE.Color(theme.background);
  renderer.setClearColor(theme.background, 1);
}

/**
 * Render-loop som används för både XR-session och desktop-simulering.
 */
function renderFrame(time) {
  if (!renderer || !scene || !camera || !cube) {
    return;
  }

  const seconds = time * 0.001;
  cube.rotation.x = 0.2 + seconds * 0.5;
  cube.rotation.y = seconds * 0.9;
  cube.position.y = 1.45 + Math.sin(seconds * 1.5) * 0.05;

  if (controls && controls.enabled) {
    controls.update();
  }

  renderer.render(scene, camera);
}

/**
 * Hanterar inkommande scene-id från onSceneChange och uppdaterar rendering.
 */
function applySceneChange(sceneId) {
  if (!sceneId || typeof sceneId !== "string") {
    return;
  }

  activeSceneId = sceneId;
  setSceneIndicator(activeSceneId);
  applySceneTheme();
  setStatus(`Scen uppdaterad via onSceneChange (${sceneSource}): ${activeSceneId}`);
}

/**
 * Ansluter klienten till scene-streamen för ett session-id.
 */
function connectSceneStream() {
  const sessionId = sessionInput.value.trim();
  if (!sessionId) {
    setStatus("Session ID saknas.");
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
  setStatus(`Ansluten till onSceneChange för session ${sessionId} (${sceneSource}).`);
}

/**
 * Skickar mock-scen till BroadcastChannel för snabb lokal test.
 */
function sendMockScene() {
  if (!currentSessionId) {
    setStatus("Anslut först en session innan mock-scen skickas.");
    return;
  }
  if (sceneSource !== "mock-broadcast-channel") {
    setStatus("Mock-scener kan bara skickas när mock-broadcast-channel används.");
    return;
  }

  const sceneId = mockSceneSelect.value;
  publishMockScene(currentSessionId, sceneId);
  setStatus(`Mock-scen skickad: ${sceneId}`);
}

/**
 * Kör när browsern avslutar en XR-session och återställer klientläge.
 */
function onSessionEnded() {
  xrSession = null;
  if (appMode === "xr-vr" || appMode === "xr-ar") {
    appMode = "idle";
  }

  if (renderer) {
    renderer.setAnimationLoop(null);
  }
  setControlsEnabled(true);
  enableIdleButtons();
  applySceneTheme();
  setStatus(`XR-session avslutad. Senaste scen: ${activeSceneId}`);
}

/**
 * Startar en immersive-vr eller immersive-ar session och börjar render-loop.
 */
async function startXR(mode) {
  try {
    ensureThreeContext();
    setStatus(`Startar ${mode}...`);

    const sessionInit = {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
    };
    if (mode === "immersive-ar") {
      sessionInit.requiredFeatures = ["local"];
    }

    xrSession = await navigator.xr.requestSession(mode, sessionInit);
    appMode = mode === "immersive-ar" ? "xr-ar" : "xr-vr";
    xrSession.addEventListener("end", onSessionEnded, { once: true });

    setControlsEnabled(false);
    await renderer.xr.setSession(xrSession);
    applySceneTheme();

    setButtons({
      canStartVr: false,
      canStartAr: false,
      canStartSim: false,
      canEnd: true,
    });

    setStatus(`${mode} aktiv. Renderar Three.js-scen '${activeSceneId}'.`);
    renderer.setAnimationLoop(renderFrame);
  } catch (error) {
    xrSession = null;
    appMode = "idle";
    if (renderer) {
      renderer.setAnimationLoop(null);
    }
    setControlsEnabled(true);
    enableIdleButtons();
    applySceneTheme();
    setStatus(`Kunde inte starta ${mode}: ${error.message}`);
  }
}

/**
 * Startar desktop-simulering av samma Three.js-scen utan headset.
 */
function startSimulation() {
  try {
    ensureThreeContext();
    appMode = "simulation";
    setControlsEnabled(true);
    applySceneTheme();

    setButtons({
      canStartVr: false,
      canStartAr: false,
      canStartSim: false,
      canEnd: true,
    });

    setStatus(`Simuleringsläge aktivt. Renderar scen '${activeSceneId}'.`);
    renderer.setAnimationLoop(renderFrame);
  } catch (error) {
    appMode = "idle";
    enableIdleButtons();
    setStatus(`Kunde inte starta simulering: ${error.message}`);
  }
}

/**
 * Avslutar aktiv XR-session eller desktop-simulering.
 */
async function endCurrentSession() {
  if (xrSession) {
    await xrSession.end();
    return;
  }

  if (appMode === "simulation") {
    appMode = "idle";
    if (renderer) {
      renderer.setAnimationLoop(null);
    }
    setControlsEnabled(true);
    enableIdleButtons();
    applySceneTheme();
    setStatus("Simulering avslutad.");
  }
}

/**
 * Kontrollerar om browsern stöder immersive-vr/ar och uppdaterar UI.
 */
async function initSupport() {
  if (!window.isSecureContext) {
    setStatus("WebXR kräver secure context (HTTPS eller localhost). Simulering är tillgänglig.");
    enableIdleButtons();
    return;
  }

  if (!("xr" in navigator)) {
    setStatus("WebXR API saknas här. Använd headset/browser med WebXR för VR/AR, eller simulering.");
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
      setStatus("WebXR redo: både immersive-vr och immersive-ar stöds.");
      return;
    }
    if (vrSupported) {
      setStatus("WebXR redo: immersive-vr stöds (immersive-ar saknas).");
      return;
    }
    if (arSupported) {
      setStatus("WebXR redo: immersive-ar stöds (immersive-vr saknas).");
      return;
    }

    setStatus("WebXR API finns men immersive-vr/ar stöds inte här. Simulering fungerar ändå.");
  } catch (error) {
    enableIdleButtons();
    setStatus(`Kunde inte verifiera WebXR-stöd: ${error.message}`);
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
