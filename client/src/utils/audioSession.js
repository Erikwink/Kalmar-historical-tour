/**
 * @fileoverview Audio session ID receiver via ggwave data-over-sound.
 *
 * Listens to the device microphone and decodes an incoming ggwave transmission.
 * The controller plays the session ID as an audible tone sequence which this
 * module picks up and decodes back to the original string.
 *
 * ggwave module and instance are singletons — initialized once on first use.
 */

// @ts-ignore — no type declarations for ggwave
import ggwaveFactory from 'ggwave'

let ggwaveModule = null
let instance = null

/**
 * Lazily loads and initializes the ggwave WASM module.
 * sampleRate must match the AudioContext that will be used for mic input.
 * @param {number} sampleRate
 * @returns {Promise<object>} the initialized ggwave module
 */
async function getInstance(sampleRate) {
  if (!ggwaveModule) {
    ggwaveModule = await ggwaveFactory()
  }
  if (!instance && instance !== 0) {
    // Instantiate ggwave instance once — sampleRate must match AudioContext
    const params = ggwaveModule.getDefaultParameters()
    params.sampleRateInp = sampleRate
    params.sampleRateOut = sampleRate
    instance = ggwaveModule.init(params)
    console.log('[ggwave] instance:', instance)
  }
  return ggwaveModule
}

/**
 * DEV ONLY: Encodes a session ID and immediately decodes it in-memory,
 * bypassing the speaker/mic path. Used to verify encode/decode logic works.
 * @param {string} sessionId
 * @returns {Promise<string>} the decoded string (should match sessionId)
 */
export async function loopbackTest(sessionId) {
  // Reuse the singleton instance — ggwave only supports one active instance at a time.
  const mod = await getInstance(48000)

  console.log('[loopback] instance:', instance, 'type:', typeof instance)

  // encode() returns Int8Array of raw F32 bytes (every 4 bytes = one Float32 sample).
  // Copy out of WASM memory immediately — decode calls may overwrite the same heap region.
  const waveformBytes = Int8Array.from(
    mod.encode(instance, sessionId, mod.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST, 10)
  )
  console.log('[loopback] waveform bytes:', waveformBytes.length)

  // Feed 4096 bytes (= 1024 F32 samples) per chunk — matches onaudioprocess buffer size
  const chunkSize = 4096
  for (let i = 0; i < waveformBytes.length; i += chunkSize) {
    const result = mod.decode(instance, waveformBytes.slice(i, i + chunkSize))
    if (result && result.length > 0) {
      const text = new TextDecoder().decode(result)
      console.log('[loopback] decoded at byte', i, ':', text)
      return text
    }
  }
  console.log('[loopback] no data decoded')
  return null
}

/**
 * Starts listening to the microphone and decodes incoming ggwave audio.
 * Calls onDecoded with the decoded string when a transmission is received.
 * Returns a stop function that cleans up mic and AudioContext.
 *
 * @param {function(string): void} onDecoded - called with decoded session ID
 * @returns {Promise<function(): void>} stop function
 */

export async function listenForSessionId(onDecoded) {
  // Disable echo/noise cancellation — otherwise the browser filters out
  // audio played from the same device before ggwave can decode it
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  })
  const audioCtx = new AudioContext()
  const mod = await getInstance(audioCtx.sampleRate)

  console.log('[ggwave] AudioContext sampleRate:', audioCtx.sampleRate)

  const source = audioCtx.createMediaStreamSource(stream)

  // Boost mic signal — laptop mic picks up speaker audio at low amplitude
  const gain = audioCtx.createGain()
  gain.gain.value = 4

  // ScriptProcessor feeds mic samples to ggwave.decode() on each audio chunk.
  // Buffer size 4096 gives ~93ms chunks — larger buffer improves ggwave detection.
  // Note: ScriptProcessor is deprecated but has broad support incl. Quest 3.
  const processor = audioCtx.createScriptProcessor(1024, 1, 1)

  processor.onaudioprocess = (e) => {
    const samples = e.inputBuffer.getChannelData(0)
    const max = Math.max(...samples.map(Math.abs))

    // Log amplitude so we can confirm mic is picking up the controller audio
    if (max > 0.001) {
      console.log(`[ggwave] signal detected, amplitude: ${max.toFixed(4)}`)
    }

    // sampleFormatInp = F32 — pass Float32 bytes directly
    const result = mod.decode(instance, new Int8Array(samples.buffer))
    if (result && result.length > 0) {
      console.log('[ggwave] decoded:', new TextDecoder().decode(result))
      // decode() returns Uint8Array — convert to string
      onDecoded(new TextDecoder().decode(result))
    }
  }

  source.connect(gain)
  gain.connect(processor)
  // processor must be connected to destination to stay active (Web Audio quirk)
  processor.connect(audioCtx.destination)

  return function stop() {
    processor.disconnect()
    gain.disconnect()
    source.disconnect()
    stream.getTracks().forEach(t => t.stop())
    audioCtx.close()
  }
}
