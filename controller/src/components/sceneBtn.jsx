export default function SceneBtn({ scene, isActive, onClick }) {
  return (
    <button
      className={`scene-btn ${isActive ? 'active' : ''}`}
      style={{ '--scene-color': scene.color }}
      onClick={() => onClick(scene.id)}
    >
      <span className="scene-btn__bar" />
      <span className="scene-btn__icon-wrap">
        <span className="ms scene-btn__icon">{scene.icon}</span>
      </span>
      <span className="scene-btn__label">{scene.label}</span>
      <span className="ms scene-btn__check">check_circle</span>
    </button>
  )
}
