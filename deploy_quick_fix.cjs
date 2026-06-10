const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');

  // Upload the 2 changed files via SFTP
  const files = [
    {
      local: path.join(__dirname, 'backend/src/main/java/com/listeningtrainer/config/SecurityConfig.java'),
      remote: '/root/listening-trainer/backend/src/main/java/com/listeningtrainer/config/SecurityConfig.java'
    },
    {
      local: path.join(__dirname, 'backend/src/main/java/com/listeningtrainer/controller/LessonController.java'),
      remote: '/root/listening-trainer/backend/src/main/java/com/listeningtrainer/controller/LessonController.java'
    }
  ];

  let i = 0;
  function uploadNext() {
    if (i >= files.length) {
      console.log('All files uploaded');
      rebuild();
      return;
    }
    console.log(`Uploading ${path.basename(files[i].local)}...`);
    conn.sftp((err, sftp) => {
      if (err) { console.log('SFTP error:', err); i++; uploadNext(); return; }
      const content = fs.readFileSync(files[i].local);
      sftp.writeFile(files[i].remote, content, (err2) => {
        if (err2) console.log('ERR:', files[i].local, err2.message);
        else console.log('OK:', files[i].local);
        i++;
        uploadNext();
      });
    });
  }

  function rebuild() {
    const cmds = [
      'cd /root/listening-trainer/backend && sed -i "s/jdbc:mysql:\\/\\/localhost:3306/jdbc:mysql:\\/\\/mysql:3306/" src/main/resources/application-mysql.properties 2>&1',
      'cd /root/listening-trainer/backend && docker build -t listening-trainer . 2>&1',
      'docker rm -f listening-trainer 2>&1',
      'docker run -d --name listening-trainer --network app-network -v /var/www/html/listening-trainer/audio:/app/public/audio/lessons -e SPRING_PROFILES_ACTIVE=mysql -e "APP_CORS_ORIGINS=http://localhost:*,https://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://121.40.47.186,https://listening-trainer.cyou,https://listening-trainer-xi.vercel.app,https://*.vercel.app" -p 8080:8080 listening-trainer 2>&1',
    ];
    let j = 0;
    function run() {
      if (j >= cmds.length) {
        console.log('\n--- Waiting for startup... ---');
        setTimeout(verify, 15000);
        return;
      }
      console.log(`[${j + 1}/4] ${cmds[j].substring(0, 80)}`);
      conn.exec(cmds[j], (err, stream) => {
        if (err) { console.log('ERR:', err.message); j++; run(); return; }
        let o = '', e = '';
        stream.on('data', (d) => o += d.toString());
        stream.stderr.on('data', (d) => e += d.toString());
        stream.on('close', () => {
          if (o.trim()) console.log(o.trim().slice(-400));
          if (e.trim()) console.log('STDERR:', e.trim().slice(-150));
          j++;
          run();
        });
      });
    }
    run();
  }

  function verify() {
    console.log('\n--- Verification ---');
    const checks = [
      'docker ps --filter name=listening-trainer --format "{{.Status}}" 2>&1',
      'curl -s http://localhost:8080/api/lessons 2>&1',
      'curl -s http://localhost:8080/api/word-bank/stats 2>&1',
      'docker logs listening-trainer 2>&1 | grep -i "started\|error\|word" | tail -5',
    ];
    let ci = 0;
    function runCheck() {
      if (ci >= checks.length) {
        console.log('\n=== DONE ===');
        console.log('Visit: https://listening-trainer.cyou');
        console.log('Word Bank: https://listening-trainer.cyou/word-bank');
        conn.end();
        return;
      }
      conn.exec(checks[ci], (err, stream) => {
        if (err) { console.log('ERR:', err.message); ci++; runCheck(); return; }
        let o = '';
        stream.on('data', (d) => o += d.toString());
        stream.on('close', () => {
          console.log(`  ${checks[ci].substring(0,50)}: ${o.trim().slice(-150)}`);
          ci++;
          runCheck();
        });
      });
    }
    runCheck();
  }

  uploadNext();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 30000 });
