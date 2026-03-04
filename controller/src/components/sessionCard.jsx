import QRCode from 'react-qr-code'

export default function SessionCard({ sessionId }) {
  const formatted = `${sessionId.slice(0, 3)} ${sessionId.slice(3)}`

  return (
    <div className="card card--elevated session-card">
      <div className="session-card__qr">
        <QRCode value={sessionId} size={120} bgColor="#FFFFFF" fgColor="#000000" />
      </div>
      <div className="session-card__info">
        <span className="session-card__label">Session</span>
        <span className="session-card__code">{formatted}</span>
        <span className="session-card__tagline">Scan to join this tour</span>
      </div>
    </div>
  )
}
