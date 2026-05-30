const { Client } = require('./node_modules/ssh2');

const API = 'https://121.40.47.186';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');

  // Get a fresh token first
  conn.exec(`curl -k -s ${API}/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"wp1461772181@gmail.com","password":"146177"}'`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.on('close', () => {
      try {
        const login = JSON.parse(out.trim());
        const token = login.token;
        console.log('Got token');

        // Test practice endpoint
        conn.exec(`curl -k -s -D- -w "\nHTTP:%{http_code}\n" ${API}/api/lessons/4/practice?sentenceIdx=0 -H "Authorization: Bearer ${token}" 2>&1`, (err, stream) => {
          let out2 = '';
          stream.on('data', d => out2 += d.toString());
          stream.stderr.on('data', d => out2 += d.toString());
          stream.on('close', () => {
            console.log(out2);

            // Also test without auth
            conn.exec(`curl -k -s -w "\nHTTP:%{http_code}\n" ${API}/api/lessons/4/practice?sentenceIdx=0 2>&1`, (err, stream) => {
              let out3 = '';
              stream.on('data', d => out3 += d.toString());
              stream.on('close', () => {
                console.log('Without auth:', out3);
                conn.end();
              });
            });
          });
        });
      } catch(e) {
        console.log('Parse error:', e.message, out);
        conn.end();
      }
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
