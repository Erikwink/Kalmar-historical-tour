/**
 * @fileoverview Self-contained component for receiving a session ID via audio.
 *
 * Renders a listen button. When pressed, requests mic access and starts
 * decoding incoming ggwave audio from the controller. On successful decode
 * the session ID is passed to onSessionIdReceived and listening stops.
 *
 * Designed to be dropped in anywhere in the client UI without extra setup:
 *   <AudioSessionListener onSessionIdReceived={(id) => setSessionId(id)} />
 *
 * States: idle → listening → received | error
 */
import { useState, useRef } from 'react'
import { listenForSessionId, loopbackTest } from '../utils/audioSession'

/**
 * @param {{ onSessionIdReceived: function(string): void }} props
 */
export default function AudioSessionListener({ onSessionIdReceived }) {
  const [state, setState] = useState('idle') // 'idle' | 'listening' | 'received' | 'error'
  const stopRef = useRef(null)

  async function handleStart() {
    setState('listening')
    try {
      const stop = await listenForSessionId((id) => {
        stopRef.current?.()
        stopRef.current = null
        setState('received')
        onSessionIdReceived(id)
        console.log(id)
      })
      stopRef.current = stop
    } catch {
      setState('error')
    }
  }

  function handleStop() {
    stopRef.current?.()
    stopRef.current = null
    setState('idle')
  }

  async function handleLoopbackTest() {
    const result = await loopbackTest('123456')
    console.log('[loopback] result:', result)
    alert(result ? `Loopback OK: "${result}"` : 'Loopback misslyckades')
  }

  const labels = {
    idle:      'Lyssna efter session-ID',
    listening: 'Lyssnar... (tryck för att avbryta)',
    received:  'Session-ID mottaget!',
    error:     'Mikrofonåtkomst nekades — ange ID manuellt',
  }

  return (
    <div>
      <button
        onClick={state === 'listening' ? handleStop : handleStart}
        disabled={state === 'received'}
      >
        {labels[state]}
      </button>
      {import.meta.env.DEV && (
        <button onClick={handleLoopbackTest} style={{ marginLeft: 8 }}>
          [DEV] Loopback test
        </button>
      )}
    </div>
  )
}
