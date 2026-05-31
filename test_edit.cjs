const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec(`
    RESP=\$(curl -s -X POST -H "Content-Type: application/json" \\
      -d '{"email":"wp1461772181@gmail.com","password":"146177"}' \\
      http://localhost:8080/api/auth/login)
    echo "Login OK"
    TOKEN=\$(echo "\$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
    if [ -n "\$TOKEN" ]; then
      echo "=== LESSONS LIST ==="
      curl -s -H "Authorization: Bearer \$TOKEN" http://localhost:8080/api/lessons | python3 -c "
import sys,json
lessons = json.load(sys.stdin)
for l in lessons:
    n = len(l.get('sentences',[]))
    print('ID=%s title=%s status=%s sentences=%s' % (l['id'], l['title'], l['status'], n))
" 2>/dev/null
      FIRST_ID=\$(curl -s -H "Authorization: Bearer \$TOKEN" http://localhost:8080/api/lessons | python3 -c "import sys,json;a=json.load(sys.stdin);print(a[0]['id'] if a else '')" 2>/dev/null)
      if [ -n "\$FIRST_ID" ]; then
        echo "=== SINGLE LESSON \$FIRST_ID ==="
        curl -s -H "Authorization: Bearer \$TOKEN" http://localhost:8080/api/lessons/\$FIRST_ID | python3 -c "
import sys,json
l = json.load(sys.stdin)
print('ID=%s status=%s sentences=%s' % (l['id'], l['status'], len(l.get('sentences',[]))))
for s in l.get('sentences',[])[:3]:
    txt = (s.get('text','') or '')[:50]
    print('  idx=%s text=%s blanks=%s' % (s.get('index'), txt, len(s.get('blanks',[]))))
" 2>/dev/null
      fi
    fi
  `, (err, stream) => {
    let o = '';
    stream.on('data', d => o += d.toString());
    stream.stderr.on('data', d => o += d.toString());
    stream.on('close', () => { console.log(o.trim().slice(-1000)); c.end(); });
  });
});
c.connect({ host: '121.40.47.186', port: 22, username: 'root', password: 'Wp1461772181.' });
