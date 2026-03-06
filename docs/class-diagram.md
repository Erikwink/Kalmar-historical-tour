# Klassdiagram — Kalmar Historical Tour

```mermaid
classDiagram
    namespace GuideController {
        class Controller {
            -sessionId: string
            -headsets: Headset[]
            -activeScene: string
            -SaasStatus: string
        }
        class SessionPage {
            +sessionId: string
            +headsets: Headset[]
        }
        class MainPage {
            +headsets: Headset[]
            +activeScene: string
        }
    }

    namespace SaasAdapter {
        class Firebase {
            +connect(sessionId)
            +publish(sessionId, sceneId)
            +onHeadsetsChange(sessionId, callback)
            +join(sessionId, clientId, label)
            +heartbeat(sessionId, clientId, status)
            +leave(sessionId, clientId)
            +onSceneChange(sessionId, callback)
        }
       
    }
 class Headset {
            +id: string
            +label: string
            +status: string
            +lastSeenAt: number
        }
        class Scene {
            +id: string
            +label: string
            +icon: string
            +color: string
            +subScenes: SubScene[]
        }
        class SubScene {
            <<audio-que>>
            <<scenes triggerd by controller>>
            +id: string
            +type: string
            +content: string
        }
    namespace HeadsetClient {
        class ClientApp {
            -sessionId: string
            -clientId: string
            -currentScene: string
            +joinSession()
            +sendHeartbeat()
            +reconnect()
            +leaveSession()
        }
        class JoinPage {
            +onJoin(sessionId)
        }
        class SceneView {
            +currentScene: string
            %% Renderas med Babylon.js + WebXR
        }
    }

    %% Controller
    Controller --> SessionPage : renders
    Controller --> MainPage : renders
    Controller --> Firebase : via saas-adapter
    SessionPage --> Headset : visar lista
    MainPage --> Scene : visar knappar
    MainPage --> Headset : visar lista

    %% Client
    ClientApp --> JoinPage : renders
    ClientApp --> SceneView : renders
    ClientApp --> Firebase : via saas-adapter
    SceneView --> Scene : renderar aktiv scen
    Scene --> SubScene : kan innehålla
```

## Tekniker per del

| Del | Teknik |
|-----|--------|
| GuideController | React, Vite |
| HeadsetClient | React, Babylon.js, WebXR |
| SaasAdapter | Firebase Realtime Database |
| Deploy | Netlify |
