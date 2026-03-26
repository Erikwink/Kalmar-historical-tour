import { initializeApp } from "firebase/app"
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
  onDisconnect,
  remove
} from "firebase/database"

import { getAuth, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth"
import firebaseConfig from "./firebaseConfig.js"

const DEFAULT_SCENE_ID = "waiting"

export class Firebase {
  constructor() {
    const app = initializeApp(firebaseConfig)
    this.db = getDatabase(app)
    this.auth = getAuth(app)
  }

  // -----------------------------
  // Controller: logga in med email + password i firebase
  // -----------------------------
  async loginController(email, password) {
    if (!this.auth.currentUser) {
      await signInWithEmailAndPassword(this.auth, email, password)
    }
  }

  // -----------------------------
  // Controller: skapa session
  // -----------------------------
  async connect(sessionId) {
    // if room exists and is in use, send error back and let controller create new room id??
    const sessionRef = ref(this.db, `rooms/${sessionId}`)
    await update(sessionRef, {
      controller: this.auth.currentUser.uid,
      createdAt: Date.now(),
      activeSceneId: DEFAULT_SCENE_ID
    })
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
  // Client: logga in anonymt (om inte redan inloggad)
  // -----------------------------
  async loginClient() {
    if (!this.auth.currentUser) {
      await signInAnonymously(this.auth)
    }
  }

  // -----------------------------
  // Client: lyssna på scen
  // -----------------------------
  onSceneChange(sessionId, callback) {
    const sceneRef = ref(this.db, `rooms/${sessionId}/activeSceneId`)

    return onValue(sceneRef, (snapshot) => {
      const value = snapshot.val()
      callback(typeof value === "string" && value ? value : DEFAULT_SCENE_ID)
    })
  }

  // -----------------------------
  // Dev: ta bort alla rum
  // -----------------------------
  async removeAllRooms() {
    const roomsRef = ref(this.db, "rooms")
    await remove(roomsRef)
  }

  // -----------------------------
  // Client: anslut headset
  // -----------------------------
  async join(sessionId, clientId, label = clientId) {
    const sessionRef = ref(this.db, `rooms/${sessionId}`)
    const snapshot = await get(sessionRef)
    if (!snapshot.exists()) {
      throw new Error(`Session ${sessionId} finns inte.`)
    }

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