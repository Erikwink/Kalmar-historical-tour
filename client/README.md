# Kalmar WebXR Client

React/Vite client for the headset flow and Babylon WebXR runtime.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

## WebXR Runtime

Open `webxr.html` through Vite and use `?session=123456` to auto-connect a scene stream.
The client now also reads `tourId` from the Firebase session and falls back to `kalmar-medeltid` during development until the controller has written the field.
Active scene lookup is now resolved from the selected tour in `tours.js`, with `waiting` as the shared fallback state when a scene ID is unknown.
The client also subscribes to `activeControls` from Firebase and resolves them against the currently active scene.
Active `360-photo` controls are rendered as Babylon `PhotoDome` panoramas in the WebXR runtime.
Active `audio` controls loop in the browser audio layer, while `narration` controls play once and temporarily duck ambient audio volume.
On headset browsers, `webxr.html?session=123456` shows a lobby until the guide activates a renderable scene control such as `Visa slottet` or `Visa kyrkan`. The headset then shows `Scen redo` and a one-tap `Fortsätt i VR` prompt.

For laptop debugging, open `webxr.html?session=123456&preview=1`. This uses the same Firebase scene/control stream as the headset runtime, starts Babylon browser simulation automatically, and shows a small status overlay without exposing local mock controls.

Runtime architecture and clean-code boundaries are documented in [`../docs/webxr-runtime-architecture.md`](../docs/webxr-runtime-architecture.md).

## Panorama Assets

Place panorama images under `client/public/assets/<scene-id>/...` so Vite can serve them as static runtime files.

Examples:

- `client/public/assets/castle/image.jpg`
- `client/public/assets/church/image.jpg`

Then reference them in `tours.js` with relative `src` values such as:

- `castle/image.jpg`
- `church/image.jpg`

Place audio files under the same `client/public/assets/<scene-id>/...` tree.

Examples:

- `client/public/assets/castle/ambient.mp3`
- `client/public/assets/castle/narration.mp3`

Then reference them in `tours.js` with relative `src` values such as:

- `castle/ambient.mp3`
- `castle/narration.mp3`
