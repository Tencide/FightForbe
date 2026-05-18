-- Run on existing defaultdb (Aiven / production) after initial schema.
-- mysqlsh / Workbench: USE defaultdb; then source this file.

USE defaultdb;

CREATE TABLE IF NOT EXISTS reels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id INT UNSIGNED NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  video_kind ENUM('youtube', 'direct', 'link') NOT NULL DEFAULT 'link',
  caption VARCHAR(500) DEFAULT NULL,
  sport ENUM('mma', 'boxing', 'bjj', 'kickboxing', 'wrestling', 'muay_thai', 'general') NOT NULL DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reels_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reel_likes (
  reel_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reel_id, user_id),
  CONSTRAINT fk_reel_likes_reel FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
  CONSTRAINT fk_reel_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_reels_created ON reels(created_at DESC);
CREATE INDEX idx_reels_sport ON reels(sport);
