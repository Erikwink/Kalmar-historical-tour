/**
 * @fileoverview Audio session broadcasting via ggwave data-over-sound.
 *
 * The controller plays the session ID as an audible tone sequence.
 * The client (Quest 3) listens with its microphone and decodes it.
 *
 * ggwave module and instance are singletons — initialized once on first use
 * since init() is expensive and sampleRate is consistent per device.
 */

// @ts-ignore — no type declarations for ggwave
import ggwaveFactory from 'ggwave'

let ggwaveModule = null
let instance = null

/**
 * Lazily loads the ggwave WASM module.
 * @returns {Promise<object>} the ggwave module
 */
async function getModule() {
  if (!ggwaveModule) {
    ggwaveModule = await ggwaveFactory()
  }
  return ggwaveModule
}

/**
 * Encodes the session ID as audio and plays it through the device speaker.
 * Uses the AUDIBLE_FAST protocol — audible tone, ~1 second for 6 digits.
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export async function playSessionId(sessionId) {
  const ggWaveModule = await getModule()
  // Instanciate audicontex, web motor for audio
  const audioCtx = new AudioContext()

  // Instantiate ggwave instance once 
  // sampleRate must match/be fetched from AudioContext for audio encoding to work
  if (!instance) {
    const params = ggWaveModule.getDefaultParameters()
    params.sampleRateInp = audioCtx.sampleRate
    params.sampleRateOut = audioCtx.sampleRate
    instance = ggWaveModule.init(params)
  }

  // Transform sessionId to audio wave, set volume to 10
  const waveform = ggWaveModule.encode(
    instance,
    sessionId,
    ggWaveModule.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,
    10
  )
  // Create monobuffer chanel and use waveform data
  const buffer = audioCtx.createBuffer(1, waveform.length, audioCtx.sampleRate)
  buffer.getChannelData(0).set(waveform)

  // Connect to device speaker
  const source = audioCtx.createBufferSource()
  source.buffer = buffer
  source.connect(audioCtx.destination)

  // Start the audio
  await new Promise((resolve) => {
    source.onended = resolve
    source.start()
  })

  audioCtx.close()
}
