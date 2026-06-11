const { Client } = require('./node_modules/ssh2');

const API = 'http://localhost:8080';
const TOKEN = 'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiIyIiwiZW1haWwiOiJ3cDE0NjE3NzIxODFAZ21haWwuY29tIiwiaWF0IjoxNzgwMTE0MDE3LCJleHAiOjE3ODA3MTg4MTd9.GSB6zpujZzJGUNVWuh6dR_DxvEFYFsi2h0GCK6MUcv8FnJuau_-iUbpWLzNd-6Wo';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');

  // Delete lesson 3
  conn.exec(`curl -s -X DELETE ${API}/api/lessons/3 -H "Authorization: Bearer ${TOKEN}"`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.on('close', () => {
      console.log('Delete response:', out || '(empty)');

      // Create new lesson
      const payload = JSON.stringify({
        title: 'Ordering Coffee at a Cafe',
        difficulty: 'daily',
        hint: '',
        text: `Customer: Hi, can I get a latte, please?
Barista: Sure! What size would you like? We have small, medium, and large.
Customer: Medium, please. And can I have oat milk instead of regular milk?
Barista: Of course. Anything else?
Customer: Hmm, do you have any pastries today?
Barista: Yes, we have croissants, blueberry muffins, and chocolate chip cookies.
Customer: I'll take a croissant, please.
Barista: Alright. Would you like that warmed up?
Customer: Yes, please. That's all, thank you.
Barista: Your total is seven dollars and fifty cents. You can pick it up at the counter over there.
Customer: Great, thanks so much!
Barista: Have a nice day!`,
        voice: 'male'
      }).replace(/"/g, '\\"');

      setTimeout(() => {
        conn.exec(`curl -s ${API}/api/lessons -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${TOKEN}" -d "${payload}"`, (err, stream) => {
          let out = '';
          stream.on('data', d => out += d.toString());
          stream.on('close', () => {
            console.log('Create response:', out);
            try {
              const resp = JSON.parse(out.trim());
              const lessonId = resp.id;
              console.log('Lesson ID:', lessonId);

              // Generate audio
              console.log('Generating audio...');
              conn.exec(`curl -s -X POST ${API}/api/lessons/${lessonId}/generate -H "Authorization: Bearer ${TOKEN}"`, (err, stream) => {
                let genOut = '';
                stream.on('data', d => genOut += d.toString());
                stream.stderr.on('data', d => genOut += d.toString());
                stream.on('close', () => {
                  console.log('Audio response:', genOut);

                  // Verify: list all audio files
                  conn.exec('ls -la /var/www/html/listening-trainer/audio/4/', (err, stream) => {
                    let lsOut = '';
                    stream.on('data', d => lsOut += d.toString());
                    stream.stderr.on('data', d => lsOut += d.toString());
                    stream.on('close', () => {
                      console.log('Audio files:', lsOut);
                      conn.end();
                    });
                  });
                });
              }, { timeout: 120000 });
            } catch(e) {
              console.log('Parse error:', e.message);
              conn.end();
            }
          });
        });
      }, 2000);
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
