const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  conn.exec(`curl -k -s http://127.0.0.1:8080/api/lessons -X POST -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiIyIiwiZW1haWwiOiJ3cDE0NjE3NzIxODFAZ21haWwuY29tIiwiaWF0IjoxNzgwMTE0NjcxLCJleHAiOjE3ODA3MTk0NzF9.xYPRrE4S58SBGv7Cm_UEwqiTAxUjbhyyG9Io9coIlJCd21icijz5UQ49bU_jwj6f" -d '{"title":"Test","difficulty":"daily","hint":"","text":"Customer: Hi, can I get a latte, please?\\nBarista: Sure!","voice":"male","mode":"dialogue"}'`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.on('close', () => {
      console.log(JSON.stringify(JSON.parse(out), null, 2).slice(0, 3000));
      conn.end();
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
