import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { loginController, connect, onHeadsetsChange, publish, disconnect } from "../../saas-adapter/src/index"
import { FIREBASE_STATUS } from "./utils/status_maps"
import ToursPage from "./pages/Tourspage"
import SessionPage from "./pages/SessionPage"
import MainPage from "./pages/MainPage"
import SettingsPage from "./pages/Settingspage"
import LoginPage from "./pages/LoginPage"
import JoinMock from "./JoinMock" // DEV: remove when real client exists
import generateSessionId from "./utils/generateSessionId"


function AppContent() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeScene, setActiveScene] = useState("waiting")
  const [saasStatus, setSaasStatus] = useState(null)
  const [headsets, setHeadsets] = useState([])
  const [sessionId, setSessionId] = useState(generateSessionId)

  useEffect(() => {
    if (!isLoggedIn) return
    // Subscribe to real-time headset updates; unsubscribe on unmount
    const unsubscribe = onHeadsetsChange(sessionId, setHeadsets)

    async function init() {
      try {
        setSaasStatus(FIREBASE_STATUS.CONNECTING)
        await loginController(
          import.meta.env.VITE_FIREBASE_EMAIL,
          import.meta.env.VITE_FIREBASE_PASSWORD);
        await connect(sessionId);
        await publish(sessionId, "waiting")
        setSaasStatus(FIREBASE_STATUS.CONNECTED);
      } catch (e) {
        // Session conflict: room already exists (collision detected)
        // Generate new sessionId and retry
        console.warn(`Session ${sessionId} already in use, generating new ID`, e)
        setSessionId(generateSessionId())
      }
    }
    init()

    return unsubscribe
  }, [sessionId, isLoggedIn])

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

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage onLogin={() => setIsLoggedIn(true)} />} />
      </Routes>
    )
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

