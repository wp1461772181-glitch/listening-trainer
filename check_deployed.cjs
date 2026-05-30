const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  conn.exec('ls -la /var/www/html/listening-trainer/ && echo "---" && ls -la /var/www/html/listening-trainer/assets/ && echo "---" && head -5 /var/www/html/listening-trainer/index.html', (err, stream) => {
    if (err) { console.error('ERR:', err.message); conn.end(); return; }
    let o = '';
    stream.on('data', (d) => o += d.toString());
    stream.on('close', () => {
      console.log(o);
      conn.end();
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
