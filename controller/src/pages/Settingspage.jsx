import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

const LANGUAGES = [
  { value: 'sv', label: 'Svenska' },
  { value: 'en', label: 'English' },
]

const FONT_SIZES = [
  { value: 'small',  label: 'Liten' },
  { value: 'medium', label: 'Medel' },
  { value: 'large',  label: 'Stor' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useSettings()

  return (
    <div className="page">
      <div className="top-app-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Tillbaka">
          <span className="ms">arrow_back</span>
        </button>
        <span className="top-app-bar__title">Inställningar</span>
      </div>

      <div className="page-content">
        <div className="section-header">
          <span className="section-header__title">Tour</span>
        </div>
        <div className="card settings-list">
          <button className="settings-item" onClick={() => {}}>
            <span className="settings-item__label">Redigera tour</span>
            <span className="ms settings-item__arrow">chevron_right</span>
          </button>
          <button className="settings-item" onClick={() => {}}>
            <span className="settings-item__label">Hantera enheter</span>
            <span className="ms settings-item__arrow">chevron_right</span>
          </button>
        </div>

        <div className="section-header">
          <span className="section-header__title">Allmänt</span>
        </div>
        <div className="card settings-list">
          <div className="settings-item settings-item--select">
            <span className="settings-item__label">Språk</span>
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
            <span className="settings-item__label">Textstorlek</span>
            <select
              className="settings-select"
              value={fontSize}
              onChange={e => setFontSize(e.target.value)}
            >
              {FONT_SIZES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="settings-item">
            <span className="settings-item__label">Utseende</span>
            <button
              className={`settings-toggle ${theme === 'dark' ? 'settings-toggle--active' : ''}`}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Växla mörkt läge"
            >
              <span className="ms" style={{ fontSize: 18 }}>
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              {theme === 'dark' ? 'Mörkt' : 'Ljust'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
