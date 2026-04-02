import { MS_FILL_SM } from "../utils/iconStyles";

/**
 * Displays the currently active scene as a full-width colored chip.
 * @param {{ scene: { icon: string, color: string }, label: string }} props
 */
export default function ActiveSceneChip({ scene, label }) {
  return (
    <div className="active-scene-chip" style={{ "--scene-color": scene.color }}>
      <span className="ms" style={MS_FILL_SM}>{scene.icon}</span>
      {label}
    </div>
  );
}
