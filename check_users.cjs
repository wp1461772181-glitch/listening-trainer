const { Client } = require('./node_modules/ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  // Check registered users
  conn.exec('docker exec mysql mysql -u root -proot listening_trainer -e "SELECT id, email FROM users;"', (err, stream) => {
    let output = '';
    stream.on('data', d => output += d.toString());
    stream.stderr.on('data', d => output += d.toString());
    stream.on('close', () => {
      console.log(output);
      conn.end();
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
