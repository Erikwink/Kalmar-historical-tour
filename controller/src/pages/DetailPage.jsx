import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TopAppBar from "../components/TopAppBar";
import ActiveSceneChip from "../components/ActiveSceneChip";
import Section from "../components/Section";
import Fab from "../components/Fab";
import { tours } from "../../../tours/index";

const CONTROL_ICONS = {
  "360-photo":  "panorama",
  "360-video":  "panorama",
  "flat-video": "videocam",
  "audio":      "volume_up",
  "narration":  "record_voice_over",
};

/**
 * Detailed scene view — lets the guide toggle individual controls within a scene.
 * @param {{ activeScene: string, activeControls: Object, onScenePress: Function, onControlToggle: Function }} props
 */
export default function DetailPage({ activeScene, activeControls, onScenePress, onControlToggle }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const tourId = searchParams.get("tourId");
  const sceneId = searchParams.get("sceneId");

  const tour = tours.find((t) => t.id === tourId);
  const scenes = tour?.scenes ?? [];
  const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
  const scene = scenes[sceneIndex];
  const nextScene = scenes[sceneIndex + 1] ?? null;

  useEffect(() => {
    if (sceneId && sceneId !== activeScene) {
      onScenePress(sceneId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  if (!scene) {
    return (
      <div className="page">
        <TopAppBar title={t("detailPage.sceneNotFound", "Scen hittades inte")} onBack={() => navigate(-1)} />
      </div>
    );
  }

  return (
    <div className="page">
      <TopAppBar
        title={t(`scenes.${scene.id}`, scene.label)}
        onBack={() => navigate(`/tour?tourId=${tourId}`)}
      />

      <div className="page-content">
        <ActiveSceneChip scene={scene} label={t(`scenes.${scene.id}`, scene.label)} />

        <Section title={t("detailPage.controls", "Kontroller")}>
          <div className="card scene-list">
            {scene.controls.map((control) => {
              const isActive = !!activeControls[control.id];
              return (
                <button
                  key={control.id}
                  className={`scene-btn ${isActive ? "active" : ""}`}
                  style={{ "--scene-color": scene.color }}
                  onClick={() => onControlToggle(control.id, isActive)}
                >
                  <span className="scene-btn__bar" />
                  <span className="scene-btn__icon-wrap">
                    <span className="ms scene-btn__icon">
                      {CONTROL_ICONS[control.type] ?? "play_arrow"}
                    </span>
                  </span>
                  <span className="scene-btn__label">
                    {t(`controls.${control.id}`, control.label)}
                  </span>
                  <span className="ms scene-btn__check">check_circle</span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      <Fab
        icon="arrow_forward"
        disabled={!nextScene}
        onClick={() => {
          onScenePress(nextScene.id);
          navigate(`/tour/detail?tourId=${tourId}&sceneId=${nextScene.id}`);
        }}
      >
        {nextScene ? t(`scenes.${nextScene.id}`, nextScene.label) : t("detailPage.lastScene")}
      </Fab>
    </div>
  );
}
