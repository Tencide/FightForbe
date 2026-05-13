-- Run once on existing MySQL databases (any host) before enabling Firebase Auth.
-- New installs: use schema.sql or schema.single_mysql_database.sql which already include firebase_uid.

ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) NULL AFTER email;
CREATE UNIQUE INDEX idx_users_firebase_uid ON users (firebase_uid);
