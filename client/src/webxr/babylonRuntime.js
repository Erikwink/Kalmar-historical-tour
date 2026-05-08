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

/**
 * Owns Babylon engine, camera, render loop, and WebXR default experience setup.
 * Application state remains in main.js; this module only renders the state it receives.
 */
export function createBabylonRuntime({ canvas, createSceneManager, onXRSessionEnded }) {
  let engine = null;
  let scene = null;
  let orbitCamera = null;
  let xrExperience = null;
  let renderLoopActive = false;
  let resizeHandlerRegistered = false;
  let sceneManager = null;

  function hasScene() {
    return Boolean(scene);
  }

  function isXRSessionActive() {
    return Boolean(xrExperience && xrExperience.baseExperience.state !== WebXRState.NOT_IN_XR);
  }

  function syncEngineSize() {
    if (engine) {
      engine.resize();
    }
  }

  function detachCameraControls() {
    orbitCamera?.detachControl();
  }

  function setCameraControlsEnabled(enabled) {
    if (!orbitCamera) {
      return;
    }

    if (!enabled) {
      detachCameraControls();
      return;
    }

    orbitCamera.attachControl(canvas, true);
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

  function applyScene(sceneRef, mode) {
    const manager = getSceneManager();
    if (!manager) {
      return null;
    }

    const renderState = manager.setScene(sceneRef, mode);
    orbitCamera?.attachControl(canvas, true);

    if (renderState?.clearColor) {
      scene.clearColor = renderState.clearColor;
    }

    return renderState;
  }

  function setMode(mode) {
    const manager = getSceneManager();
    if (!manager) {
      return null;
    }

    const renderState = manager.setMode(mode);
    orbitCamera?.attachControl(canvas, true);
    if (renderState?.clearColor) {
      scene.clearColor = mode === "xr-ar" ? new Color4(0, 0, 0, 0) : renderState.clearColor;
    }
    return renderState;
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

  function ensureContext() {
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
  }

  async function ensureXRExperience() {
    if (xrExperience) {
      return xrExperience;
    }

    xrExperience = await WebXRDefaultExperience.CreateAsync(scene, {
      disableDefaultUI: true,
      disableNearInteraction: true,
      disablePointerSelection: false,
      disableTeleportation: true,
    });
    xrExperience.baseExperience.onStateChangedObservable.add((state) => {
      if (state === WebXRState.NOT_IN_XR) {
        onXRSessionEnded();
      }
    });

    return xrExperience;
  }

  async function exitXR() {
    if (isXRSessionActive()) {
      await xrExperience.baseExperience.sessionManager.exitXRAsync();
    }
  }

  return {
    hasScene,
    isXRSessionActive,
    ensureContext,
    ensureXRExperience,
    exitXR,
    startRenderLoop,
    stopRenderLoop,
    setCameraControlsEnabled,
    applyScene,
    setMode,
  };
}
