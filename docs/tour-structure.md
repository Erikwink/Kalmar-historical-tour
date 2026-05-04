# Tour data structure

## Overview

Tours are defined in `tours/` in the project root — a shared package used by both `controller/` and `client/`.

```
tours/
  index.js              ← exporterar tours[] + WAITING_CONTROLS
  waiting-controls.js   ← WAITING_CONTROLS
  kalmar-medeltiden.js  ← en tour per fil
  img/                  ← bilder tillhörande turerna
```

To add a new tour: create a new file in `tours/`, import it in `tours/index.js` and add it to the array.

Each tour has a list of **scenes**. Each scene has a list of **controls** — the things a guide can activate on the headset.

`WAITING_CONTROLS` are shared across all tours and have no detailed view.

---

## Tours

```js
// tours/index.js
import kalmarMedeltiden from "./kalmar-medeltiden";

export const tours = [kalmarMedeltiden];

export { WAITING_CONTROLS } from "./waiting-controls";
```

```js
// tours/kalmar-medeltiden.js
import image from "./img/kalmar-kyrka.png";

export default {
  id: "kalmar-medeltid", // unique ID, used in Firebase + routing
  title: "Kalmar Medeltid",
  image, // thumbnail for tour list
  icon: "castle", // material symbol
  scenes: [
    /* Scene[] */
  ],
};
```

---

## Scene

```js
{
  id:    "castle",      // unique within tour, used as activeSceneId value
  label: "Kalmar slott",
  icon:  "castle",      // material symbol — shown when no image is set
  color: "#CFBCFF",     // accent color in UI
  image: import("./img/castle.jpg"), // optional — replaces icon in SceneCard header
  controls: [ /* Control[] */ ],
}
```

---

## Control

```js
{
  id:    "castle-amb",       // unique globally (scene-prefix recommended)
  type:  "audio",            // see Control types below
  label: "Ambient ljud",
  src:   "castle/ambient.mp3",  // path relative to assets root
}
```

### Control types

| type         | Description                                                              | Required fields |
| ------------ | ------------------------------------------------------------------------ | --------------- |
| `360-photo`  | Equirectangular still image shown on headset                             | `src`           |
| `360-video`  | Equirectangular video, loops or plays once                               | `src`           |
| `flat-video` | Video shown as a flat screen in 3D space                                 | `src`           |
| `audio`      | Background/ambient audio, loops during scene                             | `src`           |
| `narration`  | Narration track — UI distinction from ambient, can duck background audio | `src`           |

---

## WAITING_CONTROLS

Shared controls used in all tours. Clicking them sets `activeSceneId` directly — no navigation to DetailPage.

```js
export const WAITING_CONTROLS = [
  {
    id: "waiting",
    label: "Vänta på start",
    icon: "schedule",
    color: "#FFB95A",
  },
  {
    id: "remove-headset",
    label: "Ta av headset",
    icon: "headset_off",
    color: "#FFB4AB",
  },
];
```

---

## Firebase structure

```json
{
  "rooms": {
    "<sessionId>": {
      "tourId": "kalmar-medeltid",
      "activeSceneId": "castle",
      "activeControls": {
        "castle-360": true,
        "castle-amb": true
      },
      "controller": "<uid>",
      "clients": {},
      "createdAt": 1774960749815,
      "updatedAt": 1774963121964
    }
  }
}
```

- `tourId` — set once when the guide opens OverviewPage, client uses it to look up tour data
- `activeSceneId` — current scene, drives the chip in OverviewPage
- `activeControls` — map of active control IDs → `true`, allows multiple simultaneous controls

> **Rule:** when `activeSceneId` changes, `activeControls` is reset to `{}` in the same write. If not, stale control IDs from the previous scene remain `true` in Firebase and cause silent bugs.

---

## saas-adapter API (controller)

| Function                                            | Description                                                  |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `setTourId(sessionId, tourId)`                      | Write tourId to Firebase — called once on OverviewPage mount |
| `publish(sessionId, sceneId)`                       | Set activeSceneId + reset activeControls to `{}`             |
| `toggleControl(sessionId, controlId, currentValue)` | Set or remove a single control in activeControls             |

---

## Tour object (tours/)

Tours are the single source of truth — used by both controller and client. Each tour is a JS file in `tours/` and exported via `tours/index.js`.

Each scene has a `controls` array. Each control has a unique `id`, a `type`, a `label`, and a `src` path.

```js
// tours/kalmar-medeltiden.js
{
  id: "kalmar-medeltid",
  title: "Kalmar Medeltid",
  icon: "castle",
  image: import("./img/kalmar-kyrka.png"),
  durationMinutes: 120,
  scenes: [
    {
      id: "castle",
      label: "Kalmar slott",
      icon: "castle",
      color: "#573c9b",
      controls: [
        { 
          id: "castle-360", 
          type: "360-photo",
          label: "Visa slottet",
          src: "castle/image.jpg" 
        },
        { 
          id: "castle-amb",
          type: "audio",
          label: "Ambient ljud",
          src: "castle/ambient.mp3" 
        },
        { 
          id: "castle-nar",
          type: "narration",
          label: "Berättarröst",
          src: "castle/narration.mp3" 
        },
      ]
    }
  ]
}
```

`WAITING_CONTROLS` (waiting, remove-headset) are exported separately from `tours/waiting-controls.js` and are shared across all tours.


---

## Navigation flow

```
ToursPage
  └─ click tour → OverviewPage?tourId=X
       │            writes tourId to Firebase on mount
       ├─ click WAITING_CONTROL → publish(sceneId) directly, no navigation
       └─ click scene → DetailPage?tourId=X&sceneId=Y
                          publishes sceneId on mount
                          └─ toggle control → toggleControl(controlId)
```

---

## Full example

```js
// tours/kalmar-medeltiden.js
import image from "./img/kalmar-kyrka.png";

export default {
  id: "kalmar-medeltid",
  title: "Kalmar Medeltid",
  image,
  icon: "castle",
  durationMinutes: 120,
  scenes: [
    {
      id: "castle",
      label: "Kalmar slott",
      icon: "castle",
      color: "#CFBCFF",
      controls: [
        {
          id: "castle-360",
          type: "360-photo",
          label: "Visa slottet",
          src: "castle/image.jpg",
        },
        {
          id: "castle-amb",
          type: "audio",
          label: "Ambient ljud",
          src: "castle/ambient.mp3",
        },
        {
          id: "castle-nar",
          type: "narration",
          label: "Berättarröst",
          src: "castle/narration.mp3",
        },
      ],
    },
    {
      id: "church",
      label: "Kalmar domkyrka",
      icon: "church",
      color: "#102a54",
      controls: [
        {
          id: "church-360",
          type: "360-photo",
          label: "Visa kyrkan",
          src: "church/image.jpg",
        },
        {
          id: "church-org",
          type: "audio",
          label: "Orgelmusik",
          src: "church/organ.mp3",
        },
      ],
    },
  ],
};
```
---

# Proposed: scene `src` + sceneEditor export structure

### Problem

Currently a scene has no `src` field of its own. The client falls back to the first `360-photo` control as the default panorama (`resolvePrimaryPanoramaControl`). This works but conflates "ground image" with "activatable control", making the intent unclear.

### WebXR constraint: one 360-photo per scene

Swapping a PhotoDome texture mid-session causes the WebXR compositor on standalone headsets (Pico, Quest) to terminate the session. Preloading multiple domes and toggling visibility also fails due to GPU memory pressure on constrained devices.

**Consequence:** each scene can only have one 360-photo. The `360-photo` control type is therefore removed — the panorama is instead a fixed property of the scene (`src`), loaded once when the XR session starts and never swapped during the session.

Controls are limited to `audio` and `narration`.

### Proposed scene change

Add a `src` field to the scene object — the panorama loaded when the XR session starts for this scene:

```js
{
  id: "castle",
  label: "Kalmar slott",
  src: "castle/panorama.jpg",        // ← 360-image, loaded on XR session start
  image: "castle/thumbnail.jpg",     // ← small thumbnail for controller UI
  controls: [
    { id: "castle-amb", type: "audio",     src: "castle/ambient.mp3",    label: "Ambient ljud" },
    { id: "castle-nar", type: "narration", src: "castle/narration.mp3",  label: "Berättarröst" },
  ]
}
```

`resolvePrimaryPanoramaControl` is replaced by simply reading `scene.src` directly.


### Proposed sceneEditor export structure

sceneEditor (separate project) exports a zip with two folders — one per app:

```bash
export.zip
  controller/
    scene-1/
      thumbnail.jpg     ← downscaled preview (e.g. 400px wide), generated by sceneEditor
  client/
    scene-1/
      panorama.jpg      ← full equirectangular 360-image
      ambient.mp3
      narration.mp3
```

The user pastes each folder into the respective app's assets directory:
```
controller/public/assets/scene-1/...
client/public/assets/scene-1/...
```

The exported `scenes.json` references both paths:
```json
{
  "id": "scene-1",
  "src": "scene-1/panorama.jpg",
  "image": "scene-1/thumbnail.jpg",
  "controls": [
    { "id": "scene-1-amb", "type": "audio",     "src": "scene-1/ambient.mp3",   "label": "Ambient ljud" },
    { "id": "scene-1-nar", "type": "narration", "src": "scene-1/narration.mp3", "label": "Berättarröst" }
  ]
}
```

### Why not a single shared folder?

- Controller bundles images as ES module imports (Vite, hashed filenames)
- Client serves images as static files from `public/assets/` (URL strings at runtime)
- Splitting by app keeps each deployment lean — client doesn't ship controller thumbnails, controller doesn't ship full 360-images

### Thumbnail duplication

The thumbnail (`image`) is a downscaled version of the panorama (`src`), generated automatically by sceneEditor at export — size difference is negligible.
