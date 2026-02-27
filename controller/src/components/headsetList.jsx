// const HEADSET_STATUS_LABEL = {
//   connected:    'Ansluten',
//   connecting:   'Ansluter...',
//   error:        'Fel',
//   disconnected: 'Frånkopplad',
// }

export default function HeadsetList({ headsets, adapterStatus }) {
  return (
    <div className="headset-list">
      <span className="headset-list__adapter-status">
        Saas: {adapterStatus}
      </span>
      <ul className="headset-items">
        {headsets.map(h => (
          <li key={h.id} className="headset-item">
            <span className={`headset-item__dot headset-item__dot--${h.status}`} />
            <span className="headset-item__label">{h.label}</span>
            <span className="headset-item__status">{h.status}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
