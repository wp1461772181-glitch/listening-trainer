const { Client } = require('./node_modules/ssh2');
const fs = require('fs');
const path = require('path');

const remotes = {
  'backend/src/main/java/com/listeningtrainer/controller/TtsController.java':
    '/root/listening-trainer/backend/src/main/java/com/listeningtrainer/controller/TtsController.java',
  'backend/src/main/java/com/listeningtrainer/config/SecurityConfig.java':
    '/root/listening-trainer/backend/src/main/java/com/listeningtrainer/config/SecurityConfig.java',
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected via SFTP');
  const entries = Object.entries(remotes);
  let i = 0;

  function uploadNext() {
    if (i >= entries.length) {
      console.log('All files uploaded. Rebuilding...');
      rebuild();
      return;
    }
    const [local, remote] = entries[i];
    const localPath = path.join('D:/listening-trainer', local);
    const content = fs.readFileSync(localPath);
    conn.sftp((err, sftp) => {
      if (err) { console.log('SFTP error:', err); i++; uploadNext(); return; }
      sftp.writeFile(remote, content, (err2) => {
        if (err2) console.log('ERR uploading', local, err2.message);
        else console.log('OK:', local);
        i++;
        uploadNext();
      });
    });
  }

  function rebuild() {
    const cmds = [
      'cd /root/listening-trainer/backend && sed -i "s/jdbc:mysql:\\/\\/localhost:3306/jdbc:mysql:\\/\\/mysql:3306/" src/main/resources/application-mysql.properties 2>&1',
      'cd /root/listening-trainer/backend && docker build -t listening-trainer . 2>&1',
      'docker rm -f listening-trainer 2>&1',
      'docker run -d --name listening-trainer --network app-network -e SPRING_PROFILES_ACTIVE=mysql -e "APP_CORS_ORIGINS=http://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://listening-trainer-xi.vercel.app,https://*.vercel.app" -p 8080:8080 listening-trainer 2>&1',
    ];
    let j = 0;
    function run() {
      if (j >= cmds.length) { console.log('DONE'); conn.end(); return; }
      const cmd = cmds[j];
      console.log('--- [' + (j+1) + '/' + cmds.length + '] ' + cmd.substring(0,80));
      conn.exec(cmd, (err, stream) => {
        if (err) { console.log('ERR:', err.message); j++; run(); return; }
        let o = '', e = '';
        stream.on('data', (d) => o += d.toString());
        stream.stderr.on('data', (d) => e += d.toString());
        stream.on('close', () => {
          if (o.trim()) console.log(o.trim().slice(-500));
          if (e.trim()) console.log('STDERR:', e.trim().slice(-300));
          j++; run();
        });
      });
    }
    run();
  }

  uploadNext();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
