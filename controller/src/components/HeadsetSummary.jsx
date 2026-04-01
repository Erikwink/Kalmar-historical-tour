import { useTranslation } from "react-i18next";
import { HEADSET_STATUS } from "../utils/status_maps";

const STATUS_CONFIG = [
  { status: HEADSET_STATUS.ONLINE,     icon: "headset",   tKey: "overviewPage.headsetOnline",     className: "headset-info__item--online" },
  { status: HEADSET_STATUS.CONNECTING, icon: "sync",      tKey: "overviewPage.headsetConnecting", className: "headset-info__item--connecting" },
  { status: HEADSET_STATUS.NOT_READY,  icon: "schedule",  tKey: "overviewPage.headsetNotReady",   className: "headset-info__item--not-ready" },
  { status: HEADSET_STATUS.OFFLINE,    icon: "cloud_off", tKey: "overviewPage.headsetOffline",    className: "headset-info__item--offline" },
  { status: HEADSET_STATUS.ERROR,      icon: "warning",   tKey: "overviewPage.headsetError",      className: "headset-info__item--error" },
];

export default function HeadsetSummary({ headsets = [] }) {
  const { t } = useTranslation();

  if (headsets.length === 0) {
    return (
      <div className="headset-info__item">
        <span className="ms">info</span>
        <span>{t("overviewPage.noHeadsets")}</span>
      </div>
    );
  }

  const counts = headsets.reduce((acc, h) => {
    acc[h.status] = (acc[h.status] ?? 0) + 1;
    return acc;
  }, {});

  return STATUS_CONFIG
    .filter(({ status }) => counts[status] > 0)
    .map(({ status, icon, tKey, className }) => (
      <div key={status} className={`headset-info__item ${className}`}>
        <span className="ms">{icon}</span>
        <span>{counts[status]} {t(tKey)}</span>
      </div>
    ));
}
