import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../context/SettingsContext'
import TopAppBar from '../components/TopAppBar'
import ConfirmModal from '../components/ConfirmModal'

const LANGUAGES = [
  { value: 'sv', label: 'Svenska' },
  { value: 'en', label: 'English' },
]

const FONT_SIZE_VALUES = ['small', 'medium', 'large']

/**
 * App settings page — language, font size, theme, and account actions.
 * Switches to an inline headset management view when the user clicks "Hantera enheter".
 * @param {{ onLogout: Function, headsets: Array, onRemoveHeadset: Function }} props
 */
export default function SettingsPage({ onLogout, onEndSession, headsets = [], onRemoveHeadset, adapterStatus }) {
  const [view, setView] = useState('settings')
  const [showEndModal, setShowEndModal] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useSettings()

  if (view === 'headsets') {
    return (
      <div className="page">
        <TopAppBar title={t('settingsPage.manageDevices')} onBack={() => setView('settings')} showSettings={false} />
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
                      {h.status}
                      <span className={`headset-item__dot headset-item__dot--${h.status}`} />
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

  return (
    <>
    <div className="page">
      <TopAppBar title={t('settingsPage.title')} onBack={() => navigate(-1)} showSettings={false} />

      <div className="page-content">
        <div className="section-header">
          <span className="section-header__title">{t('settingsPage.tourSection')}</span>
        </div>
        <div className="card settings-list">
          <button className="settings-item" onClick={() => {}}>
            <span className="settings-item__label">{t('settingsPage.editTour')}</span>
            <span className="ms settings-item__arrow">chevron_right</span>
          </button>
          <button className="settings-item" onClick={() => setView('headsets')}>
            <span className="settings-item__label">{t('settingsPage.manageDevices')}</span>
            <span className="ms settings-item__arrow">chevron_right</span>
          </button>
        </div>

        <div className="section-header">
          <span className="section-header__title">{t('settingsPage.generalSection')}</span>
        </div>
        <div className="card settings-list">
          <div className="settings-item settings-item--select">
            <span className="settings-item__label">{t('settingsPage.language')}</span>
            <select
              className="settings-select"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="settings-item settings-item--select">
            <span className="settings-item__label">{t('settingsPage.fontSize')}</span>
            <select
              className="settings-select"
              value={fontSize}
              onChange={e => setFontSize(e.target.value)}
            >
              {FONT_SIZE_VALUES.map(v => (
                <option key={v} value={v}>{t(`fontSizes.${v}`)}</option>
              ))}
            </select>
          </div>

          <div className="settings-item">
            <span className="settings-item__label">{t('settingsPage.appearance')}</span>
            <button
              className={`settings-toggle ${theme === 'dark' ? 'settings-toggle--active' : ''}`}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={t('settingsPage.toggleDarkMode')}
            >
              <span className="ms" style={{ fontSize: 18 }}>
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              {theme === 'dark' ? t('settingsPage.dark') : t('settingsPage.light')}
            </button>
          </div>
        </div>

        <div className="section-header">
          <span className="section-header__title">System</span>
        </div>
        <div className="card settings-list">
          <div className="settings-item">
            <span className="settings-item__label">Firebase</span>
            <span className="headset-item" style={{ gap: '6px' }}>
              <span className="headset-status">{adapterStatus ?? '—'}</span>
              <span className={`saas-dot saas-dot--${adapterStatus ?? 'disconnected'}`} />
            </span>
          </div>
        </div>

        <div className="section-header">
          <span className="section-header__title">{t('settingsPage.sessionSection', 'Session')}</span>
        </div>
        <div className="card settings-list">
          <button className="settings-item settings-item--danger" onClick={() => setShowEndModal(true)}>
            <span className="settings-item__label">{t('settingsPage.endSession')}</span>
            <span className="ms settings-item__arrow">stop_circle</span>
          </button>
        </div>

        <div className="section-header">
          <span className="section-header__title">{t('settingsPage.accountSection')}</span>
        </div>
        <div className="card settings-list">
          <button className="settings-item settings-item--danger" onClick={onLogout}>
            <span className="settings-item__label">{t('settingsPage.logout')}</span>
            <span className="ms settings-item__arrow">logout</span>
          </button>
        </div>
      </div>
    </div>

    {showEndModal && (
      <ConfirmModal
        title={t("settingsPage.endSession")}
        message={t("settingsPage.endSessionMessage")}
        confirmLabel={t("settingsPage.endSession")}
        cancelLabel={t("endSessionModal.cancel")}
        confirmIcon="power_off"
        onConfirm={() => { setShowEndModal(false); onEndSession(); }}
        onCancel={() => setShowEndModal(false)}
      />
    )}
    </>
  )
}
