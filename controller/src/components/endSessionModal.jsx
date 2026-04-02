import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import { MS_FILL } from "../utils/iconStyles";

/**
 * Confirmation modal shown before ending the tour session.
 * @param {{ onConfirm: Function, onCancel: Function }} props
 */
export default function EndSessionModal({ onConfirm, onCancel }) {
  const { t } = useTranslation();

  return (
    <Modal onClose={onCancel}>
      <div className="modal__header">
        <span className="modal__title">{t("endSessionModal.title")}</span>
      </div>
      <div className="modal__body">
        <p className="modal__message">{t("endSessionModal.message")}</p>
      </div>
      <div className="modal__footer">
        <button className="efab efab--outline" onClick={onCancel}>
          {t("endSessionModal.cancel")}
        </button>
        <button className="efab efab--danger" onClick={onConfirm}>
          <span className="ms" style={MS_FILL}>stop_circle</span>
          {t("endSessionModal.confirm")}
        </button>
      </div>
    </Modal>
  );
}
