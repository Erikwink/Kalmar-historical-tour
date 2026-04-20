import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SceneBtn from "../components/sceneBtn";
import SceneCard from "../components/SceneCard";
import ConfirmModal from "../components/ConfirmModal";
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
export default function OverviewPage({ sessionId, activeScene, activeControls = {}, onScenePress, onControlToggle, headsets = [] }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [showEndModal, setShowEndModal] = useState(false);
  const [expandedScene, setExpandedScene] = useState(null);

  function handleSceneSelect(sceneId) {
    setExpandedScene(prev => prev === sceneId ? null : sceneId);
    if (sceneId !== activeScene) {
      onScenePress(sceneId);
    }
  }

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
          title={tour.title}
          onBack={() => navigate('/tours')}
        />

        <div className="page-content">
            
            <HeadsetStatusBar headsets={headsets} />


          {currentScene && (
            <Section title={t("overviewPage.activeScene")}>
              <ActiveSceneChip scene={currentScene} label={currentScene.label} activeControls={activeControls} />
            </Section>
          )}

          <Section title={t("overviewPage.scenesOverview")}>
            <div className="scene-card-list">
              {scenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  label={scene.label}
                  isActive={scene.id === activeScene}
                  isExpanded={expandedScene === scene.id}
                  activeControls={activeControls}
                  onSelect={handleSceneSelect}
                  onControlToggle={onControlToggle}
                />
              ))}
            </div>
          </Section>

          <Section title={t("overviewPage.waitingControls")}>
            <div className="scene-list">
              {WAITING_CONTROLS.map((scene) => (
                <SceneBtn
                  key={scene.id}
                  scene={scene}
                  label={scene.label}
                  isActive={scene.id === activeScene}
                  onClick={() => onScenePress(scene.id)}
                />
              ))}
            </div>
          </Section>
        </div>

        <Fab 
          onClick={() => setShowEndModal(true)}>
          {t("overviewPage.endTour")}
        </Fab>
      </div>

      {showEndModal && (
        <ConfirmModal
          title={t("overviewPage.endTour")}
          message={t("overviewPage.endTourMessage")}
          confirmLabel={t("overviewPage.endTour")}
          cancelLabel={t("endSessionModal.cancel")}
          confirmIcon="stop_circle"
          onConfirm={() => { setShowEndModal(false); onScenePress("remove-headset"); navigate('/'); }}
          onCancel={() => setShowEndModal(false)}
        />
      )}
    </>
  );
}
