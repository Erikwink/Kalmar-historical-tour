# WebXR Runtime Architecture

This document describes the structure of the headset runtime after the WebXR scene-transition refactor.

## Goals

- Keep the headset runtime stable during WebXR scene transitions.
- Keep `main.js` focused on orchestration instead of owning every responsibility.
- Make laptop debugging use the same Firebase scene/control stream as the headset runtime.
- Avoid local mock flows in the release runtime.

## Runtime Entry

The runtime entrypoint is:

```text
client/webxr.html
client/src/webxr/main.js
```

Use these URLs:

```text
/webxr.html?session=123456
/webxr.html?session=123456&preview=1
```

`session` connects the runtime to the Firebase room created by the controller.

`preview=1` starts laptop preview mode. Preview mode renders the Babylon scene in browser simulation and shows a small status overlay. It does not expose mock scene controls.

## Module Responsibilities

### `main.js`

`main.js` is the runtime orchestrator. It wires together:

- Firebase subscriptions
- tour and scene state
- Babylon runtime controller
- WebXR start/end flow
- safe scene transition flow
- module-level controllers

It should not own Babylon engine setup, render-loop management, detailed UI rendering, URL parsing, or XR session fallback configuration.

### `runtimeConfig.js`

Owns URL parsing and runtime mode selection.

Responsibilities:

- normalize session IDs
- read `session`, `tourId`, `autostart`, and `preview`
- resolve `headset` vs `preview` runtime mode

### `domElements.js`

Centralizes DOM element lookup for `webxr.html`.

The runtime keeps some hidden controls in the DOM because the JavaScript flow still uses them programmatically. Keeping all selectors in one module makes DOM changes easier to review.

### `uiController.js`

Owns all DOM writes for runtime status and lobby UI.

Responsibilities:

- status text
- active tour/scene/control indicators
- headset lobby visibility
- `Väntar på nästa scen` vs `Scen redo`
- `Fortsätt i VR` button visibility and disabled state
- scene diagnostics text

The UI controller reads application state through small getter functions from `main.js`. This keeps state ownership in one place while preventing direct DOM writes from spreading through the runtime.

### `xrSession.js`

Owns WebXR session startup helpers.

Responsibilities:

- classify user-activation errors
- classify unsupported session configuration errors
- define VR/AR reference-space fallback attempts
- enter XR with fallback session configurations

This keeps headset-specific WebXR compatibility handling separate from scene orchestration.

### `babylonRuntime.js`

Owns Babylon engine setup and runtime lifecycle.

Responsibilities:

- create the Babylon engine context
- create the camera and base lighting
- start and stop the render loop
- create the WebXR default experience
- apply scene catalog updates to the active Babylon scene
- switch between waiting, panorama, and error modes
- keep Babylon's optional movement helper disabled because this runtime is scene-only

### `audioPlayback.js`

Owns browser media playback for active audio and narration controls.

Responsibilities:

- start/stop audio controls
- loop ambient audio
- play narration once
- duck ambient audio while narration is active

### `backendClient.js`

Owns scene-stream adapter selection.

Responsibilities:

- subscribe to Firebase scene changes
- subscribe to Firebase tour changes
- subscribe to Firebase active controls
- retain a local broadcast-channel fallback for development compatibility

### `scenes/sceneCatalog.js`

Owns Babylon scene construction.

Responsibilities:

- build waiting/default scenes
- build panorama scenes from active `360-photo` controls
- update panorama textures outside active XR sessions when possible
- emit scene diagnostics

## Safe Scene Transition Flow

Headset browsers can fail when panorama textures are changed while an immersive WebXR session is active.

The runtime therefore uses this flow:

1. The guide activates a renderable control, such as `Visa slottet`.
2. The headset receives the Firebase update.
3. If VR is active, the client exits the XR session.
4. The panorama is applied outside XR.
5. The headset lobby shows `Scen redo`.
6. The user presses `Fortsätt i VR`.
7. WebXR starts again with the new scene already loaded.

When the guide stops the renderable control or returns to `waiting`, the lobby shows `Väntar på nästa scen` and the VR button is hidden.

## Laptop Debugging

Recommended laptop flow:

1. Start the project dev server.
2. Start or join a controller session.
3. Open:

```text
/webxr.html?session=<SESSION_ID>&preview=1
```

4. Use the controller to trigger scene controls like `Visa slottet` or `Visa kyrkan`.
5. Confirm that the laptop preview updates via Firebase.

This validates the real release flow:

```text
controller -> Firebase -> WebXR runtime
```

Avoid adding local mock UI back to the release runtime. It can hide integration bugs by bypassing Firebase and the controller.

## Clean Code Guidelines

- Keep state ownership centralized in `main.js`.
- Move cohesive behavior into named modules.
- Prefer small controller modules that expose clear methods.
- Keep DOM writes inside `uiController.js`.
- Keep query parsing inside `runtimeConfig.js`.
- Keep headset compatibility logic inside `xrSession.js`.
- Do not reintroduce local mock controls into `webxr.html`.
- Keep scene-building code in `scenes/sceneCatalog.js`.
