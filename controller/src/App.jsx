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
  const [activeScene, setActiveScene] = useState("waiting")
  const [saasStatus, setSaasStatus] = useState(null)
  const [headsets, setHeadsets] = useState([])
  const [sessionId, setSessionId] = useState(generateSessionId)

  useEffect(() => {
    const unsubscribe = onHeadsetsChange(sessionId, setHeadsets)

    async function init() {
      const isReconnect = localStorage.getItem('sessionId') === sessionId
      try {
        setSaasStatus(FIREBASE_STATUS.CONNECTING)
        await loginController(
          import.meta.env.VITE_FIREBASE_EMAIL,
          import.meta.env.VITE_FIREBASE_PASSWORD);
        await connect(sessionId);
        await publish(sessionId, "waiting")
        setSaasStatus(FIREBASE_STATUS.CONNECTED);
      } catch (e) {
        // Real collision with another controller — generate new ID
        console.warn(`Session ${sessionId} collision, generating new ID`, e)
        localStorage.removeItem('sessionId')
        setSessionId(generateSessionId())
      }
    }
    init()

    return unsubscribe
  }, [sessionId])

  async function handleScenePress(sceneId) {
    try {
      await publish(sessionId, sceneId)
      setActiveScene(sceneId)
    } catch (e) {
      console.error("failed to publish scene:", e)
      setSaasStatus(FIREBASE_STATUS.ERROR)
    }
  }

  async function handleEndSession() {
    try {
      await disconnect(sessionId)
      localStorage.removeItem('sessionId')
      setActiveScene("waiting")
      setSessionId(generateSessionId())
      setSaasStatus(null)
      navigate('/')
    } catch (e) {
      console.error("failed to disconnect from adapter:", e)
      setSaasStatus(FIREBASE_STATUS.ERROR)
    }
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <SessionPage
              sessionId={sessionId}
              headsets={headsets}
              adapterStatus={saasStatus}
            />
          }
        />
        <Route path="/tours" element={<ToursPage />} />
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
        <Route
          path="/settings"
          element={<SettingsPage onLogout={() => navigate('/login')} />}
        />
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
    </BrowserRouter>
  )
}
