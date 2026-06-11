const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');

  conn.exec('docker logs listening-trainer 2>&1 | grep -iE "word|error|exception|schema|init" | tail -20', (err, stream) => {
    let o = '';
    stream.on('data', (d) => o += d.toString());
    stream.on('close', () => {
      console.log('=== Logs ===\n' + o);
      check2();
    });
  });

  function check2() {
    conn.exec('curl -sv http://localhost:8080/api/word-bank/stats 2>&1', (err, stream) => {
      let o = '';
      stream.on('data', (d) => o += d.toString());
      stream.on('close', () => {
        console.log('=== curl verbose ===\n' + o);
        check3();
      });
    });
  }

  function check3() {
    conn.exec('docker exec -i mysql mysql -uroot -pWp1461772181. listening_trainer -e "SHOW TABLES;" 2>&1', (err, stream) => {
      let o = '';
      stream.on('data', (d) => o += d.toString());
      stream.on('close', () => {
        console.log('=== DB Tables ===\n' + o);
        check4();
      });
    });
  }

  function check4() {
    conn.exec('cat /root/listening-trainer/backend/src/main/resources/schema.sql | grep -A5 word_bank 2>&1', (err, stream) => {
      let o = '';
      stream.on('data', (d) => o += d.toString());
      stream.on('close', () => {
        console.log('=== schema.sql word_bank ===\n' + o);
        check5();
      });
    });
  }

  function check5() {
    // Check if the app has an ApplicationRunner that initializes the table
    conn.exec('grep -r "schema.sql\|CREATE TABLE\|flyway\|liquibase" /root/listening-trainer/backend/src/main/resources/application*.properties 2>&1', (err, stream) => {
      let o = '';
      stream.on('data', (d) => o += d.toString());
      stream.on('close', () => {
        console.log('=== schema config ===\n' + o);
        conn.end();
      });
    });
  }
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 30000 });
