// RMS of actual microphone samples. This is an input-level check, not speech
// recognition. Never connect the source to speakers (that would cause feedback).
export function rmsLevel(samples) {
  if (!samples.length) return 0;
  const sum = samples.reduce((total, value) => total + value * value, 0);
  return Math.min(1, Math.sqrt(sum / samples.length));
}

export async function measureMicrophone(stream, onLevel, runtime = globalThis) {
  const AudioContext = runtime.AudioContext || runtime.webkitAudioContext;
  if (!AudioContext) throw new Error('Web Audio unavailable');
  const context = new AudioContext();
  let source;
  let frame;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    if (frame !== undefined) runtime.cancelAnimationFrame(frame);
    source?.disconnect();
    void context.close().catch(() => {});
  };
  try {
    // Some browsers leave resume pending until another gesture. Bound it and
    // release this context if it cannot start; the check can be retried.
    let timer;
    try {
      await Promise.race([context.resume(), new Promise((_, reject) => {
        timer = runtime.setTimeout(() => reject(new Error('Audio context timed out')), 3000);
      })]);
    } finally { runtime.clearTimeout(timer); }
    source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const sample = () => {
      if (closed) return;
      analyser.getFloatTimeDomainData(samples);
      onLevel(rmsLevel(samples));
      frame = runtime.requestAnimationFrame(sample);
    };
    sample();
    return close;
  } catch (error) {
    close();
    throw error;
  }
}
