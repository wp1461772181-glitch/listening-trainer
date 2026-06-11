const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');

  const cmds = [
    // Check what data exists
    `echo "=== Old tables ===" && mysql -u root -p'Wp1461772181.' listening_trainer -e "SELECT COUNT(*) as count FROM user_progress; SELECT COUNT(*) as count FROM practice_detail; SELECT COUNT(*) as count FROM user_progress_summary;" 2>/dev/null`,
    `echo "=== New tables ===" && mysql -u root -p'Wp1461772181.' listening_trainer -e "SELECT COUNT(*) as count FROM practice_record; SELECT COUNT(*) as count FROM practice_answer; SELECT COUNT(*) as count FROM lesson; SELECT COUNT(*) as count FROM lesson_sentence; SELECT COUNT(*) as count FROM custom_lesson;" 2>/dev/null`,
    // Clean old data
    `echo "=== Truncating old tables ===" && mysql -u root -p'Wp1461772181.' listening_trainer -e "TRUNCATE TABLE user_progress; TRUNCATE TABLE practice_detail; TRUNCATE TABLE user_progress_summary; ALTER TABLE user_progress AUTO_INCREMENT = 1; ALTER TABLE practice_detail AUTO_INCREMENT = 1; ALTER TABLE user_progress_summary AUTO_INCREMENT = 1;" 2>/dev/null`,
    // Clean all new data (start fresh)
    `echo "=== Truncating new tables ===" && mysql -u root -p'Wp1461772181.' listening_trainer -e "TRUNCATE TABLE practice_answer; TRUNCATE TABLE practice_record; TRUNCATE TABLE lesson_sentence; TRUNCATE TABLE lesson; TRUNCATE TABLE custom_lesson; ALTER TABLE practice_answer AUTO_INCREMENT = 1; ALTER TABLE practice_record AUTO_INCREMENT = 1; ALTER TABLE lesson_sentence AUTO_INCREMENT = 1; ALTER TABLE lesson AUTO_INCREMENT = 1; ALTER TABLE custom_lesson AUTO_INCREMENT = 1;" 2>/dev/null`,
    `echo "=== Final state ===" && mysql -u root -p'Wp1461772181.' listening_trainer -e "SHOW TABLES;" 2>/dev/null`,
    // Clean audio files
    `echo "=== Cleaning audio files ===" && rm -rf /root/listening-trainer/public/audio/lessons/* && rm -rf /var/www/html/listening-trainer/audio/* && echo "Audio cleaned"`,
  ];

  let i = 0;
  function run() {
    if (i >= cmds.length) { console.log('ALL DONE'); conn.end(); return; }
    const cmd = cmds[i];
    console.log('\n--- [' + (i+1) + '/' + cmds.length + '] ---');
    conn.exec(cmd, (err, stream) => {
      if (err) { console.log('ERR:', err.message); i++; run(); return; }
      let o = '', e = '';
      stream.on('data', d => o += d.toString());
      stream.stderr.on('data', d => e += d.toString());
      stream.on('close', () => {
        if (o.trim()) console.log(o.trim());
        if (e.trim()) console.log('STDERR:', e.trim().slice(-200));
        i++;
        run();
      });
    });
  }
  run();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
