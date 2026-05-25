import paramiko
import time

HOST = "121.40.47.186"
USER = "root"
PASSWORD = "Wp1461772181."

LOCAL_BASE = r"D:\listening-trainer\backend\src\main"
REMOTE_BASE = "/root/listening-trainer/backend/src/main"

FILES = [
    r"java\com\listeningtrainer\entity\UserProgress.java",
    r"java\com\listeningtrainer\entity\UserProgressSummary.java",
    r"java\com\listeningtrainer\mapper\UserProgressSummaryMapper.java",
    r"java\com\listeningtrainer\dto\ProgressHistoryResponse.java",
    r"java\com\listeningtrainer\service\ProgressService.java",
    r"java\com\listeningtrainer\controller\ProgressController.java",
    r"resources\schema.sql",
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD)

# 1. Upload backend source files
sftp = ssh.open_sftp()
for f in FILES:
    local = f"{LOCAL_BASE}\\{f}"
    remote = f"{REMOTE_BASE}/{f.replace(chr(92), '/')}"
    print(f"Uploading {f} ...")
    sftp.put(local, remote)
sftp.close()
print("Backend files uploaded.\n")

# 2. Fix MySQL config (localhost -> mysql)
sftp = ssh.open_sftp()
with sftp.file('/root/listening-trainer/backend/src/main/resources/application-mysql.properties', 'r') as fp:
    content = fp.read().decode().replace('jdbc:mysql://localhost:3306/', 'jdbc:mysql://mysql:3306/')
with sftp.file('/root/listening-trainer/backend/src/main/resources/application-mysql.properties', 'w') as fp:
    fp.write(content)
sftp.close()
print('Fixed MySQL config.\n')

# 3. Write migration SQL to server and execute
migration_sql = """ALTER TABLE user_progress DROP INDEX uk_user_lesson;
ALTER TABLE user_progress ADD INDEX idx_user_id (user_id);
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
INSERT IGNORE INTO user_progress_summary (user_id, lesson_id, latest_score, best_score, total_attempts, last_date)
SELECT user_id, lesson_id, score, best_score, attempts, date FROM user_progress;
ALTER TABLE user_progress DROP COLUMN attempts;
ALTER TABLE user_progress DROP COLUMN best_score;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/migration.sql', 'w') as fp:
    fp.write(migration_sql)
sftp.close()

print('Running DB migration...')
stdin, stdout, stderr = ssh.exec_command(
    "docker exec -i mysql mysql -uroot -pWp1461772181. listening_trainer < /tmp/migration.sql 2>&1"
)
out = stdout.read().decode()
err = stderr.read().decode()
if err:
    print(f"Migration ERR (may be harmless if columns already dropped): {err[:300]}")
if out:
    print(out)
print('DB migration done.\n')

# 4. Rebuild and restart backend
print('--- Rebuilding backend ---')
commands = [
    'docker rm -f listening-trainer',
    'cd /root/listening-trainer/backend && docker build -t listening-trainer .',
    'docker run -d --name listening-trainer --network app-network -e APP_CORS_ORIGINS=http://localhost:*,http://121.40.47.186,http://121.40.47.186:* -e SPRING_PROFILES_ACTIVE=mysql -p 8080:8080 listening-trainer',
]

for cmd in commands:
    print(f'--- {cmd[:70]}... ---')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out[-300:])
    if err:
        print('ERR:', err[-200:])
    print()

print('Waiting for startup...')
time.sleep(15)

print('=== Container Logs ===')
stdin, stdout, stderr = ssh.exec_command('docker logs listening-trainer --tail 20 2>&1')
print(stdout.read().decode().strip())

print('\n=== API Tests ===')
stdin, stdout, stderr = ssh.exec_command('curl -s -w " HTTP %{http_code}" http://localhost:8080/api/lessons 2>&1')
print('Lessons:', stdout.read().decode().strip()[-80:])
stdin, stdout, stderr = ssh.exec_command('curl -s -w " HTTP %{http_code}" http://localhost:8080/api/progress/history 2>&1')
print('History:', stdout.read().decode().strip())

ssh.close()
print('\nAll done!')
