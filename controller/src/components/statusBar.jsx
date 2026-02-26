const STATUS_LABEL = {
  connected:  'Ansluten',
  connecting: 'Ansluter...',
  error:      'Anslutningsfel',
}

export default function StatusBar({status, activeScene}) {
    return (
        <div className="status-bar">
            <span className={`status-bar__dot status-bar__dot--${status}`} />
            <span className="status-bar__text">{STATUS_LABEL[status]}</span>
            {activeScene && (
                <span className="status-bar__scene">
                {activeScene.label}
                </span>
            )}
        </div>
    )
}