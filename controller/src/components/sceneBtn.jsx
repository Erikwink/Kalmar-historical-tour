export default function SceneBtn({ scene, isActive, onClick }) {

    return (
        <button
            className={`scene-btn ${isActive ? 'active' : ''}`}
            style={{ '--scene-color': scene.color }}
            onClick={() => onClick(scene.id)}
            >
        {scene.label}
    </button>
    )
}
