# tossctl 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "토스에서 불러오기" 버튼 하나로 tossctl 포트폴리오 데이터를 자동 로드하는 로컬 서버 연동 구현

**Architecture:** Node.js 내장 모듈만 사용하는 `server.js`가 `index.html`을 서빙하고 `/api/portfolio` 엔드포인트로 tossctl을 실행. `index.html`에 버튼과 `loadFromToss()` 함수를 추가해 서버에서 받은 데이터를 직접 `render()`에 전달.

**Tech Stack:** Node.js (built-in `http`, `child_process`, `fs`), vanilla JS, tossctl CLI

---

### Task 1: package.json 생성

**Files:**
- Create: `package.json`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "stockanalysis",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add package.json
git commit -m "chore: add package.json with start script"
```

---

### Task 2: server.js 생성

**Files:**
- Create: `server.js`

- [ ] **Step 1: server.js 작성**

```js
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
```

- [ ] **Step 2: 서버 동작 확인**

```bash
node server.js &
curl -s http://localhost:3737/ | head -5
curl -s http://localhost:3737/api/portfolio | head -c 200
kill %1
```

Expected: HTML 응답, JSON 응답 확인

- [ ] **Step 3: 커밋**

```bash
git add server.js
git commit -m "feat: add local server serving index.html and /api/portfolio via tossctl"
```

---

### Task 3: index.html — "토스에서 불러오기" 버튼 추가

**Files:**
- Modify: `index.html` (Input Card 영역, line ~238)

- [ ] **Step 1: 힌트 텍스트 및 버튼 교체**

아래 블록을 찾아:
```html
    <div class="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 mb-3">
      토스 앱 → 투자 탭 전체 복사 후 붙여넣기
    </div>
```

다음으로 교체:
```html
    <button id="toss-load-btn" onclick="loadFromToss()"
      class="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-sm rounded-2xl px-4 py-3 mb-3 transition border border-blue-100">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      토스에서 불러오기
    </button>
    <div class="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 mb-3">
      또는 토스 앱 → 투자 탭 전체 복사 후 붙여넣기
    </div>
```

- [ ] **Step 2: 커밋**

```bash
git add index.html
git commit -m "feat: add '토스에서 불러오기' button to input card"
```

---

### Task 4: index.html — loadFromToss() 함수 구현

**Files:**
- Modify: `index.html` (script 영역 — `onAnalyze()` 함수 바로 위)

- [ ] **Step 1: loadFromToss() 함수 추가**

`function onAnalyze()` 바로 위에 삽입:

```js
/* ══════════════════════════════════════════
   TOSSCTL 연동
══════════════════════════════════════════ */
async function loadFromToss() {
  const btn = document.getElementById('toss-load-btn');
  const date = document.getElementById('snapshot-date').value;
  if (!date) { alert('날짜를 선택해주세요.'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-color:rgba(49,130,246,.3);border-top-color:#3182F6"></span> 불러오는 중...';

  try {
    const res = await fetch('/api/portfolio');
    if (res.status === 401) {
      showToast('토스 로그인이 필요해요 — 터미널에서 tossctl auth login 실행 후 다시 시도하세요');
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      showToast('불러오기 실패: ' + (body.error || res.statusText));
      return;
    }

    const { positions, summary } = await res.json();
    if (!positions || positions.length === 0) {
      showToast('보유 종목이 없어요');
      return;
    }

    /* 티커 맵 자동 등록 */
    const tickerMap = getTickerMap();
    positions.forEach(p => {
      if (p.symbol && p.name && !tickerMap[p.name]) {
        tickerMap[p.name] = p.symbol;
      }
    });
    localStorage.setItem(TICKER_MAP_KEY, JSON.stringify(tickerMap));

    /* tossctl → 내부 stocks 포맷 변환 */
    const stocks = positions.map(p => ({
      name:      p.name,
      rate:      p.profit_rate * 100,
      pnl:       p.unrealized_pnl,
      avg:       p.average_price,
      cur:       p.current_price,
      qty:       p.quantity,
      value:     p.market_value,
      invested:  p.market_value - p.unrealized_pnl,
      dailyRate: p.daily_profit_rate * 100,
      dailyPnl:  p.daily_profit_loss,
    }));

    const totalInvested = stocks.reduce((s, st) => s + st.invested, 0);
    const dailyPnl      = stocks.reduce((s, st) => s + (st.dailyPnl || 0), 0);
    const header = {
      totalValue:    summary.total_asset_amount,
      totalInvested,
      totalPnl:      summary.evaluated_profit_amount,
      totalRate:     summary.profit_rate * 100,
      dailyPnl,
      dailyRate:     totalInvested > 0 ? (dailyPnl / totalInvested) * 100 : 0,
    };

    const data = { stocks, header };
    saveSnapshot(date, data);
    render(data, date);
    renderHistorySection(date);
    showToast(`✓ 토스 포트폴리오 ${stocks.length}개 종목 로드 완료`);

  } catch (err) {
    showToast('서버에 연결할 수 없어요 — npm start로 서버를 먼저 실행해주세요');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> 토스에서 불러오기';
  }
}
```

- [ ] **Step 2: 브라우저에서 동작 확인**

```bash
node server.js
# 브라우저 → http://localhost:3737
# "토스에서 불러오기" 클릭 → 종목 자동 로드 확인
```

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "feat: implement loadFromToss() — auto-load portfolio from tossctl"
```
