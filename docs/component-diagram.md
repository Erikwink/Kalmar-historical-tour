# Komponentdiagram — Kalmar Historical Tour

```mermaid
graph LR
    
        subgraph Controller["Guide Controller"]
            App["App"]
            subgraph ControllerUI["Pages & Components"]
                SP["SessionPage"]
                OP["OverviewPage"]
            end
            ControllerAdapter["saas-adapter"]
        end

        subgraph Client["VR Headset Client"]
            ClientApp["ClientApp"]
            subgraph ClientUI["Pages & Components"]
                JP["JoinPage"]
                SV["SceneView\n(Babylon.js / WebXR)"]
            end
            ClientAdapter["saas-adapter"]
        end
    

    FirebaseDB[("Firebase\nRealtime Database")]

    App --> SP & MP
    App --> ControllerAdapter
    ControllerAdapter --> FirebaseDB

    ClientApp --> JP & SV
    ClientApp --> ClientAdapter
    ClientAdapter --> FirebaseDB
```

## Flöde
1. Guide öppnar Controller → session skapas i Firebase
2. Besökare scannar QR → anger session-ID i `JoinPage`
3. `ClientApp` anropar `join()` → headset registreras 
4. `ClientApp` lyssnar via `onSceneChange()` → `SceneView` uppdateras i WebXR
5. `ClientApp` skickar `heartbeat()` periodiskt → status hålls levande
6. Om uppkoppling bryts → `ClientApp` återansluter automatiskt, Controller visar headset som offline under tiden
7. Vid avslut anropas `leave()` → headset tas bort från listan
