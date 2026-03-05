# Förslag på adapter/backend-logic

## controller använder:
- adapter.connect(sessionId)           ->  anslut som publisher  / skapa room
- adapter.publish(sessionId, sceneId)  -> skicka scen till alla
- adapter.onHeadsetsChange(sessionId, callback)  -> lyssna på presence
- adapter.disconnect()                          -> ta bort room

## client använder:
- adapter.join(sessionId, headsetId)        -> registrera + starta heartbeat
- adapter.onSceneChange(sessionId, callback) -> lyssna på scen-kommandon
- adapter.leave(sessionId, headsetId)        -> städa upp vid stängning

# kalmar-xr-tour

An XR-powered historical walking tour of Kalmar, Sweden. Visitors wear VR headsets while a guide triggers historical scenes remotely — medieval churches materialize, Danish raids unfold, all layered on top of the real world.

---

## Architecture Overview

```
kalmar-xr-tour/
├── client/          # WebXR app running in the headsets
├── controller/      # Guide's mobile interface for triggering scenes
├── backend-adapter/ # Decoupled SaaS adapter (Firebase / Supabase / PocketBase)
└── docs/            # Tech decisions, scene ideas, AI prompts
```

The three packages are **independently deployable**. The `client` and `controller` communicate only through the `backend-adapter` interface — neither knows which SaaS provider is used under the hood.

---

## Packages

### `client/` — WebXR App

Runs inside the VR headsets (Meta Quest 3, or any WebXR-compatible device). Connects to the backend adapter and renders scenes on command.

**Responsibilities:**
- Connect to backend and listen for scene commands (SSE or WebSocket)
- Render scenes: image/video overlays on passthrough (AR) or 360° background (full VR)
- Play spatial audio per scene
- Smoothly transition between scenes
- Handle two baseline scenes: `waiting` and `remove-headset`

**Tech:** Three.js / Babylon.js / A-Frame (document choice in `docs/tech-decisions.md`)

**Key structure:**
```
client/
├── src/
│   ├── main.js               # Entry point, WebXR init
│   ├── core/
│   │   ├── sceneManager.js   # Listens for commands, switches scenes
│   │   ├── backendClient.js  # Thin wrapper around backend-adapter
│   │   └── audioManager.js   # Spatial audio
│   └── scenes/
│       ├── waitingScene.js
│       ├── removeHeadsetScene.js
│       ├── churchScene.js
│       └── danishRaidsScene.js
└── assets/
    ├── images/
    ├── videos/
    └── audio/
```

Each scene exports `load()` and `unload()`. `sceneManager.js` calls these on transition.

---

### `controller/` — Guide's Mobile Interface

A minimal web app the guide uses on their phone to trigger scenes for all connected headsets.

**Responsibilities:**
- Display all available scenes as tappable buttons
- Send scene commands to the backend adapter
- Work reliably on a mobile browser over a shared WiFi hotspot

**Not a priority:** visual polish. Functional > pretty.

**Key structure:**
```
controller/
├── src/
│   ├── main.js        # Sends scene commands on button press
│   └── scenes.js      # List of scene IDs and display names
└── index.html
```

---

### `backend-adapter/` — SaaS Abstraction Layer

A thin adapter that decouples the client and controller from any specific SaaS backend. Swap providers by changing the adapter, not the apps.

**Responsibilities:**
- Expose a consistent interface: `publish(sceneId)` and `subscribe(onScene)`
- Handle connection setup and reconnect logic
- Abstract over SSE, WebSocket, or realtime subscriptions depending on provider

**Interface contract:**
```js
// publish (used by controller)
adapter.publish(sceneId: string): Promise<void>

// subscribe (used by client)
adapter.subscribe(callback: (sceneId: string) => void): () => void
```

**Supported providers (one active at a time):**
```
backend-adapter/
├── index.js             # Re-exports the active provider
├── firebase.js          # Firebase Realtime Database / Firestore
├── supabase.js          # Supabase Realtime
└── pocketbase.js        # PocketBase (self-hosted option)
```

Switch provider by changing the import in `index.js`. No auth required — a shared secret session ID is sufficient to connect clients.

---

## Scenes

| Scene ID           | Description                                      |
|--------------------|--------------------------------------------------|
| `waiting`          | Default on headset startup — "Please wait"       |
| `remove-headset`   | Transition between locations                     |
| `church`           | Medieval church at Söderport cemetery            |
| `danish-raids`     | Danish attack on Gullbrandssonska lyckan         |

Add new scenes by creating a file in `client/src/scenes/` and registering the ID in `controller/src/scenes.js`.

---
