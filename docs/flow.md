# System Flow — Kalmar Historical Tour

## Datastruktur i Firebase

```
rooms/
  {sessionId}/
    createdAt:     number          ← när rummet skapades
    activeSceneId: string | null   ← aktuell scen
    updatedAt:     number          ← senaste gången scen byttes
    clients/
      {clientId}/
        label:       string        ← visningsnamn, t.ex. "Headset 1"
        status:      string        ← "online" | "offline"
        lastSeenAt:  number        ← senaste heartbeat
        ready:       boolean       ← false, när användare trycker redo true
        lastSceneId: string | null ← scene ID klinten har aktivt
```

---

## Flöde 1 — Controller startar session

```mermaid
sequenceDiagram
    participant C as Controller
    participant F as Firebase

    C->>F: connect(sessionId)<br/>{ createdAt: timestamp }
    F-->>C: OK
    C->>F: onHeadsetsChange(sessionId) [subscribe]
    F-->>C: (live uppdateringar när headsets ansluter)
```

---

## Flöde 2 — Controller publicerar scen

```mermaid
sequenceDiagram
    participant C as Controller
    participant F as Firebase
    participant H as Client

    C->>F: publish(sessionId, sceneId)<br/>{ activeSceneId: string<br> updatedAt: timestamp }
    F-->>C: OK
    F-->>H: (live update) activeSceneId
```

---

## Flöde 3 — Client ansluter till session

```mermaid
sequenceDiagram
    participant H as Client
    participant F as Firebase

    note over H: Användaren skriver in 6-siffrig kod
    H->>F: join(sessionId, clientId, label)<br>{ label: Namn<br> status: online<br> lastSeenAt: timestamp<br> ready: false<br> lastSceneId: null }
    F-->>H: onDisconnect → status: "offline"
    H->>F: onSceneChange(sessionId) [subscribe]
    F-->>H: (live uppdateringar när scen byts)
```

---

## Flöde 4 — Client skickar heartbeat

```mermaid
sequenceDiagram
    participant H as Client
    participant F as Firebase

        H->>F: heartbeat(sessionId, clientId)<br/>{ status: online <br> lastSeenAt: Timestamp }
        note over H: 10 sekunder
        H->>F: heartbeat(sessionId, clientId)<br/>{ status: online <br> lastSeenAt: Timestamp }
        note over H: 10 sekunder
        H->>F: heartbeat(sessionId, clientId)<br/>{ status: online <br> lastSeenAt: Timestamp }
    
```

---

## Flöde 5 — Client lämnar session

```mermaid
sequenceDiagram
    participant H as Client
    participant F as Firebase

    H->>F: leave(sessionId, clientId)
    F-->>H: OK (tar bort clients/{clientId})
```

---

## Flöde 6 — Controller avslutar session

```mermaid
sequenceDiagram
    participant C as Controller
    participant F as Firebase

    C->>F: disconnect(sessionId)
    F-->>C: OK (tar bort hela rooms/{sessionId})
    note over C: Rensar sessionId från localStorage
    note over C: Återgår till startsidan
```

> `disconnect` saknas ännu i Firebase.js och behöver läggas till.

---

## API-översikt

| Metod | Anropas av | Vad den gör |
|---|---|---|
| `connect(sessionId)` | Controller | Skapar rum i Firebase |
| `publish(sessionId, sceneId)` | Controller | Byter aktiv scen |
| `onHeadsetsChange(sessionId, cb)` | Controller | Lyssnar på anslutna headsets |
| `disconnect(sessionId)` | Controller | Tar bort hela rummet |
| `join(sessionId, clientId, label)` | Client | Registrerar headset i rummet |
| `heartbeat(sessionId, clientId, status)` | Client | Skickar heartbeat var 10:e sekund |
| `leave(sessionId, clientId)` | Client | Tar bort headset från rummet |
| `onSceneChange(sessionId, cb)` | Client | Lyssnar på scenbyte |

---

## Felhantering
Kan vara redundant med både `heartbeat` och `onDisconnect`, återstår att se?
| Scenario | Beteende |
|---|---|
| Client tappar anslutning | `onDisconnect` sätter `status: "offline"` på klienten |
| Heartbeat uteblir | Framtida feature: controller visar headset som offline efter timeout |
