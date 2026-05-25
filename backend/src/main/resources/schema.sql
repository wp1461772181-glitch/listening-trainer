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
    attempts INT NOT NULL DEFAULT 1,
    best_score INT NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    UNIQUE KEY uk_user_lesson (user_id, lesson_id)
);
