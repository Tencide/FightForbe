const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { UPLOAD_DIR, ensureUploadDir } = require('../lib/reelUploads');

const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime', // iPhone — client should transcode before upload when possible
  'video/x-m4v',
]);
const ALLOWED_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const maxMb = Math.min(Math.max(parseInt(process.env.REELS_MAX_UPLOAD_MB, 10) || 50, 1), 100);
const MAX_BYTES = maxMb * 1024 * 1024;

ensureUploadDir();

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = ['.mp4', '.webm', '.mov', '.m4v'].includes(ext) ? ext : '.mp4';
    cb(null, `${crypto.randomUUID()}${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.has(ext)) return cb(null, true);
    cb(new Error('Only MP4 or WebM videos are allowed.'));
  },
});

function reelVideoUpload(req, res, next) {
  upload.single('video')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      const mb = Math.round(MAX_BYTES / (1024 * 1024));
      return res.status(400).json({ error: `Video too large (max ${mb} MB).` });
    }
    return res.status(400).json({ error: err.message || 'Invalid upload' });
  });
}

module.exports = { reelVideoUpload, MAX_BYTES };
