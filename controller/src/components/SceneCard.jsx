import { CONTROL_ICONS } from "../utils/status_maps";
import { MS_FILL } from "../utils/iconStyles";

/**
 * Expandable card for a scene — shows thumbnail/icon and toggleable controls when expanded.
 * @param {{ scene: object, label: string, isActive: boolean, isExpanded: boolean, activeControls: Object, onSelect: Function, onControlToggle: Function }} props
 */
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
            : <span className="ms scene-card__icon" style={MS_FILL}>{scene.icon}</span>
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
