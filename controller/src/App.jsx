import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { loginController, connect, onHeadsetsChange, publish, toggleControl, disconnect, removeHeadset } from "../../saas-adapter/src/index"
import { FIREBASE_STATUS } from "./utils/status_maps"
import ToursPage from "./pages/Tourspage"
import SessionPage from "./pages/SessionPage"
import ReadyPage from "./pages/ReadyPage"
import OverviewPage from "./pages/OverviewPage"
import DetailPage from "./pages/DetailPage"
import SettingsPage from "./pages/Settingspage"
import LoginPage from "./pages/LoginPage"
import JoinMock from "./JoinMock" // DEV: remove when real client exists
import generateSessionId from "./utils/generateSessionId"


function AppContent() {
  const navigate = useNavigate()
  const [activeScene, setActiveScene] = useState("waiting")
  const [activeControls, setActiveControls] = useState({})
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
      setActiveControls({})
    } catch (e) {
      console.error("failed to publish scene:", e)
      setSaasStatus(FIREBASE_STATUS.ERROR)
    }
  }

  async function handleControlToggle(controlId, currentValue) {
    try {
      await toggleControl(sessionId, controlId, currentValue)
      setActiveControls((prev) => {
        const next = { ...prev }
        if (currentValue) delete next[controlId]
        else next[controlId] = true
        return next
      })
    } catch (e) {
      console.error("failed to toggle control:", e)
      setSaasStatus(FIREBASE_STATUS.ERROR)
    }
  }

  async function handleRemoveHeadset(headsetId) {
    try {
      await removeHeadset(sessionId, headsetId)
    } catch (e) {
      console.error("failed to remove headset:", e)
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
          path="/tour/ready"
          element={
            <ReadyPage
              headsets={headsets}
              adapterStatus={saasStatus}
            />
          }
        />
        <Route
          path="/tour"
          element={
            <OverviewPage
              sessionId={sessionId}
              activeScene={activeScene}
              onScenePress={handleScenePress}
              onEndSession={handleEndSession}
              headsets={headsets}
            />
          }
        />
        <Route
          path="/tour/detail"
          element={
            <DetailPage
              activeScene={activeScene}
              activeControls={activeControls}
              onScenePress={handleScenePress}
              onControlToggle={handleControlToggle}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              onLogout={() => navigate('/login')}
              headsets={headsets}
              onRemoveHeadset={handleRemoveHeadset}
              adapterStatus={saasStatus}
            />
          }
        />
      </Routes>

      {/* REMOVE MOCK ONCE CLIENT IS IMPLEMENTED */}
      {/* <JoinMock sessionId={sessionId} headsets={headsets} /> */}
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
