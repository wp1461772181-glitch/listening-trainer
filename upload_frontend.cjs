const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err); conn.end(); return; }

    const localDir = path.join(__dirname, 'dist');
    const remoteDir = '/var/www/html/listening-trainer';
    let uploaded = 0;
    let total = 0;

    // Count files first
    function countFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const localPath = path.join(dir, entry.name);
        if (entry.isDirectory()) countFiles(localPath);
        else total++;
      }
    }
    countFiles(localDir);

    function walk(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const localPath = path.join(dir, entry.name);
        const relative = path.relative(localDir, localPath).replace(/\\/g, '/');
        const remotePath = remoteDir + '/' + relative;
        if (entry.isDirectory()) {
          sftp.mkdir(remotePath, { mode: '0755' }, () => walk(localPath));
        } else {
          sftp.fastPut(localPath, remotePath, {}, (err) => {
            if (err) console.error('Upload failed:', remotePath, err.message);
            else console.log('Uploaded:', relative);
            uploaded++;
            if (uploaded >= total) {
              console.log('Done! Uploaded', uploaded, '/', total, 'files');
              conn.end();
            }
          });
        }
      }
    }
    walk(localDir);
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
