# Kalmar Historical Tour

A guided VR tour system where a controller (guide) leads headset clients through historical scenes in real time.

## How it works

1. The **controller** starts a session and gets a 6-digit code
2. **Clients** (VR headsets) enter the code to join the session
3. The controller navigates between scenes — all connected headsets update instantly via Firebase

## Structure

```
controller/      React app for the tour guide
client/          VR client app for headsets (WebXR + Babylon.js)
saas-adapter/    Firebase integration shared by both
docs/            Flow diagrams and documentation
```
## Docs

- [System flow & API](./docs/flow.md)
- [Component-diagram](./docs/component-diagram.md)
- [Class-diagram](./docs/class-diagram.md)
- [Tours JSON structure](./docs/tour-structure.md)

## Scene editor tool
[Scene editor](https://github.com/Gemerin/sceneEditorTool)

## Getting started

Install dependencies:

```bash
npm install
cd client && npm install && cd ..
cd controller && npm install && cd ..
cd saas-adapter && npm install && cd ..
```

Copy `saas-adapter/example.env` to `controller/.env` and `client/.env` and fill in your Firebase credentials.

Start both apps:

```bash
npm run dev
```

This starts:
```
[client]      ➜  Local:   http://localhost:5173/
[client]      ➜  Network: http://xxx.xxx.x.xxx:5173/
[controller]  ➜  Local:   http://localhost:5174/
[controller]  ➜  Network: http://xxx.xxx.x.xxx:5174/
```

## Testing with a physical VR headset (ngrok)

The headset needs to reach the client app via a public URL. Use ngrok for this.

**First-time setup:**
1. Create a free account at [ngrok.com](https://ngrok.com)
2. Add your auth token:
   ```bash
   ngrok config add-authtoken <your-token>
   ```

**Start the tunnel** (in a separate terminal while `npm run dev` is running):
```bash
npm run ngrok
```

ngrok will print a public URL, e.g. `https://abc123.ngrok-free.app` — open it in the headset browser.

> **Tip:** On the same local network you can skip ngrok and use the network IP printed in the terminal when the dev server starts, e.g. `http://xxx.xxx.x.xxx:5173`.

> **Note:** The ngrok auth token is personal and stored locally — it is not checked into the repo.

## Docs

- [System flow & API](./docs/flow.md)
- [Component-diagram](./docs/component-diagram.md)
- [Class-diagram](./docs/class-diagram.md)
- [Tours JSON structure](./docs/)
