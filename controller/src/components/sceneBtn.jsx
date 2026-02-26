export default function SceneBtn({ scene, isActive, onClick }) {

    return (
        <button
            className={`scene-btn ${isActive ? 'active' : ''}`}
            onClick={() => onClick(scene.id)}
            >
        {scene.label}
    </button>
    )
}
