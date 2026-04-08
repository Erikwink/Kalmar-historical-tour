import { tours, WAITING_CONTROLS } from "../../tours/index";

export const DEFAULT_TOUR_ID = "kalmar-medeltid";
export const DEFAULT_SCENE_ID = "waiting";

const DEVELOPMENT_SCENES = [
  {
    id: "locomotion-test",
    label: "Locomotion Test",
    color: "#90f7c9",
    developmentOnly: true,
  },
];

/**
 * Resolves a requested tour ID against the shared tours registry.
 * Falls back to the development default when the session has not written tourId yet.
 */
export function resolveTour(rawTourId) {
  const requestedTourId = typeof rawTourId === "string" ? rawTourId.trim() : "";
  const directMatch = tours.find((tour) => tour.id === requestedTourId);
  if (directMatch) {
    return {
      requestedTourId,
      resolvedTourId: directMatch.id,
      tour: directMatch,
      usedFallback: false,
    };
  }

  const fallbackTour = tours.find((tour) => tour.id === DEFAULT_TOUR_ID) ?? tours[0] ?? null;
  return {
    requestedTourId,
    resolvedTourId: fallbackTour?.id ?? DEFAULT_TOUR_ID,
    tour: fallbackTour,
    usedFallback: true,
  };
}

/**
 * Returns all scene-like entries that the client can resolve for the active tour.
 * Waiting controls are global, while development scenes are only opt-in.
 */
export function getSelectableScenes(tourState, { includeDevelopmentScenes = false } = {}) {
  const tourScenes = Array.isArray(tourState?.tour?.scenes) ? tourState.tour.scenes : [];
  const allScenes = [
    ...WAITING_CONTROLS,
    ...tourScenes,
    ...(includeDevelopmentScenes ? DEVELOPMENT_SCENES : []),
  ];
  const seenSceneIds = new Set();
  return allScenes.filter((scene) => {
    if (!scene?.id || seenSceneIds.has(scene.id)) {
      return false;
    }
    seenSceneIds.add(scene.id);
    return true;
  });
}

/**
 * Resolves a requested scene ID against the active tour and global waiting states.
 * Falls back to the shared waiting state if the requested scene is unknown.
 */
export function resolveScene(tourState, rawSceneId, { includeDevelopmentScenes = false } = {}) {
  const requestedSceneId = typeof rawSceneId === "string" ? rawSceneId.trim() : "";
  const availableScenes = getSelectableScenes(tourState, { includeDevelopmentScenes });
  const directMatch = availableScenes.find((scene) => scene.id === requestedSceneId);
  if (directMatch) {
    return {
      requestedSceneId,
      resolvedSceneId: directMatch.id,
      scene: directMatch,
      usedFallback: false,
    };
  }

  const fallbackScene = availableScenes.find((scene) => scene.id === DEFAULT_SCENE_ID) ?? WAITING_CONTROLS[0] ?? null;
  return {
    requestedSceneId,
    resolvedSceneId: fallbackScene?.id ?? DEFAULT_SCENE_ID,
    scene: fallbackScene,
    usedFallback: true,
  };
}

/**
 * Normalizes the Firebase activeControls payload into a boolean map.
 */
export function normalizeActiveControlMap(rawActiveControls) {
  if (!rawActiveControls || typeof rawActiveControls !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawActiveControls).filter(([controlId, isActive]) => {
      return typeof controlId === "string" && controlId.trim() && Boolean(isActive);
    }),
  );
}

/**
 * Resolves the currently active controls for the given scene from the Firebase activeControls map.
 */
export function resolveActiveControls(sceneState, rawActiveControls) {
  const normalizedActiveControls = normalizeActiveControlMap(rawActiveControls);
  const availableControls = Array.isArray(sceneState?.scene?.controls) ? sceneState.scene.controls : [];
  const activeControls = availableControls.filter((control) => normalizedActiveControls[control.id]);

  return {
    controlMap: normalizedActiveControls,
    availableControls,
    activeControls,
  };
}

/**
 * Resolves a control src string to a browser URL.
 * Project convention: media files should live under client/public/assets/<src>.
 */
export function resolveMediaAssetUrl(rawSrc) {
  if (typeof rawSrc !== "string") {
    return "";
  }

  const normalizedSrc = rawSrc.trim();
  if (!normalizedSrc) {
    return "";
  }
  if (/^https?:\/\//i.test(normalizedSrc) || normalizedSrc.startsWith("/")) {
    return normalizedSrc;
  }
  if (normalizedSrc.startsWith("client/assets/")) {
    return `/${normalizedSrc.replace(/^client\//, "")}`;
  }
  return `/assets/${normalizedSrc.replace(/^assets\//, "")}`;
}

/**
 * Resolves the primary panorama control from the currently active controls.
 * Until the session model tracks activation order, the last 360-photo in scene control order wins.
 */
export function resolvePrimaryPanoramaControl(controlsState) {
  const panoramaControls = Array.isArray(controlsState?.activeControls)
    ? controlsState.activeControls.filter((control) => control.type === "360-photo" && typeof control.src === "string")
    : [];

  if (!panoramaControls.length) {
    return null;
  }
  return panoramaControls[panoramaControls.length - 1];
}
