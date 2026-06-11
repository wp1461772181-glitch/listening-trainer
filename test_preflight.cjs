const { Client } = require('./node_modules/ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  conn.exec(`curl -k -s -D- -X OPTIONS https://121.40.47.186/api/lessons/4/practice?sentenceIdx=0 \
    -H "Origin: https://121.40.47.186" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: authorization,content-type" 2>&1`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => out += d.toString());
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
