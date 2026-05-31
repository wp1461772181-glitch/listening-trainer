const { Client } = require('ssh2');
const c = new Client();
const HOST = '121.40.47.186';
const PASSWORD = 'Wp1461772181.';

c.on('ready', () => {
  const steps = [
    'cd /root/listening-trainer && git pull origin java 2>&1',
    'cd /root/listening-trainer/backend && sed -i "s/jdbc:mysql:\\/\\/localhost:3306/jdbc:mysql:\\/\\/mysql:3306/" src/main/resources/application-mysql.properties 2>&1',
    'docker rm -f listening-trainer 2>&1',
    'docker rmi -f listening-trainer 2>&1',
    'cd /root/listening-trainer/backend && docker build -t listening-trainer . 2>&1',
    'docker run -d --name listening-trainer --network app-network -v /var/www/html/listening-trainer/audio:/app/public/audio/lessons -e SPRING_PROFILES_ACTIVE=mysql -e "APP_CORS_ORIGINS=http://localhost:*,https://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://121.40.47.186,https://listening-trainer.cyou,https://listening-trainer-xi.vercel.app,https://*.vercel.app" -p 8080:8080 listening-trainer 2>&1',
  ];
  let i = 0;
  function next() {
    if (i >= steps.length) {
      setTimeout(() => {
        c.exec('curl -s http://localhost:8080/api/lessons 2>&1 && echo "---LOGS---" && docker logs listening-trainer --tail 3 2>&1', (err, stream) => {
          let o = '';
          stream.on('data', d => o += d.toString());
          stream.on('close', () => { console.log('\n=== DONE ===\n', o.trim()); c.end(); });
        });
      }, 15000);
      return;
    }
    console.log('[' + (i + 1) + '/' + steps.length + '] ' + steps[i].substring(0, 80) + '...');
    c.exec(steps[i], (err, stream) => {
      if (err) { console.log('ERR:', err.message); i++; next(); return; }
      let o = '', e = '';
      stream.on('data', d => o += d.toString());
      stream.stderr.on('data', d => e += d.toString());
      stream.on('close', () => {
        const out = o.trim().slice(-300);
        if (out) console.log(out);
        i++;
        next();
      });
    });
  }
  next();
});
c.connect({ host: HOST, port: 22, username: 'root', password: PASSWORD, readyTimeout: 60000 });
