# Kalmar WebXR Client

React/Vite client for the headset flow and the isolated Babylon WebXR sandbox.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

## WebXR Sandbox

Open `webxr.html` through Vite and use `?session=123456` to auto-connect a scene stream.

The sandbox now includes a dedicated `locomotion-test` scene with:

- a large floor area for teleportation testing
- elevated platforms that can act as additional teleport targets
- Babylon teleportation wired to the right-hand VR controller
- custom left-thumbstick locomotion wired on top of Babylon XR input
- a local scene preview button that works even when the real scene stream is connected
- desktop locomotion controls in simulation: `W/A/S/D` or arrow keys to move, mouse drag to look, and double-click to teleport on valid floor meshes

## Current limitation

Teleportation and thumbstick locomotion are implemented and scene-wired, but they still require a real immersive-vr headset session to fully verify controller behavior and comfort.
