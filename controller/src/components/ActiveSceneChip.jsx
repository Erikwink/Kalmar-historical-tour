import { MS_FILL_SM } from "../utils/iconStyles";

const CONTROL_ICONS = {
  "360-photo":  "panorama",
  "360-video":  "panorama",
  "flat-video": "videocam",
  "audio":      "music_note",
  "narration":  "record_voice_over",
};

/**
 * Displays the currently active scene and its active controls.
 * @param {{ scene: { icon: string, color: string, controls?: Array }, label: string, activeControls?: Object }} props
 */
export default function ActiveSceneChip({ scene, label, activeControls = {} }) {
  const activeControlList = (scene.controls ?? []).filter(c => activeControls[c.id]);

  return (
    <div className="active-scene-chip" style={{ "--scene-color": scene.color }}>
      <span className="ms active-scene-chip-ms" style={MS_FILL_SM}>{scene.icon}</span>
      <span className="active-scene-chip__label">{label}</span>
      {activeControlList.length > 0 && (
        <div className="active-scene-chip__controls">
          {activeControlList.map(control => (
            <span key={control.id} className="active-scene-chip__control-icon ms" style={MS_FILL_SM}>
              {CONTROL_ICONS[control.type] ?? "play_arrow"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
