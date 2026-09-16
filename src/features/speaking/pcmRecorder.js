// Mono 16 kHz PCM WAV recorder for constrained pronunciation steps — plan
// Task 3 (speaking-guided-city-map). Azure's pronunciation assessment wants
// `audio/wav; codecs=audio/pcm; samplerate=16000`, which MediaRecorder does
// not produce, so this records through WebAudio and encodes the WAV itself.
//
// Rules the UI relies on:
//   * records ONLY between start() and stop() (hold/toggle semantics live in
//     the component; nothing records without an explicit start);
//   * stop() releases every media track and closes the AudioContext;
//   * clips are validated here: empty or over MAX_SECONDS throws;
//   * the blob stays local until the caller uploads it — local playback
//     before upload is a caller decision on the returned blob URL.

export const TARGET_SAMPLE_RATE = 16000;
export const MAX_SECONDS = 30;

export class RecorderError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'RecorderError';
    this.code = code; // 'MICROPHONE_DENIED' | 'EMPTY_RECORDING' | 'TOO_LONG' | 'UNSUPPORTED'
  }
}

/** Pure: downsample Float32 chunks to 16 kHz mono Int16. Exported for tests. */
export function downsampleTo16k(float32, inputRate) {
  if (inputRate === TARGET_SAMPLE_RATE) return float32ToInt16(float32);
  const ratio = inputRate / TARGET_SAMPLE_RATE;
  const outLength = Math.floor(float32.length / ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), float32.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += float32[j];
    const sample = end > start ? sum / (end - start) : 0;
    out[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
  }
  return out;
}

function float32ToInt16(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i += 1) {
    out[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)));
  }
  return out;
}

/** Pure: wrap Int16 mono samples in a WAV container. Exported for tests. */
export function encodeWav(samples, sampleRate = TARGET_SAMPLE_RATE) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, s) => { for (let i = 0; i < s.length; i += 1) view.setUint8(offset + i, s.charCodeAt(i)); };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  new Int16Array(buffer, 44).set(samples);
  return buffer;
}

/**
 * createPcmRecorder() → { start, stop, dispose }
 * stop() resolves { blob, base64, seconds } (WAV, mono, 16 kHz) or throws a
 * typed RecorderError. Every stop/dispose releases the microphone.
 */
export function createPcmRecorder() {
  let stream = null;
  let context = null;
  let source = null;
  let processor = null;
  let chunks = [];
  let inputRate = TARGET_SAMPLE_RATE;

  const release = () => {
    try { processor?.disconnect(); } catch { /* already gone */ }
    try { source?.disconnect(); } catch { /* already gone */ }
    try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* already gone */ }
    try { context?.close(); } catch { /* already gone */ }
    stream = null; context = null; source = null; processor = null;
  };

  return {
    async start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new RecorderError('UNSUPPORTED', 'getUserMedia not available');
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      } catch {
        throw new RecorderError('MICROPHONE_DENIED', 'Microphone permission denied');
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      context = new Ctx();
      inputRate = context.sampleRate;
      source = context.createMediaStreamSource(stream);
      // ScriptProcessor is deprecated but universally supported; the buffers
      // stay small and everything is torn down after each turn.
      processor = context.createScriptProcessor(4096, 1, 1);
      chunks = [];
      processor.onaudioprocess = (e) => {
        chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        const seconds = chunks.reduce((s, c) => s + c.length, 0) / inputRate;
        if (seconds > MAX_SECONDS + 1) this.stop().catch(() => {});
      };
      source.connect(processor);
      processor.connect(context.destination);
    },

    async stop() {
      const collected = chunks;
      chunks = [];
      release();
      const total = collected.reduce((s, c) => s + c.length, 0);
      if (total === 0) throw new RecorderError('EMPTY_RECORDING', 'Nothing was recorded');
      const merged = new Float32Array(total);
      let offset = 0;
      for (const c of collected) { merged.set(c, offset); offset += c.length; }
      const seconds = total / inputRate;
      if (seconds > MAX_SECONDS) throw new RecorderError('TOO_LONG', `Clip exceeds ${MAX_SECONDS}s`);
      const wav = encodeWav(downsampleTo16k(merged, inputRate));
      const blob = new Blob([wav], { type: 'audio/wav' });
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return { blob, base64, seconds };
    },

    dispose: release,
  };
}
