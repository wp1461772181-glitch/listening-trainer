const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  // Test via nginx with correct Host header
  const cmds = [
    `curl -sv -X POST http://127.0.0.1/api/auth/login -H "Host: listening-trainer.cyou" -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}' 2>&1`,
    `curl -sv -X POST https://127.0.0.1/api/auth/login -H "Host: listening-trainer.cyou" -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}' --insecure 2>&1`,
  ];
  let i = 0;
  function run() {
    if (i >= cmds.length) { conn.end(); return; }
    console.log('--- cmd ' + (i+1));
    conn.exec(cmds[i], (err, stream) => {
      if (err) { console.log('ERR:', err.message); i++; run(); return; }
      let e = '';
      stream.on('data', (d) => process.stdout.write(d.toString()));
      stream.stderr.on('data', (d) => e += d.toString());
      stream.on('close', () => {
        console.log('\nSTDERR:', e.trim().slice(-600));
        console.log('');
        i++; run();
      });
    });
  }
  run();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
