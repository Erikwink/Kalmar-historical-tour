export default function StatusBar({ activeScene }) {
  return (
    <div className="status-bar">
      <span className="status-bar__label">Aktiv scen</span>
      {activeScene && (
        <span
          className="status-bar__scene"
          style={{ "--scene-color": activeScene.color }}
        >
          {activeScene.label}
        </span>
      )}
    </div>
  );
}
