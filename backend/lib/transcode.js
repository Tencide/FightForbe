const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/**
 * Convert iPhone .mov (HEVC) to H.264 MP4 for Chrome/Firefox/Android playback.
 * Returns output path on success, or input path if ffmpeg is missing or fails.
 */
async function transcodeMovToMp4(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  if (ext !== '.mov') return inputPath;

  const outPath = inputPath.replace(/\.mov$/i, '.mp4');
  if (outPath === inputPath) return inputPath;

  try {
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '28',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        outPath,
      ],
      { timeout: 120_000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
      fs.unlinkSync(inputPath);
      return outPath;
    }
  } catch (err) {
    console.warn('ffmpeg transcode skipped:', err.message || err);
    if (fs.existsSync(outPath)) {
      try {
        fs.unlinkSync(outPath);
      } catch {
        /* ignore */
      }
    }
  }
  return inputPath;
}

module.exports = { transcodeMovToMp4 };
