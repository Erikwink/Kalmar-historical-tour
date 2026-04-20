import Modal from "./Modal";
import { MS_FILL } from "../utils/iconStyles";

/**
 * Generic confirmation modal with title, message and confirm/cancel buttons.
 * @param {{ title: string, message?: string, confirmLabel: string, cancelLabel?: string, confirmIcon?: string, onConfirm: Function, onCancel: Function }} props
 */
export default function ConfirmModal({ title, message, confirmLabel, cancelLabel = "Avbryt", confirmIcon = "check", onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel}>
      <div className="modal__header">
        <span className="modal__title">{title}</span>
      </div>
      {message && (
        <div className="modal__body">
          <p className="modal__message">{message}</p>
        </div>
      )}
      <div className="modal__footer">
        <button className="fab fab--outline" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className="fab fab--danger" onClick={onConfirm}>
          <span className="ms" style={MS_FILL}>{confirmIcon}</span>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
