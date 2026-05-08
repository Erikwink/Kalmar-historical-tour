import { resolveMediaAssetUrl } from "../toursClient.js";

const AMBIENT_VOLUME = 0.72;
const DUCKED_AMBIENT_VOLUME = 0.32;
const NARRATION_VOLUME = 1;

function isPlayableMediaControl(control) {
  return (
    control &&
    (control.type === "audio" || control.type === "narration") &&
    typeof control.id === "string" &&
    control.id.trim() &&
    typeof control.src === "string" &&
    control.src.trim()
  );
}

function getTargetVolume(controlType, hasActiveNarration) {
  if (controlType === "audio") {
    return hasActiveNarration ? DUCKED_AMBIENT_VOLUME : AMBIENT_VOLUME;
  }
  return NARRATION_VOLUME;
}

/**
 * Creates a small playback controller for scene-driven audio and narration controls.
 * Ambient audio loops while narration plays once, and active narration ducks ambient volume.
 */
export function createAudioPlaybackManager({ onPlaybackEvent } = {}) {
  const players = new Map();
  let activeSignature = "";

  function emit(status, message, error = "") {
    onPlaybackEvent?.({ status, message, error });
  }

  function updateGroupVolumes() {
    const hasActiveNarration = Array.from(players.values()).some((entry) => {
      return entry.control.type === "narration" && !entry.audio.paused && !entry.audio.ended;
    });

    players.forEach((entry) => {
      entry.audio.volume = getTargetVolume(entry.control.type, hasActiveNarration);
    });
  }

  function stopPlayer(controlId) {
    const entry = players.get(controlId);
    if (!entry) {
      return;
    }

    entry.audio.pause();
    entry.audio.currentTime = 0;
    entry.audio.removeEventListener("ended", entry.onEnded);
    entry.audio.removeAttribute("src");
    entry.audio.load();
    players.delete(controlId);
  }

  /**
   * Ensures an audio element exists for the provided control and reuses it when possible.
   */
  function ensurePlayer(control) {
    const resolvedUrl = resolveMediaAssetUrl(control.src);
    if (!resolvedUrl) {
      emit("error", `Active ${control.type} control '${control.id}' is missing a usable src value.`);
      return null;
    }

    const existingEntry = players.get(control.id);
    if (existingEntry && existingEntry.url === resolvedUrl) {
      existingEntry.control = control;
      existingEntry.audio.loop = control.type === "audio";
      return existingEntry;
    }

    if (existingEntry) {
      stopPlayer(control.id);
    }

    const audio = new Audio(resolvedUrl);
    audio.preload = "auto";
    audio.loop = control.type === "audio";

    const entry = {
      audio,
      control,
      url: resolvedUrl,
      onEnded: () => {
        updateGroupVolumes();
      },
    };

    audio.addEventListener("ended", entry.onEnded);
    players.set(control.id, entry);
    return entry;
  }

  function startPlayer(control) {
    const entry = ensurePlayer(control);
    if (!entry) {
      return;
    }

    if (!entry.audio.paused && !entry.audio.ended) {
      updateGroupVolumes();
      return;
    }

    if (entry.audio.ended) {
      entry.audio.currentTime = 0;
    }

    entry.audio
      .play()
      .then(() => {
        updateGroupVolumes();
      })
      .catch((error) => {
        emit(
          "error",
          `Could not start ${control.type} '${control.id}'.`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }

  /**
   * Reconciles active scene controls against the currently playing media elements.
   */
  function sync(activeControls, { enabled = true } = {}) {
    if (!enabled) {
      stopAll({ silent: true });
      return;
    }

    const playableControls = Array.isArray(activeControls) ? activeControls.filter(isPlayableMediaControl) : [];
    const nextSignature = JSON.stringify(
      playableControls.map((control) => ({
        id: control.id,
        type: control.type,
        src: control.src,
      })),
    );

    if (nextSignature === activeSignature) {
      updateGroupVolumes();
      return;
    }

    const nextControlIds = new Set(playableControls.map((control) => control.id));
    Array.from(players.keys()).forEach((controlId) => {
      if (!nextControlIds.has(controlId)) {
        stopPlayer(controlId);
      }
    });

    playableControls.forEach((control) => {
      startPlayer(control);
    });

    activeSignature = nextSignature;

    if (!playableControls.length) {
      emit("info", "Media playback idle. No active audio or narration controls.");
      return;
    }

    const audioCount = playableControls.filter((control) => control.type === "audio").length;
    const narrationCount = playableControls.filter((control) => control.type === "narration").length;
    emit("loaded", `Media playback active: ${audioCount} audio, ${narrationCount} narration.`);
  }

  /**
   * Stops and disposes all active media elements.
   */
  function stopAll({ silent = false } = {}) {
    Array.from(players.keys()).forEach((controlId) => {
      stopPlayer(controlId);
    });
    activeSignature = "";

    if (!silent) {
      emit("info", "Media playback stopped.");
    }
  }

  return {
    sync,
    stopAll,
    dispose() {
      stopAll({ silent: true });
    },
  };
}
