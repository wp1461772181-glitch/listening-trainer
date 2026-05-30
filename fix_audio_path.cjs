const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  conn.exec(`
    echo "=== Files ===" &&
    ls /var/www/html/listening-trainer/audio/4/ &&
    echo "=== Fix Nginx ===" &&
    sed -i 's|location /audio/ {|location /audio/lessons/ {|g' /etc/nginx/sites-enabled/default &&
    cat /etc/nginx/sites-enabled/default | grep -A3 "audio/lessons" &&
    nginx -t 2>&1 &&
    nginx -s reload &&
    echo "Nginx reloaded"
  `, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => out += d.toString());
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
