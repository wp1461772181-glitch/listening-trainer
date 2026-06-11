const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  // Test API directly for different sentence indices
  const tokenCmd = `curl -k -s https://127.0.0.1/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"wp1461772181@gmail.com","password":"146177"}'`;

  conn.exec(tokenCmd, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.on('close', () => {
      const token = JSON.parse(out.trim()).token;
      console.log('Got token\n');

      // Test sentence indices 0, 1, 2 for paragraph lesson (lesson 10)
      for (let idx = 0; idx < 5; idx++) {
        conn.exec(`curl -k -s "https://127.0.0.1/api/lessons/10/practice?sentenceIdx=${idx}" -H "Authorization: Bearer ${token}"`, (err, stream) => {
          let cOut = '';
          stream.on('data', d => cOut += d.toString());
          stream.on('close', () => {
            try {
              const resp = JSON.parse(cOut.trim());
              console.log(`[idx=${idx}] text="${resp.sentenceText?.substring(0, 80)}" blanks=${resp.blanks?.length}`);
              console.log(`  blanks: ${JSON.stringify(resp.blanks?.slice(0, 3))}`);
            } catch(e) {
              console.log(`[idx=${idx}] Error: ${cOut.substring(0, 200)}`);
            }
          });
        });
      }

      // Wait then end
      setTimeout(() => { conn.end(); }, 5000);
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
