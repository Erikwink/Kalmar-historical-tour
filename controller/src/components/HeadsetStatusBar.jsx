import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HEADSET_STATUS } from '../utils/status_maps'

const PROBLEM_STATUSES = [
  HEADSET_STATUS.NOT_READY,
  HEADSET_STATUS.CONNECTING,
  HEADSET_STATUS.OFFLINE,
  HEADSET_STATUS.ERROR,
]

const STATUS_LABEL_KEY = {
  [HEADSET_STATUS.ONLINE]:     'overviewPage.headsetOnline',
  [HEADSET_STATUS.NOT_READY]:  'overviewPage.headsetNotReady',
  [HEADSET_STATUS.CONNECTING]: 'overviewPage.headsetConnecting',
  [HEADSET_STATUS.OFFLINE]:    'overviewPage.headsetOffline',
  [HEADSET_STATUS.ERROR]:      'overviewPage.headsetError',
}

function resolveStatus(h) {
  if (h.status === HEADSET_STATUS.OFFLINE) return HEADSET_STATUS.OFFLINE
  //if (!h.ready) return HEADSET_STATUS.NOT_READY
  return h.status
}

/**
 * Compact headset status bar — always visible, expands on click if there are issues.
 * @param {{ headsets: Array }} props
 */
export default function HeadsetStatusBar({ headsets = [] }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  // calculate total headsets and if online or not
  const total = headsets.length
  const onlineCount = headsets.filter(
    headset => headset.status === HEADSET_STATUS.ONLINE).length
  const problematic = headsets.filter(
    headset => PROBLEM_STATUSES.includes(resolveStatus(headset)))
  // Boolean to controll dropdown  
  const hasIssues = problematic.length > 0
  const variant = hasIssues ? 'warning' : 'ok'

  return (
    <div className="card headset-status-bar-wrapper">
      <button
        className={`headset-status-bar headset-status-bar--${variant}`}
        onClick={() => hasIssues && setExpanded(e => !e)}
        disabled={!hasIssues}
      >
        <span className="ms headset-status-bar__icon">headset_mic</span>
        <span className="headset-status-bar__text">
          {onlineCount}/{total} {t('overviewPage.headsetOnline')}
        </span>
        {hasIssues && <span className="ms headset-status-bar__warning">warning</span>}
        {hasIssues && (
          <span className="ms headset-status-bar__chevron">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        )}
      </button>

      {expanded && (
        <ul className="headset-items" style={{ padding: '0 14px' }}>
          {problematic.map(h => {
            const status = resolveStatus(h)
            return (
              <li key={h.id} className="headset-item">
                <span className="headset-item__label">{h.label}</span>
                <span className="headset-item__status">
                  {t(STATUS_LABEL_KEY[status] ?? STATUS_LABEL_KEY[HEADSET_STATUS.OFFLINE])}
                  <span className={`headset-item__dot headset-item__dot--${status}`} />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
