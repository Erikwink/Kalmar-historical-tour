import { onSceneChange } from "../../../saas-adapter/src/index.js";

function normalizeSessionId(rawSessionId) {
  return typeof rawSessionId === "string" ? rawSessionId.trim() : "";
}

/**
 * Returns a scene subscription for a session ID.
 * Uses shared saas-adapter (Firebase).
 */
export function subscribeToSceneChanges(sessionId, callback) {
  const normalizedSessionId = normalizeSessionId(sessionId);

  // Invalid session → return safe no-op
  if (!normalizedSessionId) {
    return {
      source: "invalid-session",
      unsubscribe() {},
    };
  }

  // If adapter not available → fallback
  if (typeof onSceneChange !== "function") {
    return {
      source: "no-adapter",
      unsubscribe() {},
    };
  }

  try {
    const unsubscribe = onSceneChange(normalizedSessionId, callback);

    return {
      source: "firebase-adapter",
      unsubscribe,
    };
  } catch (error) {
    console.error(
      "[backendClient] Failed to subscribe via Firebase adapter:",
      error
    );

    return {
      source: "error-fallback",
      unsubscribe() {},
    };
  }
}
