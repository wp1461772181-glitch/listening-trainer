import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('121.40.47.186', username='root', password='Wp1461772181.')

# Read and fix config
sftp = ssh.open_sftp()
with sftp.file('/root/listening-trainer/backend/src/main/resources/application-mysql.properties', 'r') as f:
    content = f.read().decode().replace('jdbc:mysql://localhost:3306/', 'jdbc:mysql://mysql:3306/')
with sftp.file('/root/listening-trainer/backend/src/main/resources/application-mysql.properties', 'w') as f:
    f.write(content)
sftp.close()
print('Fixed MySQL config')

commands = [
    'docker rm -f listening-trainer',
    'cd /root/listening-trainer/backend && docker build -t listening-trainer .',
    'docker run -d --name listening-trainer --network app-network -e APP_CORS_ORIGINS=http://localhost:*,http://121.40.47.186,http://121.40.47.186:* -e SPRING_PROFILES_ACTIVE=mysql -p 8080:8080 listening-trainer',
]

for cmd in commands:
    print(f'--- Running: {cmd[:80]}... ---')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out[-500:])
    if err:
        print('ERR:', err[-300:])
    print()

time.sleep(10)
stdin, stdout, stderr = ssh.exec_command('docker logs listening-trainer --tail 15 2>&1')
print('=== Logs ===')
print(stdout.read().decode().strip())

# Test API
stdin, stdout, stderr = ssh.exec_command('curl -s -w \"HTTP %{http_code}\" http://localhost:8080/api/lessons 2>&1')
print('Lessons API:', stdout.read().decode().strip()[-100:])

# Test custom lessons API
stdin, stdout, stderr = ssh.exec_command('curl -s -w \"HTTP %{http_code}\" http://localhost:8080/api/custom-lessons 2>&1')
print('Custom Lessons API:', stdout.read().decode().strip())

ssh.close()
