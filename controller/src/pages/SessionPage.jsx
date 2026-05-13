import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HeadsetList from '../components/headsetList'
import TopAppBar from '../components/TopAppBar'
import Fab from '../components/Fab'
import Section from '../components/Section';

/**
 * Session start page — shows the session code for headsets to connect and lists connected devices.
 * @param {{ sessionId: string, headsets: Array, adapterStatus: string|null }} props
 */
export default function SessionPage({ sessionId, headsets, adapterStatus }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="page">
      <TopAppBar title={t('sessionPage.connectHeadset')} />

      <div className="page-content">
        <Section
          title={t('sessionPage.connectWithCode')}
        >
      <p className="session-connect__code">{sessionId}</p>
                <button className="session-connect__sound-btn">
                  <span className="ms">volume_up</span>
                  {t('sessionPage.connectWithSound')}
                </button>
              </Section>
              

        <HeadsetList
          headsets={headsets}
          adapterStatus={adapterStatus}
          title={t('sessionPage.connectedDevices')}
          icon="head_mounted_device"
        />
      </div>

      <Fab onClick={() => navigate('/tours')}>
        {t('sessionPage.next')}
      </Fab>
    </div>
  )
}
