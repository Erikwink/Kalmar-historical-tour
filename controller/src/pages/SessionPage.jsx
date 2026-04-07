import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HeadsetList from '../components/headsetList'
import TopAppBar from '../components/TopAppBar'
import Fab from '../components/Fab'
import Section from '../components/Section'
import { HEADSET_STATUS } from '../utils/status_maps'
import SessionCard from '../components/sessionCard'

/**
 * Session overview page — shows the session ID and headset list.
 * The guide starts the tour from here once at least one headset is connected.
 * @param {{ sessionId: string, headsets: Array, adapterStatus: string|null }} props
 */
export default function SessionPage({ sessionId, headsets, adapterStatus }) {
  const navigate = useNavigate()
  const { t } = useTranslation()


  return (
    <div className="page">
      <TopAppBar title={t('sessionPage.fallbackTitle')} />

      <div className="page-content">
        <Section
          title={t("sessionPage.connectDevice")}>
          <div className="session-info-card">
            <SessionCard label={t('sessionPage.sessionCode')}>
              <div className="session-card__sessionId">{sessionId}</div>
            </SessionCard>

            <SessionCard label={t('sessionPage.playSound')}>
              <button className="session-info-card__sound-btn">
                <span className="ms">volume_up</span>
              </button>
            </SessionCard>
          </div>
        </Section>



          <HeadsetList 
          headsets={headsets} 
          adapterStatus={adapterStatus} 
          />
        </div>
    

      <Fab onClick={() => navigate('/tours')}>
        {t('sessionPage.selectTour')}
      </Fab>
    </div>
  )
}