const http = require('http');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3737;

function runTossctl(args) {
  return new Promise((resolve, reject) => {
    execFile('tossctl', args, { timeout: 15000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      try { resolve(JSON.parse(stdout)); }
      catch { reject(new Error('tossctl 응답 파싱 실패')); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (req.method === 'GET' && req.url === '/api/portfolio') {
    try {
      const [positions, summary] = await Promise.all([
        runTossctl(['portfolio', 'positions', '--output', 'json']),
        runTossctl(['account', 'summary', '--output', 'json']),
      ]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ positions, summary }));
    } catch (err) {
      const msg = err.message || '';
      const status = msg.includes('session') ? 401 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: msg }));
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`투자 트래커 실행 중 → http://localhost:${PORT}`);
});
