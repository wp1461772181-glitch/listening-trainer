const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  // Check CORS headers from nginx
  conn.exec(`curl -sv -X OPTIONS https://localhost/api/auth/login \\
    -H "Origin: https://listening-trainer.cyou" \\
    -H "Access-Control-Request-Method: POST" \\
    -H "Access-Control-Request-Headers: content-type" \\
    --insecure 2>&1`, (err, stream) => {
    if (err) { console.error('ERR:', err.message); conn.end(); return; }
    let e = '';
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => e += d.toString());
    stream.on('close', () => {
      console.log('\nSTDERR:', e.trim().slice(-800));
      conn.end();
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
