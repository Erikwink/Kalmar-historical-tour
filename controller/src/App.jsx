import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { loginController, connect, onHeadsetsChange, publish, toggleControl, disconnect, removeHeadset } from "../../saas-adapter/src/index"
import { FIREBASE_STATUS } from "./utils/status_maps"
import ToursPage from "./pages/Tourspage"
import SessionPage from "./pages/SessionPage"
import OverviewPage from "./pages/OverviewPage"
import SettingsPage from "./pages/Settingspage"
import LoginPage from "./pages/LoginPage"
import generateSessionId from "./utils/generateSessionId"
import { SCENE_WAITING } from "../../tours/index"


/** Root component — manages Firebase lifecycle, session state, and renders all routes. */
function AppContent() {
  const navigate = useNavigate()
  const [activeScene, setActiveScene] = useState(SCENE_WAITING)
  const [activeControls, setActiveControls] = useState({})
  const [saasStatus, setSaasStatus] = useState(null)
  const [headsets, setHeadsets] = useState([])
  const [sessionId, setSessionId] = useState(generateSessionId)


  // Connects to Firebase on mount and re-connects whenever sessionId changes (new session)
  useEffect(() => {
    let unsubscribe = () => {}

    async function init() {
      try {
        setSaasStatus(FIREBASE_STATUS.CONNECTING)
        await loginController(
          import.meta.env.VITE_FIREBASE_EMAIL,
          import.meta.env.VITE_FIREBASE_PASSWORD)
        await connect(sessionId)
        await publish(sessionId, SCENE_WAITING)
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

  /** Publishes a new active scene to Firebase and resets controls.
   * @param {string} sceneId
   */
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

  /** Toggles a control on or off in Firebase and mirrors the change locally.
   * @param {string} controlId
   * @param {boolean} currentValue
   */
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

  /** Removes a headset from the current session in Firebase.
   * @param {string} headsetId
   */
  async function handleRemoveHeadset(headsetId) {
    try {
      await removeHeadset(sessionId, headsetId)
    } catch (e) {
      console.error("failed to remove headset:", e)
    }
  }

  /** Disconnects Firebase, clears localStorage and resets state to start a new session. */
  async function handleEndSession() {
    try {
      await disconnect(sessionId)
      localStorage.removeItem('sessionId')
      setActiveScene(SCENE_WAITING)
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
              sessionId={sessionId}
              activeScene={activeScene}
              activeControls={activeControls}
              onScenePress={handleScenePress}
              onControlToggle={handleControlToggle}
              headsets={headsets}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              onLogout={() => navigate('/login')}
              onEndSession={handleEndSession}
              headsets={headsets}
              onRemoveHeadset={handleRemoveHeadset}
              adapterStatus={saasStatus}
            />
          }
        />
      </Routes>
    </>
  )
}

/** App root — wraps AppContent in BrowserRouter. */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
