/**
 * A single selectable scene button with an active indicator bar and checkmark.
 * @param {{ scene: { id: string, label: string, icon: string, color: string }, label?: string, isActive: boolean, onClick: Function }} props
 */
export default function SceneBtn({ scene, label, isActive, onClick }) {
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
      <span className="scene-btn__label">{label ?? scene.label}</span>
      <span className="ms scene-btn__check">check_circle</span>
      {/* <span className="ms settings-item__arrow">chevron_right</span> */}
    </button>
  )
}
