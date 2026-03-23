import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { connect, onHeadsetsChange, publish, disconnect } from "../../saas-adapter/src/index"
import { FIREBASE_STATUS } from "./utils/status_maps"
import ToursPage from "./pages/Tourspage"
import SessionPage from "./pages/SessionPage"
import MainPage from "./pages/MainPage"
import SettingsPage from "./pages/Settingspage"
import JoinMock from "./JoinMock" // DEV: remove when real client exists

/**
 * Generates a 6-digit session ID and saves it to local storage.
 *
 * @returns {string} 6-digit session ID
 */
function generateSessionId() {
  const existing = localStorage.getItem("sessionId")
  if (existing) {
    return existing
  } else {
  const sessionId = Math.floor(100000 + Math.random() * 900000).toString()
  localStorage.setItem("sessionId", sessionId)
  return sessionId
  }
  //return "123456"
}

function AppContent() {
  const navigate = useNavigate()
  const [activeScene, setActiveScene] = useState("waiting")
  const [saasStatus, setSaasStatus] = useState(null)
  const [headsets, setHeadsets] = useState([])
  // Session ID is generated once and never changes for the lifetime of the app
  const [sessionId, setSessionId] = useState(generateSessionId)

  useEffect(() => {
    // Subscribe to real-time headset updates; unsubscribe on unmount
    const unsubscribe = onHeadsetsChange(sessionId, setHeadsets)

    async function init() {
      try {
        setSaasStatus(FIREBASE_STATUS.CONNECTING);
        await loginController(
          import.meta.env.VITE_FIREBASE_EMAIL,
          import.meta.env.VITE_FIREBASE_PASSWORD);
        await connect(sessionId);
        await publish(sessionId, "waiting")
        setSaasStatus(FIREBASE_STATUS.CONNECTED);
      } catch (e) {
        console.error("failed to connect to adapter:", e)
        setSaasStatus(FIREBASE_STATUS.ERROR)
      }
    }
    init()

    return unsubscribe
  }, [sessionId])

  /**
   * Publishes a scene change to all connected headsets.
   * Updates local activeScene only on success to keep UI in sync with Firebase.
   * @param {string} sceneId - ID of the scene to activate
   */
  async function handleScenePress(sceneId) {
    try {
      await publish(sessionId, sceneId)
      setActiveScene(sceneId)
    } catch (e) {
      console.error("failed to publish scene:", e)
      setSaasStatus(FIREBASE_STATUS.ERROR)
    }
  }

  /**
   * Ends the tour session by disconnecting from Firebase and clearing the active session.
   */
  async function handleEndSession() {
    try {
      await disconnect(sessionId)
      localStorage.removeItem("sessionId")
      setActiveScene("waiting") // resets scene
      setSessionId(generateSessionId) // Generate new session id
      setSaasStatus(null)     // resets connection state
      navigate('/')           // returns to start page
    } catch (e) {
      console.error("failed to disconnect from adapter:", e)
      setSaasStatus(FIREBASE_STATUS.ERROR)
    }
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<ToursPage />} />
        <Route
          path="/session"
          element={
            <SessionPage
              sessionId={sessionId}
              headsets={headsets}
              adapterStatus={saasStatus}
            />
          }
        />
        <Route
          path="/tour"
          element={
            <MainPage
              activeScene={activeScene}
              onScenePress={handleScenePress}
              onEndSession={handleEndSession}
            />
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      {/* REMOVE MOCK ONCE CLIENT IS IMPLEMENTED */}
      <JoinMock sessionId={sessionId} headsets={headsets} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter >
  )
}

