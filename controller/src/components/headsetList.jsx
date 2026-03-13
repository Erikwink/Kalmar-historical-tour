import { useTranslation } from 'react-i18next'

/**
 * Maps a headset's raw status to a display status.
 * A headset that is online but not yet ready gets a distinct 'not-ready' style.
 * @param {{ status: string, ready: boolean }} h
 * @returns {string} display status key
 */
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { HEADSET_STATUS } from '../utils/status_maps'


const STALE_MS = 30_000


/**
 * Maps a headset's raw status to a display status.
 * A headset that is online but not yet ready gets a distinct 'not-ready' style.
 * @param {{ status: string, ready: boolean }} headset
 * @returns {string} display status key
 */
function displayStatus(headset) {
  // check headset status
  if (headset.status === HEADSET_STATUS.OFFLINE) { 
    return HEADSET_STATUS.OFFLINE }
  // check headset heartbeat status
  
  // -------- TODO: RM comments when heartbeat is ready on client --------------------

  
  //if (Date.now() - headset.lastSeenAt > STALE_MS){ 
  //  return HEADSET_STATUS.ERROR;}
  // check if headset is ready
  if (!headset.ready) {
    return HEADSET_STATUS.NOT_READY}
  return headset.status
}

/**
 * Renders the list of connected headsets and the Firebase connection status row.
 * @param {{ headsets: Array, adapterStatus: string|null }} props
 */
export default function HeadsetList({ headsets, adapterStatus }) {
  const { t } = useTranslation()
  const connectedCount = headsets.filter(h => h.status === 'online').length
  // null before first connection → default to disconnected style
  const dotClass = adapterStatus ?? 'offline'

  return (
    <div>
      <div className="section-header">
        <span className="section-header__title">{t('headsetList.title')}</span>
        <span className="section-header__badge">{connectedCount} / {headsets.length}</span>
        <span className="ms" style={{ fontSize: '20px', color: 'var(--md-on-surface-variant)' }}>dashboard</span>
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
