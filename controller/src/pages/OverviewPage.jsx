import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SceneBtn from "../components/sceneBtn";
import EndSessionModal from "../components/endSessionModal";
import { tours } from "../tours";
import { HEADSET_STATUS } from "../utils/status_maps";

/**
 * Active tour control page — lets the guide select which scene headsets should display.
 * @param {{ activeScene: string, onScenePress: Function, onEndSession: Function, headsets: Array }} props
 */
export default function OverviewPage({ activeScene, onScenePress, onEndSession, headsets = [] }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [showEndModal, setShowEndModal] = useState(false);

  // get tour from serchParam
  const tourId = searchParams.get("tourId");
  // lookup the tour in tours.js
  const tour = tours.find((t) => t.id === tourId);
  // get the scenes from tours, empty array as fallback
  const scenes = tour?.scenes ?? [];
  // find active scene to display
  const active = scenes.find((s) => s.id === activeScene);

  // Count headsets by status
  const onlineCount = headsets.filter(h => h.status === HEADSET_STATUS.ONLINE).length;
  const connectingCount = headsets.filter(h => h.status === HEADSET_STATUS.CONNECTING).length;
  const notReadyCount = headsets.filter(h => h.status === HEADSET_STATUS.NOT_READY).length;
  const offlineCount = headsets.filter(h => h.status === HEADSET_STATUS.OFFLINE).length;
  const errorCount = headsets.filter(h => h.status === HEADSET_STATUS.ERROR).length;

  return (
    <>
      <div className="page">
        <div className="top-app-bar">
          <button
            className="icon-btn"
            onClick={() => navigate('/tours')}
            aria-label={t("nav.back")}
          >
            <span className="ms">arrow_back</span>
          </button>
          <span className="top-app-bar__title">
            {tour ? t(`tours.${tour.id}.title`) : "Tour"}
          </span>

          <button
            className="icon-btn"
            onClick={() => navigate("/settings")}
            aria-label={t("nav.settings")}
          >
            <span className="ms">settings</span>
          </button>
        </div>

        <div className="page-content">
          <div className="tour-info-card card">
            <div className="tour-info-card__header">
              <span className="tour-info-card__title">
                {tour ? t(`tours.${tour.id}.title`) : "Tour"}
              </span>
            </div>
            <div className="tour-info-card__meta">
              <span>{scenes.length} {t("overviewPage.stops")}</span>
            </div>
          </div>

          <div className="headset-section">
            <div className="headset-info card">
              <div className="headset-info__header">
                <span className="headset-info__title">
                  {t("overviewPage.headsetInfo")}
                </span>
              </div>
              <div className="headset-info__meta">
                {onlineCount > 0 && (
                  <div className="headset-info__item headset-info__item--online">
                    <span className="ms">headset</span>
                    <span>{onlineCount} {t("overviewPage.headsetOnline")}</span>
                  </div>
                )}
                {connectingCount > 0 && (
                  <div className="headset-info__item headset-info__item--connecting">
                    <span className="ms">sync</span>
                    <span>{connectingCount} {t("overviewPage.headsetConnecting")}</span>
                  </div>
                )}
                {notReadyCount > 0 && (
                  <div className="headset-info__item headset-info__item--not-ready">
                    <span className="ms">schedule</span>
                    <span>{notReadyCount} {t("overviewPage.headsetNotReady")}</span>
                  </div>
                )}
                {offlineCount > 0 && (
                  <div className="headset-info__item headset-info__item--offline">
                    <span className="ms">cloud_off</span>
                    <span>{offlineCount} {t("overviewPage.headsetOffline")}</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="headset-info__item headset-info__item--error">
                    <span className="ms">warning</span>
                    <span>{errorCount} {t("overviewPage.headsetError")}</span>
                  </div>
                )}
                {headsets.length === 0 && (
                  <div className="headset-info__item">
                    <span className="ms">info</span>
                    <span>{t("overviewPage.noHeadsets")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {active && (
            <>
              <div className="section-header">
                <span className="section-header__title">
                  {t("overviewPage.activeScene")}
                </span>
              </div>
              <div
                className="active-scene-chip"
                style={{ "--scene-color": active.color }}
              >
                <span
                  className="ms"
                  style={{
                    fontSize: "16px",
                    fontVariationSettings:
                      "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                  }}
                >
                  {active.icon}
                </span>
                {t(`scenes.${active.id}`, active.label)}
              </div>
            </>
          )}

          <div className="section-header">
            <span className="section-header__title">
              {t("overviewPage.scenes")}
            </span>
          </div>
          <div className="card scene-list">
            {scenes.map((scene) => (
              <SceneBtn
                key={scene.id}
                scene={scene}
                label={t(`scenes.${scene.id}`, scene.label)}
                isActive={scene.id === activeScene}
                onClick={() => onScenePress(scene.id)}
              />
            ))}
          </div>

          <div className="section-header">
            <span className="section-header__title">
              {t("overviewPage.waitingControls")}
            </span>
          </div>
          <div className="card waiting-controls">
            <div className="waiting-status">
              <span className="ms" style={{ color: "var(--md-sys-color-primary)" }}>
                hourglass_empty
              </span>
              <span>{t("overviewPage.pleaseWaitForStart")}</span>
            </div>
            <div className="waiting-status">
              <span className="ms">headset_off</span>
              <span>{t("overviewPage.pleaseRemoveHeadset")}</span>
            </div>
          </div>
        </div>

        <div className="fab-wrap">
          <button
            className="efab efab--danger"
            onClick={() => setShowEndModal(true)}
          >
            <span
              className="ms"
              style={{
                fontVariationSettings:
                  "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              stop_circle
            </span>
            {t("overviewPage.endTour")}
          </button>
        </div>
      </div>

      {showEndModal && (
        <EndSessionModal
          onConfirm={() => {
            setShowEndModal(false);
            onEndSession();
          }}
          onCancel={() => setShowEndModal(false)}
        />
      )}
    </>
  );
}
