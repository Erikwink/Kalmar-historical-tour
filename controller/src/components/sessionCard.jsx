import QRCode from 'react-qr-code'
import { useTranslation } from 'react-i18next'

/**
 * Displays the session ID and a QR code for headsets to scan and join.
 * @param {{ sessionId: string }} props
 */
export default function SessionCard({ sessionId }) {
  const { t } = useTranslation()
  // Format "123456" as "123 456" for readability
  // Format "123456" as "123 456" for readability
  const formatted = `${sessionId.slice(0, 3)} ${sessionId.slice(3)}`

  return (
    <div className="card card--elevated session-card">
      <div className="session-card__qr">
        <QRCode value={sessionId} size={120} bgColor="#FFFFFF" fgColor="#000000" />
      </div>
      <div className="session-card__info">
        <span className="session-card__label">{t('sessionCard.label')}</span>
        <span className="session-card__code">{formatted}</span>
        <span className="session-card__tagline">{t('sessionCard.tagline')}</span>
      </div>
    </div>
  )
}
