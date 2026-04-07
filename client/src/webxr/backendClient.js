import { onSceneChange } from "../../../saas-adapter/src/index.js"

//const MOCK_PREFIX = "kalmar-scene"

function normalizeSessionId(rawSessionId) {
  return typeof rawSessionId === "string" ? rawSessionId.trim() : ""
}

// function toSceneMessage(sceneId, callback) {
//   const normalized = typeof sceneId === "string" ? sceneId.trim() : ""
//   if (normalized) {
//     callback(normalized)
//   }
// }

/**
 * Creates a local adapter that emulates `onSceneChange` with BroadcastChannel.
 * Used when the real runtime adapter is not available.
 */
// function createMockAdapter() {
//   return {
//     onSceneChange(sessionId, callback) {
//       const normalizedSessionId = normalizeSessionId(sessionId)
//       const channel = new BroadcastChannel(`${MOCK_PREFIX}-${normalizedSessionId}`);
//       const onMessage = (event) => {
//         const payload = event.data;
//         const sceneId =
//           typeof payload === "string"
//             ? payload
//             : payload && typeof payload.sceneId === "string"
//               ? payload.sceneId
//               : null;

//         toSceneMessage(sceneId, callback);
//       };

//       channel.addEventListener("message", onMessage);
//       callback("waiting");

//       return () => {
//         channel.removeEventListener("message", onMessage);
//         channel.close();
//       };
//     },
//   };
// }

/**
 * Returns a scene subscription for a session ID.
 * Uses shared saas-adapter (Firebase) when available and falls back
 * to BroadcastChannel for mock/simulation mode.
 */
export function subscribeToSceneChanges(sessionId, callback) {
  const normalizedSessionId = normalizeSessionId(sessionId)
  if (!normalizedSessionId) {
    return {
      source: "invalid-session",
      unsubscribe() {},
    }
  }

  // Always use the shared Firebase adapter when available.
  if (typeof onSceneChange === "function") {
    try {
      return {
        source: "firebase-adapter",
        unsubscribe: onSceneChange(normalizedSessionId, (sceneId) => {
          callback(sceneId)
        }),
      }
    } catch (error) {
      console.error("[backendClient] Failed to subscribe via Firebase adapter, falling back:", error);
    }
  }

  // Backward-compatible mock channel for local dev/simulated mode.
  // const mockAdapter = createMockAdapter();
  // return {
  //   source: "mock-broadcast-channel",
  //   unsubscribe: mockAdapter.onSceneChange(normalizedSessionId, (sceneId) => {
  //     callback(sceneId)
  //   }),
  // }
}

/**
 * Publishes a mock scene event to the current session via BroadcastChannel.
 */
// export function publishMockScene(sessionId, sceneId) {
//   const normalizedSessionId = normalizeSessionId(sessionId)
//   if (!normalizedSessionId) {
//     return;
//   }
//   const channel = new BroadcastChannel(`${MOCK_PREFIX}-${normalizedSessionId}`);
//   channel.postMessage({ sceneId });
//   channel.close();
// }
