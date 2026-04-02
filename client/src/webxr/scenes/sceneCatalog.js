import {
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";

const DEFAULT_SCENE_ID = "waiting";
const SCENE_ALIAS = {
  boat: "boats",
};
const CASTLE_MODEL_ROOT_URL = "/models/";
const CASTLE_MODEL_FILE = "herstmonceux_castle.glb";
const SCENE_DEBUG_EVENT = "kalmar:webxr-scene-debug";

export const SCENE_SEQUENCE = ["waiting", "castle", "church", "boats", "locomotion-test", "remove-headset"];

const SCENE_LIBRARY = {
  waiting: {
    displayName: "Waiting",
    clearColor: "#0c1426",
    ground: "#13213a",
    accent: "#4f83ff",
    build: buildWaitingScreen,
  },
  castle: {
    displayName: "Castle",
    clearColor: "#2a1a12",
    ground: "#30210f",
    accent: "#ffc36b",
    build: buildCastleScreen,
  },
  church: {
    displayName: "Church",
    clearColor: "#10253a",
    ground: "#132b48",
    accent: "#9ad0ff",
    build: buildChurchScreen,
  },
  "locomotion-test": {
    displayName: "Locomotion Test",
    clearColor: "#10161f",
    ground: "#1a2230",
    accent: "#90f7c9",
    build: buildLocomotionTestScreen,
  },
  boats: {
    displayName: "Boats",
    clearColor: "#0e2f33",
    ground: "#173d45",
    accent: "#6ce5db",
    build: buildBoatsScreen,
  },
  "remove-headset": {
    displayName: "Remove Headset",
    clearColor: "#2a0f10",
    ground: "#41161b",
    accent: "#ff8f76",
    build: buildRemoveHeadsetScreen,
  },
  default: {
    displayName: "Default",
    clearColor: "#1d1d1f",
    ground: "#2a2a32",
    accent: "#d7d7d7",
    build: buildDefaultScreen,
  },
};

function normalizeSceneId(raw) {
  if (typeof raw !== "string") {
    return DEFAULT_SCENE_ID;
  }

  const normalized = raw.trim();
  if (SCENE_ALIAS[normalized]) {
    return SCENE_ALIAS[normalized];
  }
  return SCENE_LIBRARY[normalized] ? normalized : DEFAULT_SCENE_ID;
}

function makeColor(hex, fallback = "#ffffff") {
  return Color3.FromHexString(hex || fallback);
}

function makeColor4(hex, alpha = 1) {
  const color = makeColor(hex, "#000000");
  return new Color4(color.r, color.g, color.b, alpha);
}

function createMaterial(scene, diffuseColor, emissiveColor, alpha = 1) {
  const material = new StandardMaterial(`mat-${Math.random().toString(36).slice(2)}`, scene);
  material.diffuseColor = diffuseColor;
  material.emissiveColor = emissiveColor;
  material.alpha = alpha;
  return material;
}

function emitSceneDebug(detail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SCENE_DEBUG_EVENT, { detail }));
}

function createScreenFoundation(scene, theme, root) {
  const materials = [];
  const meshes = [];

  const floorMat = createMaterial(scene, makeColor(theme.ground), Color3.Black());
  materials.push(floorMat);

  const floor = MeshBuilder.CreateGround("screen-floor", { width: 12, height: 12 }, scene);
  floor.material = floorMat;
  floor.position = new Vector3(0, 0, 0);
  floor.parent = root;
  meshes.push(floor);

  const pedestalMat = createMaterial(scene, makeColor(theme.accent), makeColor(theme.accent));
  materials.push(pedestalMat);

  const pedestal = MeshBuilder.CreateCylinder("screen-pedestal", { height: 0.25, diameter: 3.2 }, scene);
  pedestal.material = pedestalMat;
  pedestal.position = new Vector3(0, 0.125, -2.1);
  pedestal.parent = root;
  meshes.push(pedestal);

  const panelMat = createMaterial(scene, makeColor(theme.accent), makeColor(theme.accent), 0.9);
  materials.push(panelMat);
  const panel = MeshBuilder.CreatePlane("screen-panel", { width: 2.6, height: 1.4 }, scene);
  panel.material = panelMat;
  panel.position = new Vector3(0, 1.45, -2.4);
  panel.parent = root;
  meshes.push(panel);

  return {
    materials,
    meshes,
    floor,
    pedestal,
    panel,
    applyMode(mode) {
      const isAr = mode === "xr-ar";
      const panelAlpha = isAr ? 0.78 : 0.92;
      const panelGlow = isAr ? 0.16 : 0.05;

      panelMat.alpha = panelAlpha;
      pedestalMat.specularColor = isAr ? makeColor("#ffffff") : makeColor(theme.accent);
      panelMat.emissiveColor = makeColor(theme.accent).scale(panelGlow);
    },
    locomotion: null,
    dispose() {
      meshes.forEach((mesh) => mesh.dispose());
      materials.forEach((material) => material.dispose());
      root.dispose();
    },
  };
}

function fitImportedModel(meshes, modelAnchor, targetPosition, targetHeight = 1.5) {
  const renderableMeshes = meshes.filter((mesh) => mesh.getTotalVertices() > 0);
  if (renderableMeshes.length === 0) {
    throw new Error("The imported GLB contains no renderable meshes.");
  }

  let min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  let max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

  renderableMeshes.forEach((mesh) => {
    mesh.computeWorldMatrix(true);
    const bounds = mesh.getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, bounds.minimumWorld);
    max = Vector3.Maximize(max, bounds.maximumWorld);
  });

  const size = max.subtract(min);
  if (size.y > 0) {
    const scaleFactor = targetHeight / size.y;
    modelAnchor.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
  }

  min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

  renderableMeshes.forEach((mesh) => {
    mesh.computeWorldMatrix(true);
    const bounds = mesh.getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, bounds.minimumWorld);
    max = Vector3.Maximize(max, bounds.maximumWorld);
  });

  const scaledSize = max.subtract(min);
  const scaledCenter = min.add(scaledSize.scale(0.5));
  const desiredCenter = new Vector3(
    targetPosition.x,
    targetPosition.y + (scaledSize.y * 0.5),
    targetPosition.z,
  );

  modelAnchor.position.addInPlace(desiredCenter.subtract(scaledCenter));
}

function addCastleSceneElements(scene, root, accentColor, base) {
  base.panel.setEnabled(false);
  base.pedestal.scaling = new Vector3(1.3, 1, 1.3);
  emitSceneDebug({
    sceneId: "castle",
    status: "loading",
    message: `Loading model ${CASTLE_MODEL_FILE}...`,
  });

  const loadingMat = new StandardMaterial(`castle-loading-${Date.now()}`, scene);
  loadingMat.diffuseColor = accentColor;
  loadingMat.emissiveColor = accentColor.scale(0.2);

  const loadingOrb = MeshBuilder.CreateSphere("castle-loading-orb", { diameter: 0.55 }, scene);
  loadingOrb.material = loadingMat;
  loadingOrb.position = new Vector3(0, 1.05, -2.3);
  loadingOrb.parent = root;

  const modelAnchor = new TransformNode("castle-model-anchor", scene);
  modelAnchor.parent = root;

  let disposed = false;
  let importedNodes = [];
  let loadingAssetsDisposed = false;

  function disposeLoadingAssets() {
    if (loadingAssetsDisposed) {
      return;
    }

    if (!loadingOrb.isDisposed()) {
      loadingOrb.dispose();
    }
    loadingMat.dispose();
    loadingAssetsDisposed = true;
  }

  SceneLoader.ImportMeshAsync("", CASTLE_MODEL_ROOT_URL, CASTLE_MODEL_FILE, scene)
    .then((result) => {
      if (disposed) {
        result.meshes.forEach((mesh) => mesh.dispose());
        result.transformNodes.forEach((node) => node.dispose());
        return;
      }

      const topLevelNodes = [...result.meshes, ...result.transformNodes].filter((node) => {
        return node !== modelAnchor && !node.parent;
      });

      topLevelNodes.forEach((node) => {
        node.parent = modelAnchor;
      });

      importedNodes = [...result.meshes, ...result.transformNodes];
      fitImportedModel(result.meshes, modelAnchor, new Vector3(0, 0.25, -2.3), 1.5);
      emitSceneDebug({
        sceneId: "castle",
        status: "loaded",
        message: `Loaded ${CASTLE_MODEL_FILE} with ${result.meshes.length} meshes and ${result.transformNodes.length} transform nodes.`,
      });

      disposeLoadingAssets();
    })
    .catch((error) => {
      console.error(`[sceneCatalog] Could not load castle model '${CASTLE_MODEL_FILE}':`, error);
      if (!disposed) {
        loadingMat.emissiveColor = Color3.Red();
        emitSceneDebug({
          sceneId: "castle",
          status: "error",
          message: `Failed to load ${CASTLE_MODEL_FILE}.`,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

  return {
    applyMode() {},
    dispose() {
      disposed = true;
      emitSceneDebug({
        sceneId: "castle",
        status: "disposed",
        message: `Disposed ${CASTLE_MODEL_FILE}.`,
      });
      disposeLoadingAssets();
      importedNodes.forEach((node) => {
        if (!node.isDisposed()) {
          node.dispose();
        }
      });
      importedNodes = [];
    },
  };
}

function addChurchSceneElements(scene, root, accentColor) {
  const wallMat = new StandardMaterial(`church-wall-${Date.now()}`, scene);
  wallMat.diffuseColor = accentColor.scale(0.88);
  const roofMat = new StandardMaterial(`church-roof-${Date.now()}`, scene);
  roofMat.diffuseColor = Color3.White().scale(0.92);

  const nave = MeshBuilder.CreateBox("church-nave", { width: 1.3, height: 0.9, depth: 0.9 }, scene);
  nave.position = new Vector3(0, 0.95, -2.3);
  nave.material = wallMat;

  const tower = MeshBuilder.CreateCylinder("church-tower", { height: 1.1, diameterBottom: 0.5, diameterTop: 0.35 }, scene);
  tower.position = new Vector3(0.7, 1.0, -2.4);
  tower.material = accentColor;

  const spire = MeshBuilder.CreateCylinder("church-spire", { height: 0.45, diameterTop: 0, diameterBottom: 0.22 }, scene);
  spire.position = new Vector3(0.7, 1.7, -2.4);
  spire.material = roofMat;

  const naveBeam = MeshBuilder.CreateCylinder("church-beam", { height: 1.4, diameter: 0.08 }, scene);
  naveBeam.position = new Vector3(0, 1.6, -2.4);
  naveBeam.rotation.z = Math.PI / 8;
  naveBeam.material = wallMat;

  nave.parent = root;
  tower.parent = root;
  spire.parent = root;
  naveBeam.parent = root;
  tower.material = wallMat;
}

function addBoatsSceneElements(scene, root, accentColor) {
  const hullMat = new StandardMaterial(`boat-hull-${Date.now()}`, scene);
  hullMat.diffuseColor = accentColor.scale(0.8);
  const sailMat = new StandardMaterial(`boat-sail-${Date.now()}`, scene);
  sailMat.diffuseColor = Color3.White().scale(0.95);

  const hull = MeshBuilder.CreateBox("boat-hull", { width: 1.4, height: 0.22, depth: 0.55 }, scene);
  hull.position = new Vector3(-0.35, 0.31, -2.25);
  hull.material = hullMat;
  hull.parent = root;

  const sail = MeshBuilder.CreatePlane("boat-sail", { width: 0.7, height: 0.7 }, scene);
  sail.position = new Vector3(-0.35, 0.82, -2.25);
  sail.rotation.y = Math.PI / 4;
  sail.material = sailMat;
  sail.parent = root;

  const hull2 = MeshBuilder.CreateBox("boat-hull-2", { width: 1.2, height: 0.18, depth: 0.48 }, scene);
  hull2.position = new Vector3(0.85, 0.29, -2.15);
  hull2.material = hullMat;
  hull2.parent = root;

  const sail2 = MeshBuilder.CreatePlane("boat-sail-2", { width: 0.58, height: 0.58 }, scene);
  sail2.position = new Vector3(0.85, 0.75, -2.15);
  sail2.rotation.y = -Math.PI / 4;
  sail2.material = sailMat;
  sail2.parent = root;
}

function addDefaultElements(scene, root, accentColor) {
  const orbMat = new StandardMaterial(`orb-${Date.now()}`, scene);
  orbMat.diffuseColor = accentColor;
  const orb = MeshBuilder.CreateSphere("scene-orb", { diameter: 0.55 }, scene);
  orb.position = new Vector3(0, 1.45, -2.4);
  orb.material = orbMat;
  orb.parent = root;
}

function buildLocomotionTestScene(scene) {
  const theme = SCENE_LIBRARY["locomotion-test"];
  const root = new TransformNode("scene-locomotion-test-root", scene);
  const meshes = [];
  const materials = [];

  const floorMat = createMaterial(scene, makeColor(theme.ground), makeColor(theme.ground).scale(0.08));
  materials.push(floorMat);

  const highlightMat = createMaterial(scene, makeColor(theme.accent), makeColor(theme.accent).scale(0.15), 0.92);
  materials.push(highlightMat);

  const markerMat = createMaterial(scene, Color3.White().scale(0.88), Color3.White().scale(0.02));
  materials.push(markerMat);

  const mainFloor = MeshBuilder.CreateGround("locomotion-floor-main", { width: 36, height: 36, subdivisions: 4 }, scene);
  mainFloor.material = floorMat;
  mainFloor.parent = root;
  meshes.push(mainFloor);

  const platformWest = MeshBuilder.CreateBox("locomotion-platform-west", { width: 6, depth: 6, height: 0.35 }, scene);
  platformWest.position = new Vector3(-7, 0.175, -5);
  platformWest.material = highlightMat;
  platformWest.parent = root;
  meshes.push(platformWest);

  const platformEast = MeshBuilder.CreateBox("locomotion-platform-east", { width: 5, depth: 5, height: 0.55 }, scene);
  platformEast.position = new Vector3(8, 0.275, 7);
  platformEast.material = highlightMat;
  platformEast.parent = root;
  meshes.push(platformEast);

  const startPad = MeshBuilder.CreateCylinder("locomotion-start-pad", { height: 0.08, diameter: 2.2 }, scene);
  startPad.position = new Vector3(0, 0.04, 0);
  startPad.material = highlightMat;
  startPad.parent = root;
  meshes.push(startPad);

  [
    new Vector3(-14, 0.45, -14),
    new Vector3(14, 0.45, -14),
    new Vector3(-14, 0.45, 14),
    new Vector3(14, 0.45, 14),
  ].forEach((position, index) => {
    const marker = MeshBuilder.CreateCylinder(`locomotion-marker-${index}`, { height: 0.9, diameter: 0.25 }, scene);
    marker.position = position;
    marker.material = markerMat;
    marker.parent = root;
    meshes.push(marker);
  });

  emitSceneDebug({
    sceneId: "locomotion-test",
    status: "loaded",
    message: "Locomotion test scene loaded with a large floor and elevated teleport targets. Teleportation and thumbstick movement are ready for immersive-vr verification.",
  });

  return {
    clearColor: makeColor4(theme.clearColor),
    locomotion: {
      enabled: true,
      floorMeshes: [mainFloor, platformWest, platformEast, startPad],
    },
    applyMode(nextMode) {
      const isAr = nextMode === "xr-ar";
      floorMat.alpha = isAr ? 0.28 : 1;
      highlightMat.alpha = isAr ? 0.52 : 0.92;
    },
    dispose() {
      meshes.forEach((mesh) => mesh.dispose());
      materials.forEach((material) => material.dispose());
      root.dispose();
    },
  };
}

function addRemoveHeadsetElements(scene, root, accentColor) {
  const ringMat = new StandardMaterial(`remove-ring-${Date.now()}`, scene);
  ringMat.diffuseColor = accentColor;
  ringMat.emissiveColor = accentColor;
  const ring = MeshBuilder.CreateTorus("remove-ring", { diameter: 1.1, thickness: 0.2 }, scene);
  ring.position = new Vector3(0, 1.35, -2.4);
  ring.material = ringMat;
  ring.rotation.x = Math.PI / 2.5;

  const warning = MeshBuilder.CreateBox("remove-warning", { width: 0.25, height: 0.25, depth: 0.25 }, scene);
  warning.position = new Vector3(0, 1.35, -2.4);
  warning.material = ringMat;

  ring.parent = root;
  warning.parent = root;
}

function composeScreen(scene, themeId, mode) {
  const theme = SCENE_LIBRARY[themeId] || SCENE_LIBRARY.default;
  const root = new TransformNode(`scene-${themeId}-root`, scene);
  const base = createScreenFoundation(scene, theme, root);
  let sceneHandle = null;

  const accent = makeColor(theme.accent);
  switch (themeId) {
    case "castle":
      sceneHandle = addCastleSceneElements(scene, root, accent, base);
      break;
    case "church":
      addChurchSceneElements(scene, root, accent);
      break;
    case "boats":
      addBoatsSceneElements(scene, root, accent);
      break;
    case "remove-headset":
      addRemoveHeadsetElements(scene, root, accent);
      break;
    default:
      addDefaultElements(scene, root, accent);
      break;
  }

  base.applyMode(mode);
  return {
    root,
    clearColor: makeColor4(theme.clearColor),
    locomotion: sceneHandle?.locomotion || base.locomotion || null,
    applyMode(nextMode) {
      base.applyMode(nextMode);
      sceneHandle?.applyMode?.(nextMode);
    },
    dispose() {
      sceneHandle?.dispose?.();
      base.dispose();
    },
  };
}

function buildWaitingScreen(scene, mode) {
  return composeScreen(scene, "waiting", mode);
}

function buildCastleScreen(scene, mode) {
  return composeScreen(scene, "castle", mode);
}

function buildChurchScreen(scene, mode) {
  return composeScreen(scene, "church", mode);
}

function buildLocomotionTestScreen(scene, mode) {
  return buildLocomotionTestScene(scene, mode);
}

function buildBoatsScreen(scene, mode) {
  return composeScreen(scene, "boats", mode);
}

function buildRemoveHeadsetScreen(scene, mode) {
  return composeScreen(scene, "remove-headset", mode);
}

function buildDefaultScreen(scene, mode) {
  return composeScreen(scene, "default", mode);
}

function getDefinition(sceneId) {
  const key = normalizeSceneId(sceneId);
  return SCENE_LIBRARY[key] || SCENE_LIBRARY.default;
}

export function createSceneManager(scene) {
  let activeSceneId = DEFAULT_SCENE_ID;
  let activeMode = "preview";
  let handle = null;

  function setScene(sceneId, mode = activeMode) {
    const nextId = normalizeSceneId(sceneId);
    const nextMode = mode || "preview";

    if (nextId === activeSceneId && handle && nextMode === activeMode) {
      handle.applyMode(nextMode);
      return { sceneId: nextId, clearColor: handle.clearColor, locomotion: handle.locomotion || null };
    }

    if (handle) {
      handle.dispose();
      handle = null;
    }

    const definition = getDefinition(nextId);
    handle = definition.build(scene, nextMode);
    activeSceneId = nextId;
    activeMode = nextMode;
    handle.applyMode(nextMode);

    return { sceneId: nextId, clearColor: handle.clearColor, locomotion: handle.locomotion || null };
  }

  function setMode(mode) {
    activeMode = mode || activeMode;
    if (handle) {
      handle.applyMode(activeMode);
    }
    return { sceneId: activeSceneId, clearColor: handle?.clearColor, locomotion: handle?.locomotion || null };
  }

  return {
    getAvailableScenes() {
      return [...SCENE_SEQUENCE];
    },
    getActiveScene() {
      return activeSceneId;
    },
    setScene,
    setMode,
    dispose() {
      if (handle) {
        handle.dispose();
        handle = null;
      }
    },
  };
}

export { DEFAULT_SCENE_ID };
