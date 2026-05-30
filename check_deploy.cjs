const { Client } = require('./node_modules/ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const commands = [
    // Check docker container status
    'docker ps --filter name=listening-trainer --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"',
    // Check audio directory
    'ls -la /var/www/html/listening-trainer/audio/',
    // Check Nginx audio location
    'grep -A 3 "location /audio" /etc/nginx/sites-enabled/default',
    // Check backend health
    'curl -s http://localhost:8080/api/lessons 2>&1 | head -c 200',
    // Check logs for errors
    'docker logs listening-trainer 2>&1 | tail -20',
  ];
  let i = 0;
  function run() {
    if (i >= commands.length) { conn.end(); return; }
    const cmd = commands[i];
    console.log('--- [' + (i+1) + '/' + commands.length + '] ' + cmd.substring(0, 80));
    conn.exec(cmd, (err, stream) => {
      if (err) { console.log('ERR:', err.message); i++; run(); return; }
      let o = '', e = '';
      stream.on('data', (d) => o += d.toString());
      stream.stderr.on('data', (d) => e += d.toString());
      stream.on('close', () => {
        if (o.trim()) console.log(o.trim());
        if (e.trim()) console.log('STDERR:', e.trim().slice(-300));
        i++; run();
      });
    });
  }
  run();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
