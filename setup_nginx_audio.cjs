#!/usr/bin/env node
// Run once on ECS: configure Nginx for /audio/, migrate old audio files
const { Client } = require('./node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const commands = [
    // 1. Create audio directory
    'mkdir -p /var/www/html/listening-trainer/audio',
    // 2. Copy old audio files to new location
    '[ -d /root/listening-trainer/audio-data ] && cp -r /root/listening-trainer/audio-data/* /var/www/html/listening-trainer/audio/ 2>/dev/null; echo "Audio migrated"',
    // 3. Add /audio/ location to Nginx if not already present
    `grep -q 'location /audio/' /etc/nginx/sites-enabled/default || sed -i '/proxy_pass.*8080/i\\    location /audio/ {\\n        alias /var/www/html/listening-trainer/audio/;\\n        expires 30d;\\n        add_header Cache-Control "public, immutable";\\n    }' /etc/nginx/sites-enabled/default`,
    // 4. Test and reload Nginx
    'nginx -t && nginx -s reload && echo "Nginx reloaded" || echo "Nginx reload failed"',
  ];
  let i = 0;
  function run() {
    if (i >= commands.length) { console.log('SETUP DONE'); conn.end(); return; }
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
