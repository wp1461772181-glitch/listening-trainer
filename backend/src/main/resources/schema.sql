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

CREATE TABLE IF NOT EXISTS lesson (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    hint TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'drafting',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS lesson_sentence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lesson_id BIGINT NOT NULL,
    sentence_index INT NOT NULL,
    text TEXT NOT NULL,
    audio_path VARCHAR(500),
    voice VARCHAR(10) DEFAULT 'male',
    blanks_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lesson_id (lesson_id)
);

CREATE TABLE IF NOT EXISTS practice_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lesson_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    listen_count INT DEFAULT 0,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id)
);

CREATE TABLE IF NOT EXISTS practice_answer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_id BIGINT NOT NULL,
    sentence_id BIGINT NOT NULL,
    sentence_text TEXT NOT NULL,
    user_answer TEXT,
    blanks_json TEXT,
    INDEX idx_record_id (record_id)
);
