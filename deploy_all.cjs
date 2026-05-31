const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '121.40.47.186';
const USER = 'root';
const PASSWORD = 'Wp1461772181.';
const REMOTE_DIR = '/root/listening-trainer';
const FRONTEND_REMOTE = '/var/www/html/listening-trainer';
const DIST_DIR = path.join(__dirname, 'dist');

// Phase 1: Build frontend
console.log('=== Phase 1: Building frontend ===');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Frontend build OK');
} catch (e) {
  console.error('Frontend build FAILED');
  process.exit(1);
}

// Phase 2: Upload frontend dist via SFTP
console.log('\n=== Phase 2: Uploading frontend ===');

function walk(dir, base = '') {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(full, path.posix.join(base, entry.name)));
    } else {
      files.push(path.posix.join(base, entry.name));
    }
  }
  return files;
}

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');

  // Step 1: Backend - git pull + docker rebuild
  console.log('\n=== Phase 3: Deploying backend ===');
  const backendCmds = [
    `cd ${REMOTE_DIR} && git stash 2>&1`,
    `cd ${REMOTE_DIR} && git pull origin java 2>&1`,
    `cd ${REMOTE_DIR}/backend && sed -i 's/jdbc:mysql:\\/\\/localhost:3306/jdbc:mysql:\\/\\/mysql:3306/' src/main/resources/application-mysql.properties 2>&1`,
    `cd ${REMOTE_DIR}/backend && docker build --no-cache -t listening-trainer . 2>&1`,
    `docker rm -f listening-trainer 2>&1`,
    `docker run -d --name listening-trainer --network app-network -v /var/www/html/listening-trainer/audio:/app/public/audio/lessons -e SPRING_PROFILES_ACTIVE=mysql -e "APP_CORS_ORIGINS=http://localhost:*,https://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://121.40.47.186,https://listening-trainer.cyou,https://listening-trainer-xi.vercel.app,https://*.vercel.app" -p 8080:8080 listening-trainer 2>&1`,
  ];
  let bi = 0;
  function runBackend() {
    if (bi >= backendCmds.length) {
      console.log('Backend deploy done');
      uploadFrontend();
      return;
    }
    const cmd = backendCmds[bi];
    console.log(`  [${bi + 1}/${backendCmds.length}] ${cmd.substring(0, 90)}...`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.log('  ERR:', err.message); bi++; runBackend(); return; }
      let o = '', e = '';
      stream.on('data', (d) => o += d.toString());
      stream.stderr.on('data', (d) => e += d.toString());
      stream.on('close', () => {
        if (o.trim()) console.log(o.trim().slice(-400));
        if (e.trim()) console.log('  STDERR:', e.trim().slice(-200));
        bi++;
        runBackend();
      });
    });
  }
  runBackend();

  function uploadFrontend() {
    console.log('\n=== Phase 4: Uploading frontend ===');
    conn.exec(`cd ${FRONTEND_REMOTE} && { [ -d audio ] && mv audio /tmp/.lt-audio-backup; true; } && rm -rf ${FRONTEND_REMOTE} && mkdir -p ${FRONTEND_REMOTE} && [ -d /tmp/.lt-audio-backup ] && mv /tmp/.lt-audio-backup ${FRONTEND_REMOTE}/audio; true`, (err) => {
      if (err) console.log('  mkdir error (may be OK):', err.message);
      console.log('  Remote dir prepared');
      conn.sftp((err, sftp) => {
        if (err) { console.error('SFTP failed:', err); conn.end(); return; }
        const files = walk(DIST_DIR);
        let fi = 0;
        function uploadNext() {
          if (fi >= files.length) {
            console.log(`\n  DONE - ${files.length} files uploaded`);
            console.log('\n=== Verifying ===');
            verifyAndDone();
            return;
          }
          const rel = files[fi];
          const localFile = path.join(DIST_DIR, rel);
          const remoteFile = path.posix.join(FRONTEND_REMOTE, rel);
          const remoteDir = path.posix.dirname(remoteFile);
          sftp.mkdir(remoteDir, { recursive: true }, () => {
            const rs = fs.createReadStream(localFile);
            const ws = sftp.createWriteStream(remoteFile);
            ws.on('close', () => {
              process.stdout.write(`\r  [${fi + 1}/${files.length}] ${rel}`);
              fi++;
              uploadNext();
            });
            ws.on('error', () => {
              console.error(`\n  Failed: ${rel}`);
              fi++;
              uploadNext();
            });
            rs.pipe(ws);
          });
        }
        uploadNext();
      });
    });
  }

  function verifyAndDone() {
    const checks = [
      'curl -s -w " HTTP %{http_code}" http://localhost:8080/api/lessons 2>&1',
      'curl -s -w " HTTP %{http_code}" http://localhost:8080/api/word-bank/stats 2>&1',
      'curl -s -w " HTTP %{http_code}" -o /dev/null http://localhost:80/ 2>&1',
    ];
    let ci = 0;
    function runCheck() {
      if (ci >= checks.length) {
        console.log('\n=== DEPLOY COMPLETE ===');
        console.log('URL: https://listening-trainer.cyou');
        console.log('Word Bank: https://listening-trainer.cyou/word-bank');
        conn.end();
        return;
      }
      const cmd = checks[ci];
      console.log(`  Check: ${cmd.substring(0, 70)}`);
      conn.exec(cmd, (err, stream) => {
        if (err) { console.log('  ERR:', err.message); ci++; runCheck(); return; }
        let o = '';
        stream.on('data', (d) => o += d.toString());
        stream.on('close', () => {
          console.log('  ' + o.trim().slice(-100));
          ci++;
          runCheck();
        });
      });
    }
    runCheck();
  }
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: HOST, port: 22, username: USER, password: PASSWORD, readyTimeout: 30000 });
