/** @returns {string|null} 11-char YouTube video id */
function getYouTubeId(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'v');
      if (idx !== -1 && parts[idx + 1]) {
        const id = parts[idx + 1];
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function classifyVideoUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (getYouTubeId(raw)) return { kind: 'youtube', url: raw, youtubeId: getYouTubeId(raw) };
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (!/^https?:$/i.test(url.protocol)) return null;
    const path = url.pathname.toLowerCase();
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(path)) {
      return { kind: 'direct', url: url.href, youtubeId: null };
    }
    return { kind: 'link', url: url.href, youtubeId: null };
  } catch {
    return null;
  }
}

module.exports = { getYouTubeId, classifyVideoUrl };
