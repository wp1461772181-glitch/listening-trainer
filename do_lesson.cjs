const { Client } = require('./node_modules/ssh2');

const API = 'http://localhost:8080';
const EMAIL = 'wp1461772181@gmail.com';
const PASSWORD = '146177';

// Coffee lesson text
const LESSON_TEXT = `Customer: Hi, can I get a latte, please?
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
Barista: Have a nice day!`;

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');

  conn.exec(`curl -s ${API}/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"${EMAIL}","password":"${PASSWORD}"}'`, (err, stream) => {
    let output = '';
    stream.on('data', d => output += d.toString());
    stream.stderr.on('data', d => output += d.toString());
    stream.on('close', () => {
      console.log('Login response:', output);
      try {
        const login = JSON.parse(output.trim());
        if (!login.token) { console.log('Login failed, trying register...'); registerAndProceed(conn); return; }
        console.log('Logged in with token:', login.token.substring(0, 20) + '...');
        proceedWithToken(conn, login.token);
      } catch(e) {
        console.log('Parse error:', e.message);
        registerAndProceed(conn);
      }
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });

function registerAndProceed(conn) {
  conn.exec(`curl -s ${API}/api/auth/register -X POST -H "Content-Type: application/json" -d '{"email":"${EMAIL}","password":"${PASSWORD}"}'`, (err, stream) => {
    let output = '';
    stream.on('data', d => output += d.toString());
    stream.stderr.on('data', d => output += d.toString());
    stream.on('close', () => {
      console.log('Register response:', output);
      try {
        const reg = JSON.parse(output.trim());
        if (reg.token) proceedWithToken(conn, reg.token);
        else { console.log('Register also failed:', output); conn.end(); }
      } catch(e) {
        console.log('Register parse error:', e.message, output);
        conn.end();
      }
    });
  });
}

function proceedWithToken(conn, token) {
  // List lessons
  conn.exec(`curl -s ${API}/api/lessons -H "Authorization: Bearer ${token}"`, (err, stream) => {
    let output = '';
    stream.on('data', d => output += d.toString());
    stream.on('close', () => {
      console.log('Lessons:', output);
      try {
        const lessons = JSON.parse(output.trim());
        // Delete all existing lessons
        for (const l of lessons) {
          console.log(`Deleting lesson ${l.id}: ${l.title}`);
          conn.exec(`curl -s -X DELETE ${API}/api/lessons/${l.id} -H "Authorization: Bearer ${token}"`, (err, stream) => {
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.on('close', () => {});
          });
        }
      } catch(e) {}

      // Create new lesson
      const payload = JSON.stringify({
        title: 'Ordering Coffee at a Cafe',
        difficulty: 'daily',
        hint: '',
        text: LESSON_TEXT,
        voice: 'male'
      }).replace(/"/g, '\\"');

      setTimeout(() => {
        conn.exec(`curl -s ${API}/api/lessons -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d "${payload}"`, (err, stream) => {
          let output = '';
          stream.on('data', d => output += d.toString());
          stream.on('close', () => {
            console.log('Create lesson response:', output);
            try {
              const resp = JSON.parse(output.trim());
              const lessonId = resp.id;
              console.log('Lesson ID:', lessonId);

              // Generate audio (this will alternate voices)
              console.log('Generating audio...');
              conn.exec(`curl -s -X POST ${API}/api/lessons/${lessonId}/generate -H "Authorization: Bearer ${token}"`, (err, stream) => {
                let genOutput = '';
                stream.on('data', d => genOutput += d.toString());
                stream.stderr.on('data', d => genOutput += d.toString());
                stream.on('close', () => {
                  console.log('Audio generation response:', genOutput);
                  conn.end();
                });
              }, { timeout: 60000 });
            } catch(e) {
              console.log('Parse error:', e.message);
              conn.end();
            }
          });
        });
      }, 2000);
    });
  });
}
