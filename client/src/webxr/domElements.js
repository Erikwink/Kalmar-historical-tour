/**
 * Centralizes DOM lookups for webxr.html.
 * The runtime page keeps hidden controls for programmatic flows, so selectors stay stable.
 */

export function getWebXRDom() {
  return {
    statusEl: document.getElementById("status"),
    tourIndicatorEl: document.getElementById("tour-indicator"),
    sceneIndicatorEl: document.getElementById("scene-indicator"),
    controlsIndicatorEl: document.getElementById("controls-indicator"),
    sessionInput: document.getElementById("session-id"),
    connectSessionButton: document.getElementById("connect-session"),
    mockSceneSelect: document.getElementById("mock-scene-select"),
    sendMockSceneButton: document.getElementById("send-mock-scene"),
    startVrButton: document.getElementById("start-vr"),
    startArButton: document.getElementById("start-ar"),
    startSimButton: document.getElementById("start-sim"),
    endButton: document.getElementById("end-xr"),
    resumeVrButton: document.getElementById("resume-vr"),
    canvas: document.getElementById("xr-canvas"),
    headsetLobbyEl: document.querySelector(".headset-lobby"),
    headsetLobbyTitleEl: document.getElementById("headset-lobby-title"),
    headsetLobbyTextEl: document.getElementById("headset-lobby-text"),
    sceneDebugEl: document.getElementById("scene-debug"),
  };
}
