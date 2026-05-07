/**
 * URL and runtime-mode helpers for the WebXR client entrypoint.
 * Keeping query parsing here avoids scattering URLSearchParams logic through the runtime.
 */

export function normalizeSessionId(rawSessionId) {
  return typeof rawSessionId === "string" ? rawSessionId.trim() : "";
}

export function getSessionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return normalizeSessionId(params.get("session"));
}

export function getTourIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawTourId = params.get("tourId");
  return typeof rawTourId === "string" ? rawTourId.trim() : "";
}

export function getAutostartMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("autostart");
}

export function isLaptopPreviewRequested() {
  const params = new URLSearchParams(window.location.search);
  return params.get("preview") === "1";
}

export function resolveRuntimeMode() {
  return isLaptopPreviewRequested() ? "preview" : "headset";
}
