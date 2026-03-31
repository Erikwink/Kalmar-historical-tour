import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tours } from "../tours";
import { HEADSET_STATUS } from "../utils/status_maps";

/**
 * Scene detail page — shows detailed controls for a specific scene.
 * @param {{ onScenePress: Function, headsets: Array }} props
 */
export default function DetailPage({ onScenePress, headsets = [] }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [selectedViews, setSelectedViews] = useState({});

  // Get tour and scene from search params
  const tourId = searchParams.get("tourId");
  const sceneId = searchParams.get("sceneId");
  
  const tour = tours.find((t) => t.id === tourId);
  const scenes = tour?.scenes ?? [];
  const scene = scenes.find((s) => s.id === sceneId);

  // Count headsets by status
  const onlineCount = headsets.filter(h => h.status === HEADSET_STATUS.ONLINE).length;
  const connectingCount = headsets.filter(h => h.status === HEADSET_STATUS.CONNECTING).length;
  const notReadyCount = headsets.filter(h => h.status === HEADSET_STATUS.NOT_READY).length;
  const offlineCount = headsets.filter(h => h.status === HEADSET_STATUS.OFFLINE).length;
  const errorCount = headsets.filter(h => h.status === HEADSET_STATUS.ERROR).length;

  // Get current scene index based on sceneId param
  const currentSceneIndex = scenes.findIndex((s) => s.id === sceneId);
  const nextScene = currentSceneIndex >= 0 && currentSceneIndex < scenes.length - 1 ? scenes[currentSceneIndex + 1] : null;

  const handleNextStop = () => {
    if (nextScene) {
      onScenePress(nextScene.id);
      navigate(`/detail?tourId=${tourId}&sceneId=${nextScene.id}`);
    }
  };

  const handleViewToggle = (viewId) => {
    setSelectedViews(prev => ({
      ...prev,
      [viewId]: !prev[viewId]
    }));
  };

  if (!scene) {
    return (
      <div className="page">
        <div className="top-app-bar">
          <button
            className="icon-btn"
            onClick={() => navigate(`/tour?tourId=${tourId}`)}
            aria-label={t("nav.back")}
          >
            <span className="ms">arrow_back</span>
          </button>
          <span className="top-app-bar__title">{t("detailPage.title", "Scene Detail")}</span>
        </div>
        <div className="page-content">
          <p>{t("common.notFound", "Not found")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="top-app-bar">
        <button
          className="icon-btn"
          onClick={() => navigate(`/tour?tourId=${tourId}`)}
          aria-label={t("nav.back")}
        >
          <span className="ms">arrow_back</span>
        </button>
        <span className="top-app-bar__title">{t("detailPage.title", "Detailed view")}</span>
      </div>

      <div className="page-content">
        {/* Tour Info */}
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

        {/* Headset Info */}
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

        {/* Active View */}
        <div className="section-header">
          <span className="section-header__title">
            {t("detailPage.activeView", "Active view")}
          </span>
        </div>
        <div className="waiting-status">
          <span className="ms">schedule</span>
          <span>{t("overviewPage.pleaseWaitForStart")}</span>
        </div>

        {/* Views Section */}
        <div className="section-header">
          <span className="section-header__title">
            {t("detailPage.views", "Views")}
          </span>
        </div>
        <div className="views-list">
          {[...Array(4)].map((_, i) => {
            const viewId = `view-${i + 1}`;
            const viewLabel = i < 2 
              ? `${t("detailPage.sound")} ${i + 1}`
              : `${t("detailPage.picture")} ${i - 1}`;
            return (
              <label key={viewId} className="view-item">
                <input
                  type="checkbox"
                  checked={selectedViews[viewId] || false}
                  onChange={() => handleViewToggle(viewId)}
                  className="view-item__checkbox"
                />
                <span className="view-item__label">{viewLabel}</span>
              </label>
            );
          })}
        </div>

        {/* Waiting Controls */}
        <div className="section-header">
          <span className="section-header__title">
            {t("overviewPage.waitingControls")}
          </span>
        </div>
        <div className="waiting-controls">
          <div className="waiting-status">
            <span className="ms">schedule</span>
            <span>{t("overviewPage.pleaseWaitForStart")}</span>
          </div>
          <div className="waiting-status">
            <span className="ms">headset_off</span>
            <span>{t("overviewPage.pleaseRemoveHeadset")}</span>
          </div>
        </div>

        {/* Next Stop Button */}
        <div className="fab-wrap">
          <button 
            className="efab"
            onClick={handleNextStop}
            disabled={!nextScene}
          >
            <span className="ms">play_arrow</span>
            <span>
              {nextScene 
                ? `${t("detailPage.nextStop")} - ${t(`scenes.${nextScene.id}`, nextScene.label)}`
                : t("detailPage.tourComplete")}
            </span>
          </button>
        </div>

        {/* Back Button */}
        <div style={{ padding: "0 16px 16px", textAlign: "center" }}>
          <button 
            className="efab efab--outline"
            onClick={() => navigate(`/tour?tourId=${tourId}`)}
          >
            {t("detailPage.backToOverview")}
          </button>
        </div>
      </div>
    </div>
  );
}
