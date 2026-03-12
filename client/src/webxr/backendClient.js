const MOCK_PREFIX = "kalmar-scene";

/**
 * Creates a local adapter that emulates `onSceneChange` with BroadcastChannel.
 * Used when the real runtime adapter is not available.
 */
function createMockAdapter() {
  return {
    onSceneChange(sessionId, callback) {
      const channel = new BroadcastChannel(`${MOCK_PREFIX}-${sessionId}`);
      const onMessage = (event) => {
        const payload = event.data;
        const sceneId =
          typeof payload === "string"
            ? payload
            : payload && typeof payload.sceneId === "string"
              ? payload.sceneId
              : null;

        if (sceneId) {
          callback(sceneId);
        }
      };

      channel.addEventListener("message", onMessage);
      callback("waiting");

      return () => {
        channel.removeEventListener("message", onMessage);
        channel.close();
      };
    },
  };
}

/**
 * Returns a scene subscription for a session ID.
 * Prefers `window.kalmarAdapter` and falls back to the mock adapter.
 */
export function subscribeToSceneChanges(sessionId, callback) {
  const adapter = globalThis.kalmarAdapter;
  if (adapter && typeof adapter.onSceneChange === "function") {
    return {
      source: "runtime-adapter",
      unsubscribe: adapter.onSceneChange(sessionId, callback),
    };
  }

  const mockAdapter = createMockAdapter();
  return {
    source: "mock-broadcast-channel",
    unsubscribe: mockAdapter.onSceneChange(sessionId, callback),
  };
}

/**
 * Publishes a mock scene event to the current session via BroadcastChannel.
 */
export function publishMockScene(sessionId, sceneId) {
  const channel = new BroadcastChannel(`${MOCK_PREFIX}-${sessionId}`);
  channel.postMessage({ sceneId });
  channel.close();
}
