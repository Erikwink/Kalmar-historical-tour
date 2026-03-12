import HeadsetList from '../components/headsetList'
import SceneBtn from '../components/sceneBtn'
import { scenes } from '../scenes'

export default function MainPage({ headsets, adapterStatus, activeScene, onScenePress, onBack }) {
  const active = scenes.find(s => s.id === activeScene)

  return (
    <div className="page">
      <div className="top-app-bar">
        <button className="icon-btn" onClick={onBack} aria-label="Tillbaka">
          <span className="ms">arrow_back</span>
        </button>
        <span className="top-app-bar__title">Tour Control</span>
      </div>

      <div className="page-content">
        {active && (
          <>
            <div className="section-header">
              <span className="section-header__title">Active Scene</span>
            </div>
            <div
              className="active-scene-chip"
              style={{ '--scene-color': active.color }}
            >
              <span
                className="ms"
                style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >{active.icon}</span>
              {active.label}
            </div>
          </>
        )}

        <HeadsetList headsets={headsets} adapterStatus={adapterStatus} />

        <div className="section-header">
          <span className="section-header__title">Scenes</span>
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
    </div>
  )
}
