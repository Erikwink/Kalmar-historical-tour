import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SceneBtn from "../components/sceneBtn";
import EndSessionModal from "../components/endSessionModal";
import HeadsetSummary from "../components/HeadsetSummary";
import TopAppBar from "../components/TopAppBar";
import ActiveSceneChip from "../components/ActiveSceneChip";
import Section from "../components/Section";
import Fab from "../components/Fab";
import { tours, WAITING_CONTROLS } from "../../../tours/index";
import { setTourId } from "../../../saas-adapter/src/index";

/**
 * Active tour control page — lets the guide select which scene headsets should display.
 * @param {{ sessionId: string, activeScene: string, onScenePress: Function, onEndSession: Function, headsets: Array }} props
 */
export default function OverviewPage({ sessionId, activeScene, onScenePress, onEndSession, headsets = [] }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [showEndModal, setShowEndModal] = useState(false);

  const tourId = searchParams.get("tourId");

  useEffect(() => {
    if (sessionId && tourId) {
      setTourId(sessionId, tourId);
    }
  }, [sessionId, tourId]);

  const tour = tours.find((t) => t.id === tourId);
  const scenes = tour?.scenes ?? [];
  const active = [...scenes, ...WAITING_CONTROLS].find((s) => s.id === activeScene);

  return (
    <>
      <div className="page">
        <TopAppBar
          title={tour ? t(`tours.${tour.id}.title`) : "Tour"}
          onBack={() => navigate('/tours')}
        />

        <div className="page-content">
          <div className="card tour-summary">
            <div className="tour-summary__meta">
              <span>{scenes.length} {t("overviewPage.stops")}</span>
              {tour?.durationMinutes && (
                <span> · {tour.durationMinutes >= 60
                  ? `${Math.floor(tour.durationMinutes / 60)}h${tour.durationMinutes % 60 ? ` ${tour.durationMinutes % 60}min` : ""}`
                  : `${tour.durationMinutes}min`}
                </span>
              )}
            </div>
            <hr className="tour-summary__divider" />
            <div className="headset-info__meta">
              <HeadsetSummary headsets={headsets} />
            </div>
          </div>

          {active && (
            <Section title={t("overviewPage.activeScene")}>
              <ActiveSceneChip scene={active} label={t(`scenes.${active.id}`, active.label)} />
            </Section>
          )}

          <Section title={t("overviewPage.scenes")}>
            <div className="card scene-list">
              {scenes.map((scene) => (
                <SceneBtn
                  key={scene.id}
                  scene={scene}
                  label={t(`scenes.${scene.id}`, scene.label)}
                  isActive={scene.id === activeScene}
                  onClick={() => navigate(`/tour/detail?tourId=${tourId}&sceneId=${scene.id}`)}
                />
              ))}
            </div>
          </Section>

          <Section title={t("overviewPage.waitingControls")}>
            <div className="card scene-list">
              {WAITING_CONTROLS.map((scene) => (
                <SceneBtn
                  key={scene.id}
                  scene={scene}
                  label={t(`scenes.${scene.id}`, scene.label)}
                  isActive={scene.id === activeScene}
                  onClick={() => onScenePress(scene.id)}
                />
              ))}
            </div>
          </Section>
        </div>

        <Fab icon="stop_circle" variant="danger" onClick={() => setShowEndModal(true)}>
          {t("overviewPage.endTour")}
        </Fab>
      </div>

      {showEndModal && (
        <EndSessionModal
          onConfirm={() => { setShowEndModal(false); onEndSession(); }}
          onCancel={() => setShowEndModal(false)}
        />
      )}
    </>
  );
}
