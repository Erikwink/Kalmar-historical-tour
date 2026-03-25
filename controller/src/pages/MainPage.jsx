import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SceneBtn from "../components/sceneBtn";
import EndSessionModal from "../components/endSessionModal";
import { tours } from "../tours";

/**
 * Active tour control page — lets the guide select which scene headsets should display.
 * @param {{ activeScene: string, onScenePress: Function, onEndSession: Function }} props
 */
export default function MainPage({ activeScene, onScenePress, onEndSession }) {
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

  return (
    <>
      <div className="page">
        <div className="top-app-bar">
          <button
            className="icon-btn"
            onClick={() => navigate(`/session?tourId=${tourId}`)}
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
          {active && (
            <>
              <div className="section-header">
                <span className="section-header__title">
                  {t("mainPage.activeScene")}
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
              {t("mainPage.scenes")}
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
            {t("mainPage.endTour")}
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
