const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  const cmds = [
    // Fix git: clean up conflicting files and pull java branch properly
    'cd /root/listening-trainer && git checkout -- . 2>&1',
    'cd /root/listening-trainer && git clean -fd 2>&1',
    'cd /root/listening-trainer && git checkout java 2>&1',
    'cd /root/listening-trainer && git pull origin java 2>&1',
    // Fix MySQL config
    'cd /root/listening-trainer/backend && sed -i "s/jdbc:mysql:\\/\\/localhost:3306/jdbc:mysql:\\/\\/mysql:3306/" src/main/resources/application-mysql.properties 2>&1',
    // Rebuild docker
    'cd /root/listening-trainer/backend && docker build -t listening-trainer . 2>&1',
    'docker rm -f listening-trainer 2>&1',
    'docker run -d --name listening-trainer --network app-network -v /var/www/html/listening-trainer/audio:/app/public/audio/lessons -e SPRING_PROFILES_ACTIVE=mysql -e "APP_CORS_ORIGINS=http://localhost:*,https://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://121.40.47.186,https://listening-trainer.cyou,https://listening-trainer-xi.vercel.app,https://*.vercel.app" -p 8080:8080 listening-trainer 2>&1',
  ];
  let i = 0;
  function run() {
    if (i >= cmds.length) {
      console.log('\n--- Waiting for startup... ---');
      setTimeout(verify, 15000);
      return;
    }
    console.log(`[${i + 1}/${cmds.length}] ${cmds[i].substring(0, 90)}`);
    conn.exec(cmds[i], (err, stream) => {
      if (err) { console.log('ERR:', err.message); i++; run(); return; }
      let o = '', e = '';
      stream.on('data', (d) => o += d.toString());
      stream.stderr.on('data', (d) => e += d.toString());
      stream.on('close', () => {
        if (o.trim()) console.log(o.trim().slice(-500));
        if (e.trim()) console.log('STDERR:', e.trim().slice(-200));
        i++;
        run();
      });
    });
  }
  run();

  function verify() {
    console.log('\n--- Verifying ---');
    const checks = [
      'docker ps --filter name=listening-trainer --format "{{.Status}}" 2>&1',
      'curl -s http://localhost:8080/api/lessons 2>&1 | head -c 200',
      'curl -s http://localhost:8080/api/word-bank/stats 2>&1',
      'curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:80/ 2>&1',
    ];
    let ci = 0;
    function runCheck() {
      if (ci >= checks.length) {
        console.log('\n=== DONE ===');
        conn.end();
        return;
      }
      conn.exec(checks[ci], (err, stream) => {
        if (err) { console.log('ERR:', err.message); ci++; runCheck(); return; }
        let o = '';
        stream.on('data', (d) => o += d.toString());
        stream.on('close', () => {
          console.log(`  ${checks[ci].substring(0, 60)}: ${o.trim().slice(-150)}`);
          ci++;
          runCheck();
        });
      });
    }
    runCheck();
  }
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 30000 });
