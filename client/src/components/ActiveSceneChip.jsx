/**
 * Displays the current active scene as a full-width chip.
 */
export default function ActiveSceneChip({ label, color = "#4FD8EB" }) {
  return (
    <div className="active-scene-chip" style={{ "--scene-color": color }}>
      <span className="active-scene-chip__dot" />
      <span>{label}</span>
    </div>
  );
}
