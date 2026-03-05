const MOCK_PREFIX = "kalmar-scene";

/**
 * Skapar en lokal adapter som emulerar `onSceneChange` med BroadcastChannel.
 * Används när riktig runtime-adapter inte finns tillgänglig.
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
 * Returnerar en scene-subscription för ett session-id.
 * Prioriterar `window.kalmarAdapter` och faller annars tillbaka till mock.
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
 * Publicerar ett mock-scene-event till aktuell session via BroadcastChannel.
 */
export function publishMockScene(sessionId, sceneId) {
  const channel = new BroadcastChannel(`${MOCK_PREFIX}-${sessionId}`);
  channel.postMessage({ sceneId });
  channel.close();
}
