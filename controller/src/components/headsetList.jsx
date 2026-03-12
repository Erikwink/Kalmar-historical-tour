function displayStatus(h) {
  if (h.status === 'online' && !h.ready) return 'not-ready'
  return h.status
}

export default function HeadsetList({ headsets, adapterStatus }) {
  const connectedCount = headsets.filter(h => h.status === 'online').length
  // null before first connection → default to disconnected style
  const dotClass = adapterStatus ?? 'offline'

  return (
    <div>
      <div className="section-header">
        <span className="section-header__title">Headsets</span>
        <span className="section-header__badge">{connectedCount} / {headsets.length}</span>
      </div>

      <div className="card">
      <div className="saas-row" style={{ padding: '8px 16px 8px' }}>
        <span className={`saas-dot saas-dot--${dotClass}`} />
        <span className="saas-label">Firebase</span>
        <span className="saas-status">{adapterStatus ?? '—'}</span>
      </div>

      <ul className="headset-items" style={{ padding: '0 16px' }}>
        {headsets.map(h => (
          <li key={h.id} className="headset-item">
            <div className={`headset-item__avatar headset-item__avatar--${displayStatus(h)}`}>
              <span className="ms" style={{ fontSize: '16px' }}>headset_mic</span>
            </div>
            <span className="headset-item__label">{h.label}</span>
            <span className="headset-item__status">{displayStatus(h)}</span>
          </li>
        ))}
      </ul>
    </div>
    </div>
  )
}
