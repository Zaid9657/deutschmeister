const CACHE_PREFIX = 'dm_vthumbnail_';

/**
 * Get a cached thumbnail data URL from localStorage.
 */
export function getCachedThumbnail(videoId) {
  try {
    return localStorage.getItem(`${CACHE_PREFIX}${videoId}`);
  } catch {
    return null;
  }
}

/**
 * Cache a thumbnail data URL in localStorage.
 */
function cacheThumbnail(videoId, dataUrl) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${videoId}`, dataUrl);
  } catch {
    // localStorage full or unavailable — ignore
  }
}

/**
 * Generate a thumbnail from a video URL by capturing a frame at ~1 second.
 * Returns a data URL string or null on failure.
 */
export function generateThumbnail(videoUrl, videoId) {
  return new Promise((resolve) => {
    // Check cache first
    const cached = getCachedThumbnail(videoId);
    if (cached) {
      resolve(cached);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let resolved = false;
    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    // Timeout — don't wait forever
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(null);
      }
    }, 8000);

    video.onloadeddata = () => {
      // Seek to 1 second or 10% of duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        cacheThumbnail(videoId, dataUrl);
        cleanup();
        resolve(dataUrl);
      } catch {
        // CORS or canvas tainted — can't capture
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve(null);
      }
    };

    video.src = videoUrl;
  });
}
