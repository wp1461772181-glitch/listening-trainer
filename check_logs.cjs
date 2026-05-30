const { Client } = require('./node_modules/ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  conn.exec('docker logs listening-trainer 2>&1 | head -80', (err, stream) => {
    let o = '', e = '';
    stream.on('data', (d) => o += d.toString());
    stream.stderr.on('data', (d) => e += d.toString());
    stream.on('close', () => {
      console.log('=== STDOUT ===');
      if (o.trim()) console.log(o.trim());
      console.log('=== STDERR ===');
      if (e.trim()) console.log(e.trim());
      conn.end();
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
