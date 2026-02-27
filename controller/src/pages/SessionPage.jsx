import SessionCard from '../components/sessionCard'
import HeadsetList from '../components/headsetList'
import { HEADSET_STATUS } from '../adapter-mock'

export default function SessionPage({ 
  sessionId, 
  headsets, 
  adapterStatus, 
  onStart }) {

  // track number of headsets connected
  // cant start session with 0 headsets
  const connectedCount = headsets.filter(h => h.status === HEADSET_STATUS.CONNECTED).length

  return (
    <div className="page session-page">
      <h1>Kalmar Historical Tour</h1>

      <SessionCard 
        sessionId={sessionId} 
      />

      <HeadsetList 
        headsets={headsets} 
        adapterStatus={adapterStatus} 
      />

      <button
        className="start-btn"
        onClick={onStart}
        disabled={connectedCount === 0}
      >Start tour
      </button>
    </div>
  )
}
