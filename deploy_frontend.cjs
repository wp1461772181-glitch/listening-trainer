const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const REMOTE_DIR = '/var/www/html/listening-trainer';
const DIST_DIR = path.join(__dirname, 'dist');

function walk(dir, base = '') {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(full, path.posix.join(base, entry.name)));
    } else {
      files.push(path.posix.join(base, entry.name));
    }
  }
  return files;
}

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  conn.exec(`rm -rf ${REMOTE_DIR} && mkdir -p ${REMOTE_DIR}`, (err) => {
    if (err) { console.error('mkdir error:', err); conn.end(); return; }
    console.log('Remote dir prepared');

    // Open ONE SFTP session and reuse it for all files
    conn.sftp((err, sftp) => {
      if (err) { console.error('SFTP open failed:', err); conn.end(); return; }
      console.log('SFTP session opened');
      const files = walk(DIST_DIR);
      uploadWithSftp(sftp, files, 0);
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });

function uploadWithSftp(sftp, files, idx) {
  if (idx >= files.length) {
    console.log(`\nDONE - ${files.length} files uploaded`);
    sftp.end();
    return;
  }
  const rel = files[idx];
  const localFile = path.join(DIST_DIR, rel);
  const remoteFile = path.posix.join(REMOTE_DIR, rel);
  const remoteDirPath = path.posix.dirname(remoteFile);

  // Create directory (serial, via same SFTP session)
  sftp.mkdir(remoteDirPath, { recursive: true }, () => {
    const rs = fs.createReadStream(localFile);
    const ws = sftp.createWriteStream(remoteFile);
    ws.on('close', () => {
      process.stdout.write(`\r  [${idx + 1}/${files.length}] ${rel}`);
      uploadWithSftp(sftp, files, idx + 1);
    });
    ws.on('error', (e) => {
      console.error(`\n  Failed: ${rel} - ${e.message}`);
      uploadWithSftp(sftp, files, idx + 1);
    });
    rs.pipe(ws);
  });
}
