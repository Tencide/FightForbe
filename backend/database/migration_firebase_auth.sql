-- Run once on existing MySQL databases (Railway, local, etc.) before enabling Firebase Auth.
-- New installs: use schema.sql / schema.railway.sql which already include firebase_uid.

ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) NULL AFTER email;
CREATE UNIQUE INDEX idx_users_firebase_uid ON users (firebase_uid);
