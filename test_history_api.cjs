const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');

  const tokenCmd = `curl -k -s https://127.0.0.1/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"wp1461772181@gmail.com","password":"146177"}'`;

  conn.exec(tokenCmd, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.on('close', () => {
      const token = JSON.parse(out.trim()).token;
      console.log('Got token\n');

      // Test new practice records API
      conn.exec(`curl -k -s https://127.0.0.1/api/lessons/practice/records -H "Authorization: Bearer ${token}"`, (err, stream) => {
        let cOut = '';
        stream.on('data', d => cOut += d.toString());
        stream.on('close', () => {
          console.log('Practice Records API:', cOut.trim().substring(0, 500));
          conn.end();
        });
      });
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
