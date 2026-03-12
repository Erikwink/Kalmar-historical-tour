import { Firebase } from "./firebase.js"

const adapter = new Firebase()

// Publicera en scen
adapter.publish("123456", "church")

// Registrera headset
adapter.join("123456", "headset02")

// Lyssna på scenändringar
adapter.onSceneChange("123456", (sceneId) => {
  console.log("Ny scen:", sceneId)
})