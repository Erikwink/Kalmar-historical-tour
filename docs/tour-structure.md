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

export const tours = [
  kalmarMedeltiden,
];

export { WAITING_CONTROLS } from "./waiting-controls";
```

```js
// tours/kalmar-medeltiden.js
import image from "./img/kalmar-kyrka.png";

export default {
  id:    "kalmar-medeltid",   // unique ID, used in Firebase + routing
  title: "Kalmar Medeltid",
  image,                      // thumbnail for tour list
  icon:  "castle",            // material symbol
  scenes: [ /* Scene[] */ ],
};
```

---

## Scene

```js
{
  id:    "castle",      // unique within tour, used as activeSceneId value
  label: "Kalmar slott",
  icon:  "castle",      // material symbol
  color: "#CFBCFF",     // accent color in UI
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

| type | Description | Required fields |
|---|---|---|
| `360-photo` | Equirectangular still image shown on headset | `src` |
| `360-video` | Equirectangular video, loops or plays once | `src` |
| `flat-video` | Video shown as a flat screen in 3D space | `src` |
| `audio` | Background/ambient audio, loops during scene | `src` |
| `narration` | Narration track — UI distinction from ambient, can duck background audio | `src` |

---

## WAITING_CONTROLS

Shared controls used in all tours. Clicking them sets `activeSceneId` directly — no navigation to DetailPage.

```js
export const WAITING_CONTROLS = [
  { id: "waiting",        label: "Vänta på start", icon: "schedule",    color: "#FFB95A" },
  { id: "remove-headset", label: "Ta av headset",  icon: "headset_off", color: "#FFB4AB" },
];
```

---

## Firebase structure

```json
{
  "rooms": {
    "<sessionId>": {
      "tourId":        "kalmar-medeltid",
      "activeSceneId": "castle",
      "activeControls": {
        "castle-360": true,
        "castle-amb": true
      },
      "controller": "<uid>",
      "clients":    { },
      "createdAt":  1774960749815,
      "updatedAt":  1774963121964
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

| Function | Description |
|---|---|
| `setTourId(sessionId, tourId)` | Write tourId to Firebase — called once on OverviewPage mount |
| `publish(sessionId, sceneId)` | Set activeSceneId + reset activeControls to `{}` |
| `toggleControl(sessionId, controlId, currentValue)` | Set or remove a single control in activeControls |

---

## scenes.json

Produced by the Scene Editor, consumed by the client. Keyed by scene ID for O(1) lookup (`scenes[id]`).

`src` is always a top-level field. Volume, fadeIn etc. are separate optional fields.

```json
{
  "version": "1",
  "scenes": {
    "castle": {
      "type":      "360-photo",
      "src":       "castle/image.jpg",
      "ambientSrc": "castle/ambient.mp3",
      "volume":    0.6,
      "fadeIn":    1.5
    },
    "church": {
      "type": "360-photo",
      "src":  "church/image.jpg"
    },
    "waiting":        { "type": "waiting" },
    "remove-headset": { "type": "message", "text": "Ta av dig headsetet" }
  }
}
```

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
  id:    "kalmar-medeltid",
  title: "Kalmar Medeltid",
  image,
  icon:  "castle",
  scenes: [
    {
      id:    "castle",
      label: "Kalmar slott",
      icon:  "castle",
      color: "#CFBCFF",
      controls: [
        { id: "castle-360", type: "360-photo", label: "Visa slottet",  src: "castle/image.jpg" },
        { id: "castle-amb", type: "audio",     label: "Ambient ljud",  src: "castle/ambient.mp3" },
        { id: "castle-nar", type: "narration", label: "Berättarröst",  src: "castle/narration.mp3" },
      ],
    },
    {
      id:    "church",
      label: "Kalmar domkyrka",
      icon:  "church",
      color: "#102a54",
      controls: [
        { id: "church-360", type: "360-photo", label: "Visa kyrkan", src: "church/image.jpg" },
        { id: "church-org", type: "audio",     label: "Orgelmusik",  src: "church/organ.mp3" },
      ],
    },
  ],
};
```
