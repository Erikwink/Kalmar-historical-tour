/**
 * WebXR session startup helpers.
 * The headset browsers used by this project differ in supported reference spaces,
 * so session creation is attempted through a conservative fallback sequence.
 */

export function isUserActivationError(error) {
  const name = typeof error?.name === "string" ? error.name : "";
  const message = typeof error?.message === "string" ? error.message : "";
  return (
    name === "SecurityError" ||
    /user activation|transient activation|gesture|requestsession/i.test(message)
  );
}

export function isUnsupportedSessionConfigError(error) {
  const name = typeof error?.name === "string" ? error.name : "";
  const message = typeof error?.message === "string" ? error.message : "";
  return (
    name === "NotSupportedError" ||
    /specified session configuration is not supported|session configuration is not supported/i.test(message)
  );
}

export function getXRSessionAttempts(mode) {
  if (mode === "immersive-ar") {
    return [
      {
        label: "local",
        referenceSpaceType: "local",
        sessionInit: {
          requiredFeatures: ["local"],
          optionalFeatures: ["bounded-floor", "hand-tracking"],
        },
      },
    ];
  }

  return [
    {
      label: "local-floor + bounded-floor + hand-tracking",
      referenceSpaceType: "local-floor",
      sessionInit: {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
      },
    },
    {
      label: "local-floor",
      referenceSpaceType: "local-floor",
      sessionInit: {
        optionalFeatures: ["local-floor"],
      },
    },
    {
      label: "local + hand-tracking",
      referenceSpaceType: "local",
      sessionInit: {
        optionalFeatures: ["hand-tracking"],
      },
    },
    {
      label: "local",
      referenceSpaceType: "local",
      sessionInit: {},
    },
  ];
}

export async function enterXRWithFallbacks(xr, mode, { setStatus }) {
  const attempts = getXRSessionAttempts(mode);
  let lastError = null;

  for (const attempt of attempts) {
    try {
      setStatus(`Starting ${mode} with ${attempt.label}...`);
      await xr.baseExperience.enterXRAsync(
        mode,
        attempt.referenceSpaceType,
        xr.renderTarget,
        attempt.sessionInit,
      );
      return attempt;
    } catch (error) {
      lastError = error;
      if (!isUnsupportedSessionConfigError(error)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error(`No supported XR session configuration found for ${mode}.`);
}
