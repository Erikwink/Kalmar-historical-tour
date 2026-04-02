import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HeadsetList from '../components/headsetList'
import TopAppBar from '../components/TopAppBar'
import Fab from '../components/Fab'
import { HEADSET_STATUS } from '../utils/status_maps'

/**
 * Session overview page — shows the session ID and headset list.
 * The guide starts the tour from here once at least one headset is connected.
 * @param {{ sessionId: string, headsets: Array, adapterStatus: string|null }} props
 */
export default function SessionPage({ sessionId, headsets, adapterStatus }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const headsetsConnected = headsets.filter(h => h.status === HEADSET_STATUS.ONLINE).length

  return (
    <div className="page">
      <TopAppBar title={t('sessionPage.fallbackTitle')} />

      <div className="page-content">
        <div className="session-info-card card">
          <div className="session-info-card__code-row">
            <div>
              <div className="session-card__label">{t('sessionPage.sessionId')}</div>
              <div className="session-card__code">{sessionId}</div>
            </div>
          </div>
        </div>

        <div className="headset-section">
          <HeadsetList headsets={headsets} adapterStatus={adapterStatus} />
        </div>
      </div>

      <Fab icon="play_circle" disabled={headsetsConnected === 0} onClick={() => navigate('/tours')}>
        {t('sessionPage.startTour')}
      </Fab>
    </div>
  )
}