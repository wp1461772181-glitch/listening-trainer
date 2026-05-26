CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lesson_id VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS user_progress_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lesson_id VARCHAR(50) NOT NULL,
    latest_score INT NOT NULL DEFAULT 0,
    best_score INT NOT NULL DEFAULT 0,
    total_attempts INT NOT NULL DEFAULT 1,
    last_date DATE NOT NULL,
    UNIQUE KEY uk_user_lesson (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS practice_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    progress_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    lesson_id VARCHAR(50) NOT NULL,
    keywords TEXT,
    reconstruction TEXT,
    diff_json TEXT,
    listen_count INT DEFAULT 0,
    score INT NOT NULL,
    created_at DATE NOT NULL,
    INDEX idx_progress_id (progress_id),
    INDEX idx_user_lesson (user_id, lesson_id)
);
