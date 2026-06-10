const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  // Test paragraph lesson
  const text = `Welcome to today's lecture on renewable energy. Renewable energy comes from natural sources that are constantly replenished, such as sunlight, wind, and water. Unlike fossil fuels, which will eventually run out, renewable energy sources are sustainable.`;
  const payload = JSON.stringify({
    title: 'Test Paragraph',
    difficulty: 'academic',
    hint: '',
    text: text,
    voice: 'female',
    mode: 'paragraph'
  }).replace(/"/g, '\\"');

  const tokenCmd = `curl -k -s https://121.40.47.186/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"wp1461772181@gmail.com","password":"146177"}'`;

  conn.exec(tokenCmd, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.on('close', () => {
      const token = JSON.parse(out.trim()).token;

      conn.exec(`curl -k -s https://121.40.47.186/api/lessons -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d "${payload}"`, (err, stream) => {
        let cOut = '';
        stream.on('data', d => cOut += d.toString());
        stream.on('close', () => {
          const resp = JSON.parse(cOut.trim());
          console.log(`Paragraph lesson ${resp.id}, ${resp.sentences?.length} sentences`);
          resp.sentences?.forEach(s => {
            console.log(`  [${s.index}] "${s.text.substring(0, 60)}..."`);
            console.log(`      blanks: ${s.blanks?.map(b => b.word).join(', ')}`);
          });

          // Generate audio
          conn.exec(`curl -k -s -X POST https://121.40.47.186/api/lessons/${resp.id}/generate -H "Authorization: Bearer ${token}"`, (err, stream) => {
            let gOut = '';
            stream.on('data', d => gOut += d.toString());
            stream.stderr.on('data', d => gOut += d.toString());
            stream.on('close', () => {
              const gen = JSON.parse(gOut.trim());
              console.log(`\nStatus: ${gen.status}`);
              console.log(`Voices: ${gen.sentences?.map(s => s.voice).join(',')}`);
              gen.sentences?.forEach(s => {
                console.log(`  [${s.index}] voice=${s.voice}, audio=${s.audioPath || 'null'}`);
              });
              conn.end();
            });
          }, { timeout: 120000 });
        });
      });
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
