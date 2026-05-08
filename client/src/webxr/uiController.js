/**
 * Presentation controller for the WebXR runtime page.
 * It owns DOM writes only; application state stays in main.js and is read through getters.
 */

export function createWebXRUiController({
  elements,
  isHeadsetRuntimePage,
  isXRSessionActive,
  isSceneReadyForVr,
  support,
  isXrStartInFlight,
}) {
  const {
    statusEl,
    tourIndicatorEl,
    sceneIndicatorEl,
    controlsIndicatorEl,
    headsetLobbyEl,
    headsetLobbyTitleEl,
    headsetLobbyTextEl,
    resumeVrButton,
    sceneDebugEl,
  } = elements;

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function setTourIndicator(tourState) {
    if (!tourIndicatorEl) {
      return;
    }

    const title = tourState.tour?.title ?? tourState.resolvedTourId;
    const suffix = tourState.usedFallback ? " (fallback)" : "";
    tourIndicatorEl.textContent = `Active tour: ${title} [${tourState.resolvedTourId}]${suffix}`;
  }

  function setSceneIndicator(sceneState) {
    if (sceneIndicatorEl) {
      const label = sceneState.scene?.label ?? sceneState.resolvedSceneId;
      const suffix = sceneState.usedFallback ? " (fallback)" : "";
      sceneIndicatorEl.textContent = `Active scene: ${label} [${sceneState.resolvedSceneId}]${suffix}`;
    }
    syncHeadsetLobbyVisibility();
  }

  function syncHeadsetLobbyVisibility() {
    const shouldShow = isHeadsetRuntimePage() && !isXRSessionActive();
    document.body.dataset.headsetLobbyVisible = shouldShow ? "true" : "false";

    if (!headsetLobbyEl) {
      return;
    }

    headsetLobbyEl.hidden = !shouldShow;

    if (headsetLobbyTitleEl && headsetLobbyTextEl) {
      headsetLobbyTitleEl.textContent = isSceneReadyForVr() ? "Scen redo" : "Väntar på nästa scen";
      headsetLobbyTextEl.textContent = isSceneReadyForVr()
        ? "Tryck Fortsätt i VR för att gå in i den nya scenen."
        : "Guiden startar nästa scen när gruppen är redo.";
    }
  }

  function setControlsIndicator(controlsState) {
    if (!controlsIndicatorEl) {
      return;
    }

    const activeControlLabels = controlsState.activeControls.map((control) => control.label || control.id);
    controlsIndicatorEl.textContent = activeControlLabels.length
      ? `Active controls: ${activeControlLabels.join(", ")}`
      : "Active controls: none";
  }

  function setSceneDebug(message, tone = "info") {
    if (!sceneDebugEl) {
      return;
    }

    sceneDebugEl.textContent = message;
    sceneDebugEl.dataset.tone = tone;
  }

  function shouldShowHeadsetLaunchPrompt() {
    return (
      isHeadsetRuntimePage() &&
      isSceneReadyForVr() &&
      support.vr &&
      !isXRSessionActive()
    );
  }

  function setResumeVrPromptVisible(visible) {
    if (!resumeVrButton) {
      return;
    }

    const shouldShow = Boolean(
      isHeadsetRuntimePage() &&
        (visible || shouldShowHeadsetLaunchPrompt()) &&
        isSceneReadyForVr(),
    );
    resumeVrButton.dataset.visible = shouldShow ? "true" : "false";
    resumeVrButton.disabled = !shouldShow || !support.vr || isXrStartInFlight();
    syncHeadsetLobbyVisibility();
  }

  return {
    setStatus,
    setTourIndicator,
    setSceneIndicator,
    syncHeadsetLobbyVisibility,
    setControlsIndicator,
    setSceneDebug,
    setResumeVrPromptVisible,
  };
}
