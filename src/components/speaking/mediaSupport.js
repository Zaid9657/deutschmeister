// Browser/media capability checks for the turn-based (tap-to-speak) speaking
// flow. Recording uses MediaRecorder; playback is a plain <audio> element.

const IN_APP_BROWSER_PATTERNS = [
  /FBAN/i, /FBAV/i, /FB_IAB/i, /Instagram/i, /Twitter/i, /Line\//i,
  /MicroMessenger/i, /LinkedInApp/i, /BytedanceWebview/i, /musical_ly/i,
  /TikTok/i, /Snapchat/i, /Pinterest/i,
];

export function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  for (const pattern of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(ua)) return pattern.source.replace(/[/\\^$*+?.()|[\]{}]/g, '').replace(/i$/, '');
  }
  return null;
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function checkSpeakingSupport() {
  if (typeof window === 'undefined') return { supported: false, reason: 'no_window' };

  const inApp = detectInAppBrowser();
  if (inApp) return { supported: false, reason: 'in_app_browser', inAppBrowser: inApp, isIOS: isIOS() };

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return { supported: false, reason: 'no_media_devices', isIOS: isIOS() };
  }
  if (typeof window.MediaRecorder === 'undefined') {
    return { supported: false, reason: 'no_media_recorder', isIOS: isIOS() };
  }
  return { supported: true, isIOS: isIOS() };
}

// Pick a recording container the browser actually supports. Chrome/Firefox/Edge
// give us webm/opus; Safari (desktop + iOS) only does mp4. The chosen string is
// sent to the backend as `mimeType` so STT gets the right file extension.
export function pickAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
  ];
  for (const type of candidates) {
    try { if (MediaRecorder.isTypeSupported(type)) return type; } catch { /* ignore */ }
  }
  return '';
}

// Strip the `data:...;base64,` prefix, returning just the base64 payload.
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function micErrorMessage(err) {
  const msg = (err?.message || err?.name || '').toLowerCase();
  if (msg.includes('not allowed') || msg.includes('permission') || err?.name === 'NotAllowedError') {
    return isIOS()
      ? 'Mikrofon-Zugriff verweigert. Gehe zu Einstellungen → Safari → Mikrofon und erlaube den Zugriff.'
      : 'Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.';
  }
  if (msg.includes('not found') || err?.name === 'NotFoundError') {
    return 'Kein Mikrofon gefunden. Bitte schließe ein Mikrofon an und versuche es erneut.';
  }
  if (msg.includes('not readable') || err?.name === 'NotReadableError') {
    return 'Das Mikrofon konnte nicht geöffnet werden. Möglicherweise wird es von einer anderen App verwendet.';
  }
  return 'Mikrofon konnte nicht gestartet werden. Bitte versuche es erneut.';
}
