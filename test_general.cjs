const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec(`curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"wp1461772181@gmail.com","password":"146177"}' \
    http://localhost:8080/api/auth/login | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))"`, (err, stream) => {
    let token = '';
    stream.on('data', d => { token += d.toString(); });
    stream.on('close', () => {
      token = token.trim();
      console.log('Token:', token.substring(0, 20) + '...');

      function testLesson(lessonId) {
        return new Promise((resolve) => {
          c.exec(`curl -s -X POST -H "Authorization: Bearer ${token}" http://localhost:8080/api/lessons/${lessonId}/regenerate-blanks`, (err2, stream2) => {
            let body = '';
            stream2.on('data', d => { body += d.toString(); });
            stream2.on('close', () => {
              try {
                const l = JSON.parse(body);
                let totalBlanks = 0;
                let sentencesWithBlanks = 0;
                for (const s of l.sentences || []) {
                  if ((s.blanks || []).length > 0) {
                    sentencesWithBlanks++;
                    totalBlanks += s.blanks.length;
                  }
                }
                console.log(`\n=== Lesson ${lessonId}: "${l.title}" (${l.sentences?.length || 0} sentences) ===`);
                console.log(`  Sentences with blanks: ${sentencesWithBlanks}`);
                console.log(`  Total blanks: ${totalBlanks}`);
                console.log(`  Adaptive cap: ${Math.max(8, Math.min(20, (l.sentences?.length || 0) / 3))}`);
                // Print first few blanks
                let shown = 0;
                for (const s of l.sentences || []) {
                  if (s.blanks && s.blanks.length > 0) {
                    const words = s.blanks.map(x => x.word);
                    console.log(`    idx=${String(s.index).padStart(2)} ${JSON.stringify(words)}  ${(s.text||'').substring(0,55)}`);
                    shown++;
                    if (shown >= 8) { console.log(`    ... and ${sentencesWithBlanks - shown} more`); break; }
                  }
                }
                resolve();
              } catch(e) { console.log(`Lesson ${lessonId}: ${body.substring(0,200)}`); resolve(); }
            });
          });
        });
      }

      (async () => {
        await testLesson(30); // 18 sentences
        await testLesson(28); // 8 sentences
        await testLesson(12); // 6 sentences
        await testLesson(10); // 3 sentences
        c.end();
      })();
    });
  });
});
c.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.' });
