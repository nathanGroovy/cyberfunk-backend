-- SQL script to manually create the database and table
-- Run this in MySQL Workbench or command line if needed

CREATE DATABASE IF NOT EXISTS robotron_game;
USE robotron_game;

CREATE TABLE IF NOT EXISTS high_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    level_reached INT NOT NULL,
    date_achieved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_score (score DESC)
);

-- Sample high scores data
INSERT INTO high_scores (player_name, score, level_reached) VALUES
('ROBOT_RON', 15000, 20),
('CYBER_ACE', 12500, 18),
('NEON_KING', 9850, 16),
('PIXEL_WAR', 8720, 15),
('CODE_HERO', 7680, 14),
('RETRO_BOT', 6540, 13),
('ARCADE_X', 5430, 12),
('TECH_NOVA', 4320, 11),
('GAME_OVER', 3210, 10),
('PLAYER_1', 2100, 9);

-- Query to view high scores
SELECT player_name, score, level_reached, date_achieved 
FROM high_scores 
ORDER BY score DESC 
LIMIT 10;
