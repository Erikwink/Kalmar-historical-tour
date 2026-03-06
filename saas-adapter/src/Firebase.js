import { initializeApp } from "firebase/app"
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  onDisconnect,
  remove
} from "firebase/database"

import firebaseConfig from "./firebaseConfig.js"

export class Firebase {
  constructor() {
    const app = initializeApp(firebaseConfig)
    this.db = getDatabase(app)
  }

  // -----------------------------
  // Controller: skapa session
  // -----------------------------
  async connect(sessionId) {
    // if room exists and is in use, send error back and let controller create new room id??
    const sessionRef = ref(this.db, `rooms/${sessionId}`)
    await update(sessionRef, { createdAt: Date.now() })
  }


  // -----------------------------
  // Controller: publicera scen
  // -----------------------------
  async publish(sessionId, sceneId) {
    const sessionRef = ref(this.db, `rooms/${sessionId}`)

    await update(sessionRef, {
      activeSceneId: sceneId,
      updatedAt: Date.now()
    })
  }

  // -----------------------------
  // Client: lyssna på scen
  // -----------------------------
  onSceneChange(sessionId, callback) {
    const sceneRef = ref(this.db, `rooms/${sessionId}/activeSceneId`)

    return onValue(sceneRef, (snapshot) => {
      callback(snapshot.val())
    })
  }

  // -----------------------------
  // Client: anslut headset
  // -----------------------------
  async join(sessionId, clientId, label = clientId) {
    const clientRef = ref(this.db, `rooms/${sessionId}/clients/${clientId}`)

    await set(clientRef, {
      label,
      status: "online",
      lastSeenAt: Date.now(),
      ready: false,
      lastSceneId: null
    })
    
    // Markera offline automatiskt om anslutning bryts
    onDisconnect(clientRef).update({
      status: "offline"
    })
  }

  // -----------------------------
  // Controller: lyssna på headsets
  // -----------------------------
  onHeadsetsChange(sessionId, callback) {
    const clientsRef = ref(this.db, `rooms/${sessionId}/clients`)

    return onValue(clientsRef, (snapshot) => {
      const val = snapshot.val()
      callback(val ? Object.entries(val).map(([id, data]) => ({ id, ...data })) : [])
    })
  }

  // -----------------------------
  // Client: heartbeat (skicka status + lastSeenAt)
  // -----------------------------
  async heartbeat(sessionId, clientId, status = "online") {
    const clientRef = ref(this.db, `rooms/${sessionId}/clients/${clientId}`)
    await update(clientRef, { status, lastSeenAt: Date.now() })
  }

  // -----------------------------
  // Client: ändrar ready-status
  // -----------------------------
   async ready(sessionId, clientId, ready = true) {
    const clientRef = ref(this.db, `rooms/${sessionId}/clients/${clientId}`)
    await update(clientRef, { ready, lastSeenAt: Date.now() })
  }

  // -----------------------------
  // Client: lämna session
  // -----------------------------
  async leave(sessionId, clientId) {
    const clientRef = ref(this.db, `rooms/${sessionId}/clients/${clientId}`)
    await remove(clientRef)
  }
}