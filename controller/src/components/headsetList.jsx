import { useTranslation } from "react-i18next";
import { HEADSET_STATUS, resolveStatus } from "../utils/status_maps";
import { STATUS_LABEL_KEY } from "../utils/status_maps";


/**
 * Renders the list of connected headsets and the Firebase connection status row.
 * @param {{ headsets: Array, adapterStatus: string|null }} props
 */
export default function HeadsetList({ headsets, title, icon }) {
  const { t } = useTranslation();



  return (
    <div className="headset-list">
      {title && (
        <div className="headset-list__header">
          <span className="headset-list__title">{title}</span>
          {icon && <span className="ms headset-list__icon">{icon}</span>}
        </div>
      )}

      <div className="card">
        <ul className="headset-items" style={{ padding: "0 16px" }}>
          {headsets.map((headset) => {
            const status = resolveStatus(headset);
            return (
              <li key={headset.id} className="headset-item">
                <span className="headset-item__label">{headset.label}</span>
                <span className="headset-item__status">
                  {t(STATUS_LABEL_KEY[status] ?? STATUS_LABEL_KEY[HEADSET_STATUS.ONLINE])}
                  <span className={`headset-item__dot headset-item__dot--${status}`} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
