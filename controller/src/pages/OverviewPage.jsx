import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SceneBtn from "../components/sceneBtn";
import EndSessionModal from "../components/endSessionModal";
import HeadsetStatusBar from "../components/HeadsetStatusBar";
import TopAppBar from "../components/TopAppBar";
import ActiveSceneChip from "../components/ActiveSceneChip";
import Section from "../components/Section";
import Fab from "../components/Fab";
import { tours, WAITING_CONTROLS } from "../../../tours/index";
import { setTourId } from "../../../saas-adapter/src/index";
import TourSummaryCard from './../components/TourSummaryCard';

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

  // Write tourId to Firebase once so the client knows which tour is running
  useEffect(() => {
    if (sessionId && tourId) {
      setTourId(sessionId, tourId);
    }
  }, [sessionId, tourId]);

  const tour = tours.find((tour) => tour.id === tourId);
  const scenes = tour?.scenes ?? [];
  // Search both scenes and waiting controls to find the currently active one
  const currentScene = [...scenes, ...WAITING_CONTROLS].find((scene) => scene.id === activeScene);

  return (
    <>
      <div className="page">
        <TopAppBar
          title={t(`tours.${tour.id}.title`)}
          onBack={() => navigate(`/tour/ready?tourId=${tourId}`)}
        />

        <div className="page-content">
            <TourSummaryCard 
              tour={tour} 
              scenes={scenes} 
            />
            
            <HeadsetStatusBar headsets={headsets} />


          {currentScene && (
            <Section title={t("overviewPage.activeScene")}>
              <ActiveSceneChip scene={currentScene} label={t(`scenes.${currentScene.id}`, currentScene.label)} />
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
