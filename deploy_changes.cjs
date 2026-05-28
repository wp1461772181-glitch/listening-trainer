const { Client } = require('./node_modules/ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const commands = [
    'cd /root/listening-trainer && git stash && git pull origin java 2>&1',
    'cd /root/listening-trainer && sed -i "s/jdbc:mysql:\\/\\/localhost:3306/jdbc:mysql:\\/\\/mysql:3306/" backend/src/main/resources/application-mysql.properties 2>&1',
    'cd /root/listening-trainer && mkdir -p audio-data 2>&1',
    'cd /root/listening-trainer/backend && docker build -t listening-trainer . 2>&1',
    'docker rm -f listening-trainer 2>&1',
    'docker run -d --name listening-trainer --network app-network -v /root/listening-trainer/audio-data:/app/public/audio/lessons -e SPRING_PROFILES_ACTIVE=mysql -e "APP_CORS_ORIGINS=http://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://listening-trainer-xi.vercel.app,https://*.vercel.app" -p 8080:8080 listening-trainer 2>&1',
  ];
  let i = 0;
  function run() {
    if (i >= commands.length) { console.log('DONE'); conn.end(); return; }
    const cmd = commands[i];
    console.log('--- [' + (i+1) + '/' + commands.length + '] ' + cmd.substring(0, 80));
    conn.exec(cmd, (err, stream) => {
      if (err) { console.log('ERR:', err.message); i++; run(); return; }
      let o = '', e = '';
      stream.on('data', (d) => o += d.toString());
      stream.stderr.on('data', (d) => e += d.toString());
      stream.on('close', () => {
        if (o.trim()) console.log(o.trim().slice(-500));
        if (e.trim()) console.log('STDERR:', e.trim().slice(-300));
        i++; run();
      });
    });
  }
  run();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
