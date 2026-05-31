const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec(`curl -s -X POST -H "Content-Type: application/json" \\
    -d '{"email":"wp1461772181@gmail.com","password":"146177"}' \\
    http://localhost:8080/api/auth/login | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))"`, (err, stream) => {
    let token = '';
    stream.on('data', d => { token += d.toString(); });
    stream.on('close', () => {
      token = token.trim();
      c.exec(`curl -s -H "Authorization: Bearer ${token}" http://localhost:8080/api/lessons/33`, (err2, stream2) => {
        let body = '';
        stream2.on('data', d => { body += d.toString(); });
        stream2.on('close', () => {
          const l = JSON.parse(body);
          let totalBlanks = 0;
          let sentencesWithBlanks = 0;
          console.log('=== Sentences with blanks ===');
          for (const s of l.sentences || []) {
            const b = s.blanks || [];
            if (b.length > 0) {
              sentencesWithBlanks++;
              totalBlanks += b.length;
              const words = b.map(x => x.word);
              console.log(`  idx=${String(s.index).padStart(2)} blanks=${b.length} words=${JSON.stringify(words)}  text=${(s.text||'').substring(0,60)}`);
            }
          }
          console.log(`\nTotal sentences: ${l.sentences?.length || 0}`);
          console.log(`Sentences with blanks: ${sentencesWithBlanks}`);
          console.log(`Total blanks: ${totalBlanks}`);
          c.end();
        });
      });
    });
  });
});
c.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.' });
