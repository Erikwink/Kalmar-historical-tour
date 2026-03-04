import SessionCard from '../components/sessionCard'
import HeadsetList from '../components/headsetList'
import { HEADSET_STATUS } from '../adapter-mock'

export default function SessionPage({ sessionId, headsets, adapterStatus, onStart }) {
  const connectedCount = headsets.filter(h => h.status === HEADSET_STATUS.CONNECTED).length

  return (
    <div className="page">
      <div className="top-app-bar top-app-bar--medium">
        <h1 className="top-app-bar__title">Kalmar Historical Tour</h1>
        <span className="top-app-bar__sub">Guide Controller</span>
      </div>

      <div className="page-content">
        <SessionCard sessionId={sessionId} />
        <HeadsetList headsets={headsets} adapterStatus={adapterStatus} />
      </div>

      <div className="fab-wrap">
        <button
          className="efab"
          onClick={onStart}
          disabled={connectedCount === 0}
        >
          <span className="ms" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>play_circle</span>
          Start tour
        </button>
      </div>
    </div>
  )
}
