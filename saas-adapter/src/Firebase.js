import { initializeApp } from "firebase/app"
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
  onDisconnect,
  remove,
  runTransaction
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
  // Controller: skapa session (atomic)
  // Throws error if room already exists — controller retries with new sessionId
  // -----------------------------
  async connect(sessionId) {
    const sessionRef = ref(this.db, `rooms/${sessionId}`)
    const result = await runTransaction(sessionRef, (current) => {
      if (current !== null) {
        return undefined // abort — room already exists
      }
      return { createdAt: Date.now() }
    })
    if (!result.committed) {
      throw new Error(`Session ${sessionId} is already in use`)
    }
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
  // Dev: ta bort alla rum utom 123456
  // -----------------------------
  async removeAllRooms() {
    const roomsRef = ref(this.db, "rooms")
    const snapshot = await get(roomsRef)
    if (!snapshot.exists()) return

    const removes = []
    snapshot.forEach(child => {
      if (child.key !== "123456") {
        removes.push(remove(ref(this.db, `rooms/${child.key}`)))
      }
    })
    await Promise.all(removes)
  }

  // -----------------------------
  // Client: anslut headset
  // Returnerar ett objekt med cancel() för att avbryta onDisconnect
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
    const disconnectHandler = onDisconnect(clientRef).update({
      status: "offline"
    })

    // Returnera ett objekt med en cancel-funktion
    return {
      cancel: () => disconnectHandler.cancel()
    }
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

  // -----------------------------
  // Controller: lämna session (städa upp)
  // -----------------------------
  async disconnect(sessionId) {
    const sessionRef = ref(this.db, `rooms/${sessionId}`)
    await remove(sessionRef)
  }
}