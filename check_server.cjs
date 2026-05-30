const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  const commands = [
    'echo "=== NGINX STATUS ===" && systemctl status nginx --no-pager -l 2>&1 | tail -5',
    'echo "=== NGINX CONFIG ===" && cat /etc/nginx/sites-enabled/default 2>&1',
    'echo "=== DOCKER CONTAINERS ===" && docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1',
    'echo "=== CURL LOCALHOST ===" && curl -s http://localhost:8080/api/auth/me -H "Authorization: Bearer fake" 2>&1 | head -5',
    'echo "=== CURL BACKEND ===" && curl -s http://127.0.0.1:8080/api/auth/me -H "Authorization: Bearer fake" 2>&1 | head -5',
  ];
  let i = 0;
  function run() {
    if (i >= commands.length) { console.log('DONE'); conn.end(); return; }
    const cmd = commands[i];
    console.log('--- ' + cmd.split('\n')[0].substring(0, 80));
    conn.exec(cmd, (err, stream) => {
      if (err) { console.log('ERR:', err.message); i++; run(); return; }
      let o = '';
      stream.on('data', (d) => o += d.toString());
      stream.on('close', () => {
        console.log(o.trim().slice(-800));
        console.log('');
        i++; run();
      });
    });
  }
  run();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
