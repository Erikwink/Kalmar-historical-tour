import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../context/SettingsContext'
import TopAppBar from '../components/TopAppBar'
import ConfirmModal from '../components/ConfirmModal'
import SettingsManageDevices from '../components/SettingsManageDevices'

const LANGUAGES = [
  { value: 'sv', label: 'Svenska' },
  { value: 'en', label: 'English' },
]

const FONT_SIZE_VALUES = ['small', 'medium', 'large']

/**
 * App settings page — language, font size, theme, and account actions.
 * Switches to an inline headset management view when the user clicks "Hantera enheter".
 * @param {{ onLogout: Function, onEndSession: Function, headsets: Array, onRemoveHeadset: Function, adapterStatus: string|null }} props
 */
export default function SettingsPage({ onLogout, onEndSession, headsets = [], onRemoveHeadset, adapterStatus }) {
  const [showHeadsets, setShowHeadsets] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useSettings()

  if (showHeadsets) {
    return (
      <SettingsManageDevices
        headsets={headsets}
        onRemoveHeadset={onRemoveHeadset}
        onBack={() => setShowHeadsets(false)}
      />
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
          <button className="settings-item" onClick={() => setShowHeadsets(true)}>
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