import { useNavigate, useLocation } from 'react-router-dom'
import SceneBtn from '../components/sceneBtn'

/**
 * Active tour control page — lets the guide select which scene headsets should display.
 * @param {{ activeScene: string, onScenePress: Function }} props
 */
export default function MainPage({ activeScene, onScenePress }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const tour = state?.tour  // passed from SessionPage via router state

  // Fall back to empty array if tour state is missing (e.g. direct URL navigation)
  const scenes = tour?.scenes ?? []
  const active = scenes.find(s => s.id === activeScene)

  return (
    <div className="page">
      <div className="top-app-bar">
        <button className="icon-btn" onClick={() => navigate('/session')} aria-label="Tillbaka">
          <span className="ms">arrow_back</span>
        </button>
        <span className="top-app-bar__title">{tour?.title ?? 'Tour'}</span>
        
        <button
          className="icon-btn"
          onClick={() => navigate('/settings')}
          aria-label="Inställningar"
        >
          <span className="ms">settings</span>
        </button>
      </div>

      <div className="page-content">
        {active && (
          <>
            <div className="section-header">
              <span className="section-header__title">Aktiv scen</span>
            </div>
            <div
              className="active-scene-chip"
              style={{ '--scene-color': active.color }}
            >
              <span
                className="ms"
                style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                {active.icon}
              </span>
              {active.label}
            </div>
          </>
        )}

        <div className="section-header">
          <span className="section-header__title">Scener</span>
        </div>
        <div className="card scene-list">
          {scenes.map(scene => (
            <SceneBtn
              key={scene.id}
              scene={scene}
              isActive={scene.id === activeScene}
              onClick={() => onScenePress(scene.id)}
            />
          ))}
        </div>
      </div>

      <div className="fab-wrap">
        <button
          className="efab efab--danger"
          onClick={() => navigate('/')}
        >
          <span className="ms" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
            stop_circle
          </span>
          Avsluta tour
        </button>
      </div>
    </div>
  )
}
