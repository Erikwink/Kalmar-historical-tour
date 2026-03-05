// index.js
import { Firebase } from "./firebase.js"

const adapter = new Firebase()

// -----------------------------
// Controller API
// -----------------------------
export const connect = adapter.connect.bind(adapter)        // skapa session
export const publish = adapter.publish.bind(adapter)       // skicka scen till alla
export const onHeadsetsChange = adapter.onHeadsetsChange.bind(adapter) // lyssna på presence
export const disconnect = adapter.leave.bind(adapter)      // städa upp vid stängning

// -----------------------------
// Client API
// -----------------------------
export const join = adapter.join.bind(adapter)             // registrera + starta heartbeat
export const heartbeat = adapter.heartbeat.bind(adapter)   // skicka status + lastSeenAt
export const leave = adapter.leave.bind(adapter)           // lämna session
export const onSceneChange = adapter.onSceneChange.bind(adapter) // lyssna på scen-kommandon