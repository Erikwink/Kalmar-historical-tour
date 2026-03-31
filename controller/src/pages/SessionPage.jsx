import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HeadsetList from '../components/headsetList'
import QRModal from '../components/QRmodal'
import { tours } from '../tours'
import { tours } from '../tours'
import { HEADSET_STATUS } from '../utils/status_maps'

/**
 * Session overview page — shows the session ID, QR code button and headset list.
 * The guide starts the tour from here once at least one headset is connected.
 * @param {{ sessionId: string, headsets: Array, adapterStatus: string|null }} props
 */
export default function SessionPage({ sessionId, headsets, adapterStatus }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  
  const tourId = searchParams.get('tourId')
  const tour = tours.find(t => t.id === tourId)

  const [showQR, setShowQR] = useState(false)

  // Start tour button is disabled until at least one headset is online
  const headsetsConnected = headsets.filter(h => h.status === HEADSET_STATUS.ONLINE).length
import QRModal from '../components/QRmodal'
import { HEADSET_STATUS } from '../utils/status_maps'

/**
 * Session overview page — shows the session ID, QR code button and headset list.
 * The guide starts the tour from here once at least one headset is connected.
 * @param {{ sessionId: string, headsets: Array, adapterStatus: string|null }} props
 */
export default function SessionPage({ sessionId, headsets, adapterStatus }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [showQR, setShowQR] = useState(false)

  // Start tour button is disabled until at least one headset is online
  const headsetsConnected = headsets.filter(h => h.status === HEADSET_STATUS.ONLINE).length

  return (
    <div className="page">
      <div className="top-app-bar">
        <span className="top-app-bar__title">{t('sessionPage.fallbackTitle')}</span>
        <button
          className="icon-btn"
          onClick={() => navigate('/settings')}
          aria-label={t('nav.settings')}
        >
          <span className="ms">settings</span>
        </button>
      </div>

      <div className="page-content">
        <div className="session-info-card card">
          <div className="session-info-card__code-row">
            <div>
              <div className="session-card__label">{t('sessionPage.sessionId')}</div>
              <div className="session-card__code">{sessionId}</div>
            </div>
            <button
              className="icon-btn"
              onClick={() => setShowQR(true)}
              aria-label={t('sessionPage.showQR')}
            >
              <span className="ms" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
            </button>
          </div>
        </div>

        <div className="headset-section">
          <HeadsetList headsets={headsets} adapterStatus={adapterStatus} />
        </div>
      </div>

      <div className="fab-wrap">
        <button
          className="efab"
          onClick={() => navigate('/tours')}
          disabled={headsetsConnected === 0}
        >
          <span
            className="ms"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            play_circle
          </span>
          {t('sessionPage.startTour')}
        </button>
      </div>

      {showQR && <QRModal sessionId={sessionId} onClose={() => setShowQR(false)} />}
    </div>
  )
}
