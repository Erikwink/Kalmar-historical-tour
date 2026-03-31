import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { loginController, connect, onHeadsetsChange, publish, disconnect } from "../../saas-adapter/src/index"
import { FIREBASE_STATUS } from "./utils/status_maps"
import ToursPage from "./pages/Tourspage"
import SessionPage from "./pages/SessionPage"
import OverviewPage from "./pages/OverviewPage"
import DetailPage from "./pages/DetailPage"
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
    let unsubscribe = () => {}

    async function init() {
      try {
        setSaasStatus(FIREBASE_STATUS.CONNECTING)
        await loginController(
          import.meta.env.VITE_FIREBASE_EMAIL,
          import.meta.env.VITE_FIREBASE_PASSWORD)
        await connect(sessionId)
        await publish(sessionId, "waiting")
        // listen to headsets after connection to firebase
        unsubscribe = onHeadsetsChange(sessionId, setHeadsets)
        setSaasStatus(FIREBASE_STATUS.CONNECTED)
      } catch (e) {
        console.error("Failed to connect:", e)
        setSaasStatus(FIREBASE_STATUS.ERROR)
      }
    }
    init()

    return () => unsubscribe()
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
            <OverviewPage
              activeScene={activeScene}
              onScenePress={handleScenePress}
              onEndSession={handleEndSession}
              headsets={headsets}
            />
          }
        />
        <Route
          path="/detail"
          element={
            <DetailPage
              activeScene={activeScene}
              onScenePress={handleScenePress}
              headsets={headsets}
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
