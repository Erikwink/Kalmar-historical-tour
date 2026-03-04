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
  async join(sessionId, clientId) {
    const clientRef = ref(this.db, `rooms/${sessionId}/clients/${clientId}`)

    await set(clientRef, {
      status: "online",
      lastSeenAt: Date.now(),
      ready: true,
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
      callback(snapshot.val())
    })
  }

  // -----------------------------
  // Client: lämna session
  // -----------------------------
  async leave(sessionId, clientId) {
    const clientRef = ref(this.db, `rooms/${sessionId}/clients/${clientId}`)
    await remove(clientRef)
  }
}