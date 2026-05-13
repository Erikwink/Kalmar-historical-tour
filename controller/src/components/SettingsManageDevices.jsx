import { useTranslation } from 'react-i18next'
import TopAppBar from './TopAppBar'
import { STATUS_LABEL_KEY, resolveStatus } from '../utils/status_maps'

/**
 * Inline headset management view — rendered by SettingsPage.
 * @param {{ headsets: Array, onRemoveHeadset: Function, onBack: Function }} props
 */
export default function SettingsManageDevices({ headsets = [], onRemoveHeadset, onBack }) {
  const { t } = useTranslation()

  return (
    <div className="page">
      <TopAppBar title={t('settingsPage.manageDevices')} onBack={onBack} showSettings={false} />
      <div className="page-content">
        <div className="card">
          {headsets.length === 0 ? (
            <p className="settings-item">{t('manageHeadsetsModal.empty')}</p>
          ) : (
            <ul className="headset-items" style={{ padding: '0 16px' }}>
              {headsets.map((h) => (
                <li key={h.id} className="headset-item">
                  <span className="headset-item__label">{h.label}</span>
                  <span className="headset-item__status">
                    {t(STATUS_LABEL_KEY[resolveStatus(h)])}
                    <span className={`headset-item__dot headset-item__dot--${resolveStatus(h)}`} />
                  </span>
                  <button
                    className="icon-btn"
                    style={{ color: 'var(--color-warning)', marginLeft: '8px' }}
                    aria-label={t('manageHeadsetsModal.remove')}
                    onClick={() => onRemoveHeadset(h.id)}
                  >
                    <span className="ms">delete</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}