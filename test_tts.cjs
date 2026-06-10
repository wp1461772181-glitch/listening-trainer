const { Client } = require('./node_modules/ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const testTexts = [
    'Customer: Hi, can I get a latte, please?',
    'Barista: Sure!',
    'What size would you like?',
    'We have small, medium, and large.',
  ];
  let i = 0;
  function test() {
    if (i >= testTexts.length) { conn.end(); return; }
    const text = testTexts[i];
    const cmd = `curl -s -o /dev/null -w "%{http_code} %{size_download}" "https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(text)}&spd=3"`;
    conn.exec(cmd, (err, stream) => {
      let output = '';
      stream.on('data', d => output += d.toString());
      stream.on('close', () => {
        console.log(`[${i}] ${text.substring(0, 50)}... -> ${output.trim()}`);
        i++; test();
      });
    });
  }
  test();
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
