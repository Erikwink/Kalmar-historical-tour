# Förslag på adapter/backend-logic

// controller använder:
adapter.connect(sessionId)           // anslut som publisher
adapter.publish(sessionId, sceneId)  // skicka scen till alla
adapter.onHeadsetsChange(sessionId, callback)  // lyssna på presence
adapter.disconnect()

// client använder:
adapter.join(sessionId, headsetId)        // registrera + starta heartbeat
adapter.onSceneChange(sessionId, callback) // lyssna på scen-kommandon
adapter.leave(sessionId, headsetId)        // städa upp vid stängning