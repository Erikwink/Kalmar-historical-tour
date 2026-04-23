import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { HEADSET_STATUS } from "../utils/status_maps";


const STALE_MS = 30_000

const STATUS_LABEL_KEY = {
  [HEADSET_STATUS.ONLINE]:     'overviewPage.headsetOnline',
  [HEADSET_STATUS.NOT_READY]:  'overviewPage.headsetNotReady',
  [HEADSET_STATUS.CONNECTING]: 'overviewPage.headsetConnecting',
  [HEADSET_STATUS.OFFLINE]:    'overviewPage.headsetOffline',
  [HEADSET_STATUS.ERROR]:      'overviewPage.headsetError',
}

/**
 * Maps a headset's raw status to a display status.
 * @param {{ status: string, ready: boolean }} headset
 * @returns {string} display status key
 */
function displayStatus(headset) {
  if (headset.status === HEADSET_STATUS.OFFLINE) return HEADSET_STATUS.OFFLINE;
  // -------- TODO: RM comments when heartbeat is ready on client --------------------
  //if (Date.now() - headset.lastSeenAt > STALE_MS) return HEADSET_STATUS.ERROR;
  //if (!headset.ready) return HEADSET_STATUS.NOT_READY;
  return headset.status;
}

/**
 * Renders the list of connected headsets and the Firebase connection status row.
 * @param {{ headsets: Array, adapterStatus: string|null }} props
 */
export default function HeadsetList({ headsets, title, icon }) {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, []);


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
          {headsets.map((h) => {
            const status = displayStatus(h);
            return (
              <li key={h.id} className="headset-item">
                <span className="headset-item__label">{h.label}</span>
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
