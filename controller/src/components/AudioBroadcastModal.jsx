/**
 * @fileoverview Modal that lets the guide broadcast the session ID as audio.
 *
 * Renders a large play button. On press, encodes the session ID via ggwave
 * and plays it through the device speaker. The headset mic picks it up and
 * decodes it on the client side.
 *
 * States: idle → playing → done | error
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { MS_FILL } from '../utils/iconStyles'
import { playSessionId } from '../utils/audioSession'

/**
 * Modal that lets the guide broadcast the session ID as audio.
 * The headset mic picks it up and decodes it automatically.
 * @param {{ sessionId: string, onClose: Function }} props
 */
export default function AudioBroadcastModal({ sessionId, onClose }) {
  const { t } = useTranslation()
  const [state, setState] = useState('idle') // 'idle' | 'playing' | 'done' | 'error'

  async function handlePlay() {
    setState('playing')
    try {
      await playSessionId(sessionId)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal__header">
        <span className="modal__title">{t('audioBroadcastModal.title')}</span>
        <button className="icon-btn" onClick={onClose}>
          <span className="ms">close</span>
        </button>
      </div>

      <div className="modal__body">
        <button
          className="audio-broadcast-btn"
          onClick={handlePlay}
          disabled={state === 'playing'}
        >
          <span className="ms" style={MS_FILL}>
            {state === 'playing' ? 'graphic_eq' : 'volume_up'}
          </span>
        </button>

        <p className="modal__message">
          {t(`audioBroadcastModal.status.${state}`)}
        </p>
      </div>

      <div className="modal__footer">
        <button className="efab efab--outline" onClick={onClose}>
          {t('audioBroadcastModal.close')}
        </button>
      </div>
    </Modal>
  )
}
