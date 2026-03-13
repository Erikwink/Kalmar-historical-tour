import QRCode from 'react-qr-code'

/**
 * Modal overlay showing a QR code for the current session.
 * Closes when clicking the backdrop or the close button.
 * @param {{ sessionId: string, onClose: Function }} props
 */
export default function QRModal({ sessionId, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">QR-kod</span>
          <button className="icon-btn" onClick={onClose} aria-label="Stäng">
            <span className="ms">close</span>
          </button>
        </div>
        <div className="modal__body">
          <div className="modal__qr">
            <QRCode value={sessionId} size={200} />
          </div>
          <p className="modal__hint">Skanna för att ansluta till session <strong>{sessionId}</strong></p>
        </div>
      </div>
    </div>
  )
}
