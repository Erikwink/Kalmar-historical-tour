// index.js
import { Firebase } from "./Firebase.js"

const adapter = new Firebase()

// -----------------------------
// Controller API
// -----------------------------
export const loginController = adapter.loginController.bind(adapter) // logga in med email + password i firebase
export const connect = adapter.connect.bind(adapter)        // skapa session
export const setTourId = adapter.setTourId.bind(adapter)   // sätts en gång vid tour-start
export const publish = adapter.publish.bind(adapter)       // skicka scen till alla (rensar activeControls)
export const toggleControl = adapter.toggleControl.bind(adapter) // toggle en control i activeControls
export const onHeadsetsChange = adapter.onHeadsetsChange.bind(adapter) // lyssna på presence
export const disconnect = adapter.disconnect.bind(adapter)      // städa upp vid stängning. Removes all data for session
export const removeHeadset = adapter.removeHeadset.bind(adapter) // ta bort ett headset ur sessionen
export const removeAllRooms = adapter.removeAllRooms.bind(adapter) // dev only

// -----------------------------
// Client API
// -----------------------------
export const loginClient = adapter.loginClient.bind(adapter) // logga in anonymt
export const join = adapter.join.bind(adapter)             // registrera + starta heartbeat
export const heartbeat = adapter.heartbeat.bind(adapter)   // skicka status + lastSeenAt
export const ready = adapter.ready.bind(adapter)           // markera headset redo
export const leave = adapter.leave.bind(adapter)           // lämna session
export const onSceneChange = adapter.onSceneChange.bind(adapter) // lyssna på scen-kommandon
export const onTourIdChange = adapter.onTourIdChange.bind(adapter) // lyssna på aktiv tour
export const onActiveControlsChange = adapter.onActiveControlsChange.bind(adapter) // lyssna på aktiva controls
