import QRCode from 'react-qr-code'

export default function SessionCard({ sessionId }) {
  const formatted = `${sessionId.slice(0, 3)} ${sessionId.slice(3)}`

  return (
    <div className="session-card">
      <div className="session-card__qr">
        <QRCode value={sessionId} size={140} bgColor="transparent" fgColor="#f0f0f0" />
      </div>
      <div className="session-card__info">
        <span className="session-card__label">Session</span>
        <span className="session-card__code">{formatted}</span>
      </div>
    </div>
  )
}
