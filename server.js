const http = require('http');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3737;

// tossctl 바이너리 경로 탐색
function findTossctl() {
  const candidates = [
    '/opt/homebrew/bin/tossctl',           // Apple Silicon Homebrew
    '/usr/local/bin/tossctl',              // Intel Homebrew
    path.join(os.homedir(), '.local', 'bin', 'tossctl'),
  ];
  for (const c of candidates) {
    try { fs.accessSync(c, fs.constants.X_OK); return c; } catch {}
  }
  return 'tossctl'; // PATH fallback
}

const TOSSCTL = findTossctl();

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  return res.end(JSON.stringify(payload));
}

function runTossctl(args) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PATH: [
        '/opt/homebrew/bin',
        '/opt/homebrew/opt/python@3.11/bin',
        '/usr/local/bin',
        path.join(os.homedir(), '.local', 'bin'),
        process.env.PATH || '',
      ].join(':'),
    };
    execFile(TOSSCTL, args, { timeout: 30000, env }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      try { resolve(JSON.parse(stdout)); }
      catch { reject(new Error('tossctl 응답 파싱 실패: ' + stdout.slice(0, 200))); }
    });
  });
}

async function fetchYahooQuote(ticker) {
  const symbol = String(ticker || '').trim().toUpperCase();
  if (!/^[A-Z0-9.^=\-]{1,24}$/.test(symbol)) {
    const err = new Error('티커 형식이 올바르지 않아요');
    err.status = 400;
    throw err;
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'stockanalysis-local/1.0',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const err = new Error(`Yahoo Finance 응답 오류: HTTP ${response.status}`);
      err.status = response.status >= 400 && response.status < 500 ? 400 : 502;
      throw err;
    }

    const raw = await response.json();
    const result = raw.chart?.result?.[0];
    if (!result) {
      const err = new Error('종목 데이터를 찾을 수 없어요');
      err.status = 404;
      throw err;
    }

    const meta = result.meta || {};
    const timestamps = result.timestamp || [];
    const rawCloses = result.indicators?.quote?.[0]?.close || [];
    const validPairs = timestamps
      .map((ts, i) => ({ ts, close: rawCloses[i] }))
      .filter(d => d.close != null);

    if (!validPairs.length || meta.regularMarketPrice == null) {
      const err = new Error('차트 데이터를 찾을 수 없어요');
      err.status = 404;
      throw err;
    }

    const dates = validPairs.map(d => {
      const dt = new Date(d.ts * 1000);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    });
    const closes = validPairs.map(d => d.close);
    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? currentPrice;
    const change = currentPrice - prevClose;
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return {
      ticker: symbol,
      quote: { price: currentPrice, change, changePct, currency: meta.currency || '' },
      history: { dates: dates.slice(-30), closes: closes.slice(-30) },
    };
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if ((req.method === 'GET' || req.method === 'HEAD') && requestUrl.pathname === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (req.method === 'HEAD') return res.end();
    return res.end(html);
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/portfolio') {
    try {
      const [positions, summary] = await Promise.all([
        runTossctl(['portfolio', 'positions', '--output', 'json']),
        runTossctl(['account', 'summary', '--output', 'json']),
      ]);
      return json(res, 200, { positions, summary });
    } catch (err) {
      const msg = err.message || '';
      const status = msg.includes('session') ? 401 : 500;
      return json(res, status, { error: msg });
    }
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/quote') {
    try {
      const data = await fetchYahooQuote(requestUrl.searchParams.get('ticker'));
      return json(res, 200, data);
    } catch (err) {
      const status = err.status || (err.name === 'AbortError' ? 504 : 500);
      const message = err.name === 'AbortError' ? '시세 조회 시간이 초과됐어요' : (err.message || '시세 조회 실패');
      return json(res, status, { error: message });
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`투자 트래커 실행 중 → http://localhost:${PORT}`);
});
