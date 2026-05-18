/**
 * Convert existing reel files (.mov / .webm) to H.264 MP4 and update DB URLs.
 * Run on Fly: fly ssh console -a fightforge-api -C "node scripts/transcode-reels.js"
 */
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env.fly' });
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { mediaPathForFilename } = require('../lib/reelUploads');
const { ensurePlaybackMp4 } = require('../lib/transcode');

async function main() {
  const [rows] = await pool.query(
    `SELECT id, video_url FROM reels
     WHERE video_kind = 'direct'
       AND (video_url LIKE '%.mov' OR video_url LIKE '%.webm' OR video_url LIKE '%.m4v')`
  );
  console.log(`Found ${rows.length} reel(s) to convert`);

  for (const row of rows) {
    const m = String(row.video_url).match(/\/([^/]+\.(mov|webm|m4v|mp4))$/i);
    if (!m) continue;
    const name = m[1];
    const disk = mediaPathForFilename(name);
    if (!fs.existsSync(disk)) {
      console.warn('Missing file:', disk);
      continue;
    }
    const out = await ensurePlaybackMp4(disk);
    const newName = path.basename(out);
    const newUrl = row.video_url.replace(/\/[^/]+$/, `/${newName}`);
    if (newUrl !== row.video_url) {
      await pool.query('UPDATE reels SET video_url = ? WHERE id = ?', [newUrl, row.id]);
    }
    console.log(`Reel ${row.id}: ${name} → ${newName}`);
  }

  await pool.end();
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
