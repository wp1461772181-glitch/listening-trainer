const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = `
    echo "=== LOGIN TEST ==="
    RESP=\$(curl -s -X POST -H "Content-Type: application/json" \\
      -d '{"email":"test@example.com","password":"test123456"}' \\
      http://localhost:8080/api/auth/login)
    echo "Login response: \$RESP"
    TOKEN=\$(echo "\$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
    echo "Token: \$TOKEN"
    if [ -n "\$TOKEN" ]; then
      echo "=== LESSONS LIST ==="
      curl -s -H "Authorization: Bearer \$TOKEN" http://localhost:8080/api/lessons | head -c 300
      echo
      FIRST_ID=\$(curl -s -H "Authorization: Bearer \$TOKEN" http://localhost:8080/api/lessons | python3 -c "import sys,json;a=json.load(sys.stdin);print(a[0]['id'] if a else '')" 2>/dev/null || echo "")
      if [ -n "\$FIRST_ID" ]; then
        echo "=== SINGLE LESSON \$FIRST_ID ==="
        curl -s -H "Authorization: Bearer \$TOKEN" http://localhost:8080/api/lessons/\$FIRST_ID | head -c 500
        echo
      fi
    fi
  `;
  c.exec(cmd, (err, stream) => {
    let o = '';
    stream.on('data', d => o += d.toString());
    stream.stderr.on('data', d => o += d.toString());
    stream.on('close', () => { console.log(o.trim().slice(-1000)); c.end(); });
  });
});
c.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.' });
