const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  const cmds = [
    // Test backend directly
    `curl -sv http://127.0.0.1:8080/api/auth/me -H "Authorization: Bearer fake" 2>&1 | head -30`,
    // Check backend logs
    `docker logs listening-trainer --tail 20 2>&1`,
    // Check if port 8080 is listening
    `ss -tlnp | grep 8080`,
  ];
  let i = 0;
  function run() {
    if (i >= cmds.length) { conn.end(); return; }
    console.log('--- cmd ' + (i+1));
    conn.exec(cmds[i], (err, stream) => {
      if (err) { console.log('ERR:', err.message); i++; run(); return; }
      let o = '', e = '';
      stream.on('data', (d) => o += d.toString());
      stream.stderr.on('data', (d) => e += d.toString());
      stream.on('close', () => {
        console.log(o.trim().slice(-600));
        if (e.trim()) console.log('STDERR:', e.trim().slice(-300));
        console.log('');
        i++; run();
      });
    });
  }
  run();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
