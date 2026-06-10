const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  // Create a fresh dialogue lesson to test blank positions
  const tokenCmd = `curl -k -s https://127.0.0.1/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"wp1461772181@gmail.com","password":"146177"}'`;

  conn.exec(tokenCmd, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.on('close', () => {
      const token = JSON.parse(out.trim()).token;
      console.log('Got token');

      // Create dialogue lesson
      const payload = JSON.stringify({
        title: 'Test Dialogue Blanks',
        difficulty: 'daily',
        hint: '',
        text: 'Customer: Hi, can I get a latte, please?\nBarista: Sure! What size would you like?\nCustomer: Medium, please.\nBarista: Here you go.',
        voice: 'male',
        mode: 'dialogue'
      }).replace(/"/g, '\\"');

      conn.exec(`curl -k -s https://127.0.0.1/api/lessons -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d "${payload}"`, (err, stream) => {
        let cOut = '';
        stream.on('data', d => cOut += d.toString());
        stream.on('close', () => {
          const resp = JSON.parse(cOut.trim());
          console.log(`Lesson ${resp.id}: ${resp.sentences?.length} sentences`);
          resp.sentences?.forEach(s => {
            console.log(`\n  [${s.index}] "${s.text}"`);
            console.log(`    blanks:`, JSON.stringify(s.blanks));
            // Verify positions are accurate
            if (s.blanks) {
              s.blanks.forEach(b => {
                const extracted = s.text.substring(b.position, b.position + b.length);
                console.log(`      position=${b.position}, length=${b.length} -> "${extracted}" (should be "${b.word}")`);
              });
            }
          });

          // Now generate audio
          console.log('\nGenerating audio...');
          conn.exec(`curl -k -s -X POST https://127.0.0.1/api/lessons/${resp.id}/generate -H "Authorization: Bearer ${token}"`, (err, stream) => {
            let gOut = '';
            stream.on('data', d => gOut += d.toString());
            stream.stderr.on('data', d => gOut += d.toString());
            stream.on('close', () => {
              try {
                const gen = JSON.parse(gOut.trim());
                console.log(`Status: ${gen.status}`);
                gen.sentences?.forEach(s => {
                  console.log(`  [${s.index}] voice=${s.voice}, audio=${s.audioPath || 'null'}`);
                });
              } catch(e) {
                console.log('Generate response:', gOut.substring(0, 500));
              }
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
