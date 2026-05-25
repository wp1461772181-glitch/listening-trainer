import paramiko
import os
import tarfile
import sys

HOST = "121.40.47.186"
USER = "root"
PASSWORD = "Wp1461772181."
LOCAL_DIST = r"D:\listening-trainer\dist"
REMOTE_DIR = "/var/www/html/listening-trainer"
TAR_PATH = r"D:\listening-trainer\dist.tar.gz"

# Package dist folder
print("Packaging dist...")
with tarfile.open(TAR_PATH, "w:gz") as tar:
    for root, dirs, files in os.walk(LOCAL_DIST):
        for f in files:
            full = os.path.join(root, f)
            arcname = os.path.relpath(full, LOCAL_DIST)
            tar.add(full, arcname)
print(f"Created {TAR_PATH} ({os.path.getsize(TAR_PATH)} bytes)")

# Upload
print(f"Connecting to {HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD)

sftp = ssh.open_sftp()
print("Uploading...")
sftp.put(TAR_PATH, "/tmp/dist.tar.gz")
sftp.close()

# Extract
print("Extracting on server...")
commands = [
    f"rm -rf {REMOTE_DIR}/*",
    f"tar -xzf /tmp/dist.tar.gz -C {REMOTE_DIR}",
    "chown -R www-data:www-data /var/www/html/listening-trainer",
    "rm /tmp/dist.tar.gz",
]
for cmd in commands:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if err:
        print(f"ERR [{cmd}]: {err}")

ssh.close()

# Cleanup
os.remove(TAR_PATH)
print("Deploy done!")
