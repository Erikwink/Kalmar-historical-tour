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

## Getting started

```bash
# Controller
cd controller
npm install
npm run dev

# SaaS adapter (used by both controller and client)
cd saas-adapter
npm install
```

Copy `saas-adapter/example.env` to `saas-adapter/.env` and fill in your Firebase credentials.

## Docs

- [System flow & API](./docs/flow.md)
