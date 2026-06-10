const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');

  // Full docker logs from start
  conn.exec('docker logs listening-trainer 2>&1 | head -80', (err, stream) => {
    let o = '';
    stream.on('data', (d) => o += d.toString());
    stream.on('close', () => {
      console.log('=== Docker Logs (first 80 lines) ===\n' + o);
      checkSecurityConfig();
    });
  });

  function checkSecurityConfig() {
    conn.exec('cat /root/listening-trainer/backend/src/main/java/com/listeningtrainer/config/SecurityConfig.java 2>&1', (err, stream) => {
      let o = '';
      stream.on('data', (d) => o += d.toString());
      stream.on('close', () => {
        console.log('=== SecurityConfig.java ===\n' + o);
        checkCorsConfig();
      });
    });
  }

  function checkCorsConfig() {
    conn.exec('cat /root/listening-trainer/backend/src/main/java/com/listeningtrainer/config/CorsConfig.java 2>&1', (err, stream) => {
      let o = '';
      stream.on('data', (d) => o += d.toString());
      stream.on('close', () => {
        console.log('=== CorsConfig.java ===\n' + o);
        fixNginx();
      });
    });
  }

  function fixNginx() {
    console.log('\n--- Fixing Nginx port 80 default server ---');
    // Fix the default server to serve frontend, not 404
    const newNginx = `server {
    listen 80 default_server;
    server_name _;
    root /var/www/html/listening-trainer;
    index index.html;

    location /.well-known/acme-challenge/ {
        allow all;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    server_name listening-training-wp.ignorelist.com listening-trainer.cyou www.listening-trainer.cyou 121.40.47.186;
    root /var/www/html/listening-trainer;
    index index.html;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        allow all;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /audio/lessons/ {
        alias /var/www/html/listening-trainer/audio/;
        expires 30d;
    }

    location /api/tts {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/listening-trainer.cyou/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/listening-trainer.cyou/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name listening-training-wp.ignorelist.com listening-trainer.cyou www.listening-trainer.cyou 121.40.47.186;

    location /.well-known/acme-challenge/ {
        allow all;
    }

    return 301 https://$host$request_uri;
}
`;

    conn.exec(`cat > /etc/nginx/sites-enabled/default << 'NGINX_EOF'\n${newNginx}\nNGINX_EOF\nnginx -t 2>&1 && nginx -s reload 2>&1`, (err, stream) => {
      let o = '';
      stream.on('data', (d) => o += d.toString());
      stream.on('close', () => {
        console.log('=== Nginx update ===\n' + o);
        testApis();
      });
    });
  }

  function testApis() {
    setTimeout(() => {
      const checks = [
        'curl -s -w " HTTP %{http_code}" http://localhost:8080/api/lessons 2>&1',
        'curl -s -w " HTTP %{http_code}" http://localhost:8080/api/word-bank/stats 2>&1',
        'curl -s -w " HTTP %{http_code}" http://localhost:80/ 2>&1',
        'curl -s http://localhost:80/ | head -c 200',
      ];
      let ci = 0;
      function runCheck() {
        if (ci >= checks.length) { conn.end(); return; }
        conn.exec(checks[ci], (err, stream) => {
          if (err) { console.log('ERR:', err.message); ci++; runCheck(); return; }
          let o = '';
          stream.on('data', (d) => o += d.toString());
          stream.on('close', () => {
            console.log(`  ${checks[ci].substring(0,50)}: ${o.trim().slice(-120)}`);
            ci++;
            runCheck();
          });
        });
      }
      runCheck();
    }, 3000);
  }
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 30000 });
