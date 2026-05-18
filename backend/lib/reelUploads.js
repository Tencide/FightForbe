const fs = require('fs');
const path = require('path');

const UPLOAD_DIR =
  process.env.REELS_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'reels');
const MEDIA_ROUTE = '/api/reels/media';

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function mediaPathForFilename(name) {
  return path.join(UPLOAD_DIR, path.basename(name));
}

function publicPathForFilename(name) {
  return `${MEDIA_ROUTE}/${path.basename(name)}`;
}

function deleteUploadedFile(videoUrl) {
  const m = String(videoUrl || '').match(/\/api\/reels\/media\/([^/?#]+)$/i);
  if (!m) return;
  const file = mediaPathForFilename(m[1]);
  try {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (err) {
    console.warn('reel file delete:', err.message);
  }
}

module.exports = {
  UPLOAD_DIR,
  MEDIA_ROUTE,
  ensureUploadDir,
  mediaPathForFilename,
  publicPathForFilename,
  deleteUploadedFile,
};
