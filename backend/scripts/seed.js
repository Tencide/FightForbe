/**
 * Seed demo accounts (run after schema.sql).
 * Usage: node scripts/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const DEMO_PASSWORD = 'Password123!';

async function main() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [admins] = await pool.query("SELECT id FROM users WHERE email = 'admin@fightforge.test'");
  if (!admins.length) {
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')`,
      ['admin@fightforge.test', hash, 'FightForge Admin']
    );
  }

  const [coaches] = await pool.query("SELECT id FROM users WHERE email = 'coach@fightforge.test'");
  let coachId;
  if (!coaches.length) {
    const [r] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'coach')`,
      ['coach@fightforge.test', hash, 'Demo Coach']
    );
    coachId = r.insertId;
  } else {
    coachId = coaches[0].id;
  }

  const [athletes] = await pool.query("SELECT id FROM users WHERE email = 'athlete@fightforge.test'");
  if (!athletes.length) {
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, coach_id) VALUES (?, ?, ?, 'athlete', ?)`,
      ['athlete@fightforge.test', hash, 'Demo Athlete', coachId]
    );
  } else {
    await pool.query('UPDATE users SET coach_id = ? WHERE email = ?', [coachId, 'athlete@fightforge.test']);
  }

  const [athleteRows] = await pool.query(
    "SELECT id FROM users WHERE email = 'athlete@fightforge.test' LIMIT 1"
  );
  const aid = athleteRows[0].id;

  const [wc] = await pool.query('SELECT COUNT(*) AS c FROM workouts WHERE athlete_id = ?', [aid]);
  if (wc[0].c === 0) {
    await pool.query(
      `INSERT INTO workouts (title, description, content, video_url, athlete_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'Striking — Week 1',
        'Bag work and footwork',
        '- 10 min jump rope\n- 4x3 min heavy bag\n- 3 rounds shadow boxing',
        // Replace with any MMA / boxing tutorial URL you like — supports
        // youtube.com/watch?v=, youtu.be/, embed URLs, or just the raw video ID.
        'https://www.youtube.com/watch?v=BlS3gkEOZdo',
        aid,
        coachId,
      ]
    );
  }

  const [pc] = await pool.query('SELECT COUNT(*) AS c FROM progress_entries WHERE user_id = ?', [aid]);
  if (pc[0].c === 0) {
    const points = [
      { offset: 28, weight: 192.0, bench: 215, squat: 295, cardio: 25, notes: 'Cut started' },
      { offset: 21, weight: 190.5, bench: 220, squat: 305, cardio: 28, notes: '' },
      { offset: 14, weight: 188.0, bench: 220, squat: 310, cardio: 30, notes: 'Felt strong' },
      { offset: 7, weight: 186.5, bench: 225, squat: 315, cardio: 30, notes: '' },
      { offset: 0, weight: 185.0, bench: 225, squat: 315, cardio: 30, notes: 'Baseline entry from seed' },
    ];
    for (const p of points) {
      await pool.query(
        `INSERT INTO progress_entries
          (user_id, weight_lb, bench_press_lb, squat_lb, cardio_minutes, notes, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY))`,
        [aid, p.weight, p.bench, p.squat, p.cardio, p.notes || null, p.offset]
      );
    }
  }

  const [mc] = await pool.query('SELECT COUNT(*) AS c FROM meals WHERE athlete_id = ?', [aid]);
  if (mc[0].c === 0) {
    await pool.query(
      `INSERT INTO meals
        (title, description, athlete_id, created_by, target_calories, protein_g, carbs_g, fat_g, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Fight week — cut',
        'Lean protein + complex carbs, low sodium during weight cut',
        aid,
        coachId,
        2400,
        220,
        240,
        70,
        'Drop carbs to 150g 48h before weigh-in. Hydrate aggressively until 24h out.',
      ]
    );
  }

  const [msgc] = await pool.query(
    'SELECT COUNT(*) AS c FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)',
    [coachId, aid, aid, coachId]
  );
  if (msgc[0].c === 0) {
    await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, body, created_at) VALUES
       (?, ?, ?, DATE_SUB(NOW(), INTERVAL 2 DAY)),
       (?, ?, ?, DATE_SUB(NOW(), INTERVAL 1 DAY)),
       (?, ?, ?, DATE_SUB(NOW(), INTERVAL 3 HOUR))`,
      [
        coachId, aid, "Welcome to the camp. Let's start with the Striking — Week 1 plan.",
        aid, coachId, 'Got it coach. Hit it this morning, feeling sharp.',
        coachId, aid, "Nice. Make sure you log progress today — eyeing your bench for next session.",
      ]
    );
  }

  console.log('Seed complete. Demo password for all demo accounts:', DEMO_PASSWORD);
  console.log('  admin@fightforge.test (admin)');
  console.log('  coach@fightforge.test (coach)');
  console.log('  athlete@fightforge.test (athlete, assigned to coach)');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
