const { Client } = require('./node_modules/ssh2');

const correctNginx = `server {
    listen 80 default_server;
    server_name _;
    root /var/www/html/listening-trainer;
    location /.well-known/acme-challenge/ {
        allow all;
    }
    location / {
        return 404;
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

    location /audio/ {
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

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  conn.exec(`cat > /etc/nginx/sites-enabled/default << 'NGINX_EOF'\n${correctNginx}\nNGINX_EOF\nnginx -t && nginx -s reload && echo 'Nginx reloaded OK' || echo 'Nginx reload failed'`, (err, stream) => {
    let o = '', e = '';
    stream.on('data', (d) => o += d.toString());
    stream.stderr.on('data', (d) => e += d.toString());
    stream.on('close', () => {
      if (o.trim()) console.log(o.trim());
      if (e.trim()) console.log('STDERR:', e.trim());
      conn.end();
    });
  });
});
conn.on('error', (e) => { console.error('SSH Error:', e.message); process.exit(1); });
conn.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.', readyTimeout: 15000 });
