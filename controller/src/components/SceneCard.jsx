const CONTROL_ICONS = {
  "360-photo":  "panorama",
  "360-video":  "panorama",
  "flat-video": "videocam",
  "audio":      "music_note",
  "narration":  "record_voice_over",
};

export default function SceneCard({ scene, label, isActive, isExpanded, activeControls = {}, onSelect, onControlToggle }) {
  return (
    <div
      className={`scene-card ${isActive ? "scene-card--active" : ""}`}
      style={{ "--scene-color": scene.color }}
    >
      <button className="scene-card__header" onClick={() => onSelect(scene.id)}>
        <div className="scene-card__backdrop">
          {scene.image
            ? <img src={scene.image} alt={label} className="scene-card__img" />
            : <span className="ms scene-card__icon" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>{scene.icon}</span>
          }
          <div className="scene-card__footer">
            <span className="scene-card__label">{label}</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="scene-card__controls">
          {(scene.controls ?? []).map((control) => {
            const isOn = !!activeControls[control.id];
            return (
              <button
                key={control.id}
                className={`scene-card__control ${isOn ? "scene-card__control--on" : ""}`}
                onClick={() => onControlToggle(control.id, isOn)}
              >
                <span className="ms scene-card__control-icon">
                  {CONTROL_ICONS[control.type] ?? "play_arrow"}
                </span>
                <span className="scene-card__control-label">
                  {control.label}
                </span>
                <span className="ms scene-card__control-toggle">
                  {isOn ? "stop" : "play_arrow"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
