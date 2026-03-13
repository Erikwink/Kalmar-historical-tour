import QRCode from 'react-qr-code'
import { useTranslation } from 'react-i18next'

/**
 * Modal overlay showing a QR code for the current session.
 * Closes when clicking the backdrop or the close button.
 * @param {{ sessionId: string, onClose: Function }} props
 */
export default function QRModal({ sessionId, onClose }) {
  const { t } = useTranslation()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">{t('qrModal.title')}</span>
          <button className="icon-btn" onClick={onClose} aria-label={t('qrModal.close')}>
            <span className="ms">close</span>
          </button>
        </div>
        <div className="modal__body">
          <div className="modal__qr">
            <QRCode value={sessionId} size={200} />
          </div>
          <p className="modal__hint">{t('qrModal.hint')} <strong>{sessionId}</strong></p>
        </div>
      </div>
    </div>
  )
}
