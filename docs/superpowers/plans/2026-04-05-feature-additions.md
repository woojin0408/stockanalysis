# Feature Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add API key settings, stock detail modal with Alpha Vantage chart, and period summary card to the existing single-page investment tracker.

**Architecture:** All changes go into `index.html` (the single-file app). New JS functions are appended inside the existing `<script>` block. New HTML sections are added inside the `<body>` container. LocalStorage keys: `av_api_key_v1` (API key), `ticker_map_v1` (stock name → ticker), `av_cache_v1` (API response cache).

**Tech Stack:** HTML, Tailwind CSS, Vanilla JS, Chart.js, Alpha Vantage REST API

---

### Task 1: API 키 설정 UI

**Files:**
- Modify: `index.html` (header HTML + CSS + JS)

- [ ] **Step 1: 헤더를 flex row로 변경하고 설정 버튼 추가**

`index.html`에서 아래 부분을 찾아 교체한다:

```html
<!-- 기존 -->
  <div class="mb-3">
    <p class="text-xs font-semibold text-blue-500 mb-1 tracking-wide uppercase">Portfolio Tracker</p>
    <h1 class="text-2xl font-bold text-gray-900">내 투자 분석</h1>
    <p class="text-sm text-gray-400 mt-1">토스 앱에서 복사 → 날짜 선택 → 분석 & 저장</p>
  </div>
```

```html
<!-- 교체 후 -->
  <div class="mb-3 flex items-start justify-between">
    <div>
      <p class="text-xs font-semibold text-blue-500 mb-1 tracking-wide uppercase">Portfolio Tracker</p>
      <h1 class="text-2xl font-bold text-gray-900">내 투자 분석</h1>
      <p class="text-sm text-gray-400 mt-1">토스 앱에서 복사 → 날짜 선택 → 분석 & 저장</p>
    </div>
    <button onclick="toggleSettings()" class="mt-1 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition" title="설정">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  </div>
```

- [ ] **Step 2: 설정 패널 HTML 추가**

헤더 `div.mb-3` 바로 다음, Input Card `div.card` 바로 앞에 삽입:

```html
  <!-- ── Settings Panel ── -->
  <div id="settings-panel" class="card hidden animate-slide-up">
    <div class="font-bold text-gray-900 mb-3">설정</div>
    <label class="text-xs font-semibold text-gray-500 block mb-1.5">Alpha Vantage API 키</label>
    <div class="flex gap-2 mb-2">
      <input type="text" id="av-api-key" placeholder="API 키를 입력하세요"
        class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition" />
      <button onclick="saveApiKey()" class="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition">저장</button>
    </div>
    <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener"
      class="text-xs text-blue-400 hover:text-blue-600">무료 키 발급 → alphavantage.co ↗</a>
  </div>
```

- [ ] **Step 3: API 키 JS 함수 추가**

`<script>` 블록 내 `STORAGE_KEY` 상수 선언부 근처에 추가:

```js
/* ══════════════════════════════════════════
   SETTINGS — API KEY
══════════════════════════════════════════ */
const AV_KEY_STORAGE = 'av_api_key_v1';

function getApiKey() {
  return localStorage.getItem(AV_KEY_STORAGE) || '';
}

function saveApiKey() {
  const val = document.getElementById('av-api-key').value.trim();
  localStorage.setItem(AV_KEY_STORAGE, val);
  showToast('API 키가 저장됐어요');
}

function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    document.getElementById('av-api-key').value = getApiKey();
  }
}
```

- [ ] **Step 4: 브라우저에서 검증**

브라우저 콘솔에서 확인:
```js
toggleSettings(); // 패널이 나타나야 함
document.getElementById('av-api-key').value = 'test-key';
saveApiKey();
getApiKey(); // "test-key" 반환되어야 함
toggleSettings(); // 패널이 닫혀야 함
toggleSettings(); // 다시 열릴 때 입력란에 "test-key" 가 채워져 있어야 함
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add API key settings panel to header"
```

---

### Task 2: 종목 상세 모달 HTML + 열기/닫기

**Files:**
- Modify: `index.html` (modal HTML + CSS + open/close JS)

- [ ] **Step 1: 모달 HTML 추가**

`<!-- Toast -->` 주석 바로 위에 삽입:

```html
<!-- ── Stock Detail Modal ── -->
<div id="stock-modal" class="fixed inset-0 z-50 hidden" onclick="closeStockModal(event)">
  <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
  <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto"
       onclick="event.stopPropagation()">
    <div class="p-6">
      <!-- Handle bar -->
      <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5"></div>

      <!-- Header row -->
      <div class="flex items-start justify-between mb-5">
        <div>
          <div class="font-bold text-gray-900 text-lg" id="modal-name">—</div>
          <div class="text-xs text-gray-400 mt-0.5" id="modal-ticker">—</div>
        </div>
        <div class="text-right">
          <div class="text-lg font-extrabold text-gray-900" id="modal-price">—</div>
          <div class="text-sm font-semibold" id="modal-change"></div>
        </div>
      </div>

      <!-- Chart -->
      <div id="modal-chart-area" class="hidden" style="height:180px;position:relative">
        <canvas id="modal-chart"></canvas>
      </div>
      <div id="modal-chart-loading" class="hidden flex items-center justify-center text-sm text-gray-400" style="height:180px">
        불러오는 중...
      </div>
      <div id="modal-chart-error" class="hidden flex items-center justify-center text-sm text-gray-400" style="height:80px"></div>

      <!-- Ticker input (shown when ticker not registered) -->
      <div id="modal-ticker-input" class="hidden mt-5 p-4 bg-gray-50 rounded-2xl">
        <div class="text-sm font-semibold text-gray-700 mb-1">티커 코드를 입력해주세요</div>
        <div class="text-xs text-gray-400 mb-3">예: 삼성전자 → 005930.KS</div>
        <div class="flex gap-2">
          <input type="text" id="ticker-input-field" placeholder="005930.KS"
            class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition" />
          <button onclick="saveTicker()" class="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition">저장</button>
        </div>
      </div>

      <!-- API key missing notice -->
      <div id="modal-no-apikey" class="hidden mt-5 p-4 bg-yellow-50 rounded-2xl text-sm text-yellow-700">
        API 키를 먼저 설정해주세요. 우측 상단 ⚙ 버튼을 눌러 Alpha Vantage API 키를 입력하세요.
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: 모달 open/close JS 추가**

`<script>` 블록에 추가:

```js
/* ══════════════════════════════════════════
   STOCK MODAL — open / close
══════════════════════════════════════════ */
let modalChartInst    = null;
let currentModalStock = null;

function openStockModal(stockName) {
  currentModalStock = stockName;

  // Reset all states
  document.getElementById('modal-name').textContent     = stockName;
  document.getElementById('modal-ticker').textContent   = '—';
  document.getElementById('modal-price').textContent    = '—';
  document.getElementById('modal-change').textContent   = '';
  document.getElementById('modal-chart-area').classList.add('hidden');
  document.getElementById('modal-chart-loading').classList.add('hidden');
  document.getElementById('modal-chart-error').classList.add('hidden');
  document.getElementById('modal-ticker-input').classList.add('hidden');
  document.getElementById('modal-no-apikey').classList.add('hidden');

  if (modalChartInst) { modalChartInst.destroy(); modalChartInst = null; }

  document.getElementById('stock-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const apiKey = getApiKey();
  if (!apiKey) {
    document.getElementById('modal-no-apikey').classList.remove('hidden');
    return;
  }

  const ticker = getTicker(stockName);
  if (!ticker) {
    document.getElementById('modal-ticker-input').classList.remove('hidden');
    return;
  }

  loadStockData(stockName, ticker, apiKey);
}

function closeStockModal(event) {
  if (event && event.currentTarget !== event.target) return;
  document.getElementById('stock-modal').classList.add('hidden');
  document.body.style.overflow = '';
}
```

- [ ] **Step 3: 브라우저에서 검증**

콘솔에서 확인 (API 키 없는 상태):
```js
openStockModal('삼성전자');
// 모달이 열리고 "API 키를 먼저 설정해주세요" 노란 박스가 보여야 함
closeStockModal({ currentTarget: document.getElementById('stock-modal'), target: document.getElementById('stock-modal') });
// 모달이 닫혀야 함
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add stock detail modal HTML and open/close logic"
```

---

### Task 3: 티커 코드 관리 + 종목 행 클릭

**Files:**
- Modify: `index.html` (ticker localStorage JS + renderStocks click handler)

- [ ] **Step 1: 티커 맵 JS 추가**

`<script>` 블록에 추가:

```js
/* ══════════════════════════════════════════
   TICKER MAP
══════════════════════════════════════════ */
const TICKER_MAP_KEY = 'ticker_map_v1';

function getTickerMap() {
  try { return JSON.parse(localStorage.getItem(TICKER_MAP_KEY) || '{}'); }
  catch { return {}; }
}

function getTicker(stockName) {
  return getTickerMap()[stockName] || null;
}

function saveTicker() {
  const ticker = document.getElementById('ticker-input-field').value.trim().toUpperCase();
  if (!ticker) { showToast('티커 코드를 입력해주세요'); return; }

  const map = getTickerMap();
  map[currentModalStock] = ticker;
  localStorage.setItem(TICKER_MAP_KEY, JSON.stringify(map));

  document.getElementById('modal-ticker').textContent = ticker;
  document.getElementById('modal-ticker-input').classList.add('hidden');

  const apiKey = getApiKey();
  if (apiKey) loadStockData(currentModalStock, ticker, apiKey);
}
```

- [ ] **Step 2: renderStocks에서 종목 행에 클릭 핸들러 추가**

`renderStocks` 함수 내 stock row 생성 부분에서:

```js
// 기존
return `
      <div class="stock-row">
```

```js
// 교체
return `
      <div class="stock-row cursor-pointer" onclick="openStockModal('${s.name.replace(/'/g, "\\'")}')">
```

- [ ] **Step 3: 브라우저에서 검증**

콘솔에서 확인:
```js
// 티커 저장 테스트
currentModalStock = '삼성전자';
document.getElementById('ticker-input-field') // 없으면 openStockModal로 모달 먼저 열기
// 실제로는 모달 열고 ticker input에 값 입력 후 저장 버튼 클릭
getTicker('삼성전자'); // 저장한 값 반환되어야 함
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add ticker map storage and stock row click handler"
```

---

### Task 4: Alpha Vantage API 함수 + 캐시

**Files:**
- Modify: `index.html` (fetch functions + localStorage cache)

- [ ] **Step 1: 캐시 + API fetch 함수 추가**

`<script>` 블록에 추가:

```js
/* ══════════════════════════════════════════
   ALPHA VANTAGE — cache + fetch
══════════════════════════════════════════ */
const AV_CACHE_KEY = 'av_cache_v1';
const AV_CACHE_TTL = 60 * 60 * 1000; // 1시간

function getAvCache() {
  try { return JSON.parse(localStorage.getItem(AV_CACHE_KEY) || '{}'); }
  catch { return {}; }
}

function setAvCache(key, data) {
  const cache = getAvCache();
  cache[key] = { data, ts: Date.now() };
  try { localStorage.setItem(AV_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

function getFromCache(key) {
  const entry = getAvCache()[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > AV_CACHE_TTL) return null;
  return entry.data;
}

async function fetchCurrentQuote(ticker, apiKey) {
  const cacheKey = `quote_${ticker}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error('네트워크 오류가 발생했어요');
  const json = await res.json();

  if (json['Note']) throw new Error('API 호출 한도를 초과했어요 (일 25회)');
  if (json['Error Message']) throw new Error('티커 코드를 찾을 수 없어요');

  const q = json['Global Quote'];
  if (!q || !q['05. price']) throw new Error('현재 시세를 불러올 수 없어요');

  const result = {
    price:     parseFloat(q['05. price']),
    change:    parseFloat(q['09. change']),
    changePct: parseFloat(q['10. change percent']),
  };
  setAvCache(cacheKey, result);
  return result;
}

async function fetchDailyHistory(ticker, apiKey) {
  const cacheKey = `daily_${ticker}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker)}&outputsize=compact&apikey=${apiKey}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error('네트워크 오류가 발생했어요');
  const json = await res.json();

  if (json['Note']) throw new Error('API 호출 한도를 초과했어요 (일 25회)');
  if (json['Error Message']) throw new Error('티커 코드를 찾을 수 없어요');

  const series = json['Time Series (Daily)'];
  if (!series) throw new Error('차트 데이터를 불러올 수 없어요');

  const dates = Object.keys(series).sort().slice(-30);
  const result = {
    dates,
    closes: dates.map(d => parseFloat(series[d]['4. close'])),
  };
  setAvCache(cacheKey, result);
  return result;
}
```

- [ ] **Step 2: 브라우저 콘솔에서 검증 (API 키 있을 때)**

```js
// 먼저 API 키 저장
localStorage.setItem('av_api_key_v1', 'YOUR_KEY_HERE');

// 캐시 없는 상태에서 호출
fetchCurrentQuote('IBM', getApiKey()).then(console.log);
// 예상 출력: { price: 195.0, change: 1.2, changePct: 0.62 } 형태

// 한 번 더 호출하면 캐시에서 즉시 반환됨
fetchCurrentQuote('IBM', getApiKey()).then(console.log);
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Alpha Vantage API fetch functions with 1-hour cache"
```

---

### Task 5: 모달 데이터 표시 + 차트 렌더링

**Files:**
- Modify: `index.html` (loadStockData + renderModalChart functions)

- [ ] **Step 1: loadStockData + renderModalChart 추가**

`<script>` 블록에 추가:

```js
/* ══════════════════════════════════════════
   STOCK MODAL — data load + chart
══════════════════════════════════════════ */
async function loadStockData(stockName, ticker, apiKey) {
  document.getElementById('modal-ticker').textContent = ticker;
  document.getElementById('modal-chart-loading').classList.remove('hidden');
  document.getElementById('modal-chart-area').classList.add('hidden');
  document.getElementById('modal-chart-error').classList.add('hidden');

  try {
    const [quote, history] = await Promise.all([
      fetchCurrentQuote(ticker, apiKey),
      fetchDailyHistory(ticker, apiKey),
    ]);

    document.getElementById('modal-chart-loading').classList.add('hidden');

    // 현재가 & 등락률
    const priceEl  = document.getElementById('modal-price');
    const changeEl = document.getElementById('modal-change');
    priceEl.textContent = quote.price.toLocaleString('ko-KR') + '원';
    const sign = quote.change >= 0 ? '+' : '';
    changeEl.textContent  = `${sign}${quote.change.toLocaleString('ko-KR')}원 (${sign}${quote.changePct.toFixed(2)}%)`;
    changeEl.className    = 'text-sm font-semibold ' + (quote.change >= 0 ? 'c-profit' : 'c-loss');

    renderModalChart(history);
    document.getElementById('modal-chart-area').classList.remove('hidden');
  } catch (err) {
    document.getElementById('modal-chart-loading').classList.add('hidden');
    const errEl = document.getElementById('modal-chart-error');
    errEl.textContent = err.message || '현재 시세를 불러올 수 없어요';
    errEl.classList.remove('hidden');
  }
}

function renderModalChart(history) {
  if (modalChartInst) { modalChartInst.destroy(); modalChartInst = null; }
  const ctx   = document.getElementById('modal-chart').getContext('2d');
  const first = history.closes[0];
  const last  = history.closes[history.closes.length - 1];
  const color = last >= first ? '#16B364' : '#F04438';
  const bgColor = last >= first ? 'rgba(22,179,100,.08)' : 'rgba(240,68,56,.08)';

  const labels = history.dates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getMonth() + 1}/${dt.getDate()}`;
  });

  modalChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: history.closes,
        borderColor: color,
        backgroundColor: bgColor,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.35,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1A1A2E',
          titleFont: { family: 'Pretendard', size: 11 },
          bodyFont:  { family: 'Pretendard', size: 12 },
          padding: 8,
          callbacks: { label: ctx => `  ${ctx.parsed.y.toLocaleString('ko-KR')}원` }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { family: 'Pretendard', size: 10 }, color: '#8B95A1', maxTicksLimit: 6 }
        },
        y: {
          grid: { color: '#F0F1F5' },
          border: { display: false },
          ticks: { font: { family: 'Pretendard', size: 10 }, color: '#8B95A1', callback: v => v.toLocaleString('ko-KR') }
        }
      }
    }
  });
}
```

- [ ] **Step 2: 브라우저에서 통합 검증**

1. API 키 ⚙ 버튼 → 입력 → 저장
2. 포트폴리오 데이터 붙여넣고 분석 실행
3. 종목 행 클릭 → 모달 열림 확인
4. 티커 코드 입력 (예: `005930.KS`) → 저장
5. 로딩 스피너 나타났다가 차트 + 현재가 표시 확인
6. 같은 종목 다시 클릭 → 캐시에서 즉시 로드 (로딩 스피너 없어야 함)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add stock detail modal data loading and 30-day chart"
```

---

### Task 6: 기간별 수익률 요약 카드

**Files:**
- Modify: `index.html` (period summary HTML + JS + renderHistorySection 연결)

- [ ] **Step 1: 기간 요약 카드 HTML 추가**

히스토리 섹션 내 `<!-- Snapshot list -->` 카드 바로 다음에 삽입:

```html
    <!-- Period summary card -->
    <div class="card animate-slide-up hidden" id="period-summary-card">
      <div class="flex items-center justify-between mb-4">
        <span class="font-bold text-gray-900">기간별 수익률</span>
        <div class="flex gap-1">
          <button id="period-tab-week" onclick="switchPeriodTab('week')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition bg-blue-500 text-white">주간</button>
          <button id="period-tab-month" onclick="switchPeriodTab('month')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition bg-gray-100 text-gray-500">월간</button>
        </div>
      </div>
      <div id="period-list" class="space-y-1"></div>
    </div>
```

- [ ] **Step 2: 기간 요약 JS 함수 추가**

`<script>` 블록에 추가:

```js
/* ══════════════════════════════════════════
   PERIOD SUMMARY
══════════════════════════════════════════ */
let currentPeriodTab = 'week';

function switchPeriodTab(tab) {
  currentPeriodTab = tab;
  const weekBtn  = document.getElementById('period-tab-week');
  const monthBtn = document.getElementById('period-tab-month');
  weekBtn.className  = 'px-3 py-1.5 rounded-xl text-xs font-semibold transition ' +
    (tab === 'week'  ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500');
  monthBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold transition ' +
    (tab === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500');
  renderPeriodList(getSnapshots());
}

function getMonthKey(dateStr) {
  return dateStr.substring(0, 7); // "2026-04"
}

function getISOWeekKey(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00');
  const day = d.getDay() === 0 ? 7 : d.getDay(); // Mon=1 ... Sun=7
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day - 1));
  const y   = mon.getFullYear();
  const wk  = Math.ceil(
    ((mon - new Date(y, 0, 1)) / 86400000 + new Date(y, 0, 1).getDay() + 1) / 7
  );
  return `${y}-W${String(wk).padStart(2, '0')}`;
}

function groupSnapshotsByPeriod(snaps, mode) {
  const groups = {};
  Object.keys(snaps).sort().forEach(d => {
    const key = mode === 'week' ? getISOWeekKey(d) : getMonthKey(d);
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });
  return groups;
}

function renderPeriodList(snaps) {
  const card  = document.getElementById('period-summary-card');
  const dates = Object.keys(snaps).sort();
  if (dates.length < 2) { card.classList.add('hidden'); return; }
  card.classList.remove('hidden');

  const groups = groupSnapshotsByPeriod(snaps, currentPeriodTab);
  const keys   = Object.keys(groups).sort().reverse();

  document.getElementById('period-list').innerHTML = keys.map(key => {
    const periodDates = groups[key].sort();
    const firstSnap   = snaps[periodDates[0]];
    const lastSnap    = snaps[periodDates[periodDates.length - 1]];

    const firstVal  = firstSnap.header?.totalValue ?? firstSnap.stocks.reduce((s, x) => s + x.value, 0);
    const lastVal   = lastSnap.header?.totalValue  ?? lastSnap.stocks.reduce((s, x) => s + x.value, 0);
    const firstRate = firstSnap.header?.totalRate  ?? 0;
    const lastRate  = lastSnap.header?.totalRate   ?? 0;

    const valDiff  = lastVal - firstVal;
    const rateDiff = lastRate - firstRate;
    const hasDiff  = periodDates.length > 1;

    let label;
    if (currentPeriodTab === 'month') {
      const [y, m] = key.split('-');
      label = `${y}년 ${parseInt(m)}월`;
    } else {
      const d  = new Date(periodDates[0] + 'T00:00:00');
      label = `${d.getMonth() + 1}월 ${d.getDate()}일 주`;
    }

    return `
      <div class="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
        <div>
          <div class="text-sm font-semibold text-gray-800">${label}</div>
          <div class="text-xs text-gray-400 mt-0.5">${periodDates.length}개 기록</div>
        </div>
        <div class="text-right">
          ${hasDiff ? `
            <div class="text-sm font-bold ${rateDiff >= 0 ? 'c-profit' : 'c-loss'}">
              ${rateDiff >= 0 ? '+' : ''}${rateDiff.toFixed(2)}%p
            </div>
            <div class="text-xs font-semibold mt-0.5 ${valDiff >= 0 ? 'c-profit' : 'c-loss'}">
              ${valDiff >= 0 ? '+' : ''}${formatKRW(valDiff)}
            </div>
          ` : `<div class="text-xs text-gray-400">기록 1개</div>`}
        </div>
      </div>`;
  }).join('');
}
```

- [ ] **Step 3: renderHistorySection에 renderPeriodList 호출 연결**

`renderHistorySection` 함수 내 `renderSnapshotList(snaps, activeDate);` 바로 다음 줄에 추가:

```js
  renderPeriodList(snaps);
```

- [ ] **Step 4: 브라우저에서 검증**

1. 저장된 스냅샷이 2개 이상이면 히스토리 섹션 하단에 "기간별 수익률" 카드가 나타나야 함
2. 주간/월간 탭 전환 시 목록이 갱신됨
3. 기간별 수익률 변화(%p)와 평가금액 변화가 올바르게 표시됨

콘솔에서 단위 검증:
```js
getISOWeekKey('2026-04-01'); // 수요일 → "2026-W14" 형태 반환되어야 함
getMonthKey('2026-04-01');   // "2026-04" 반환
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add weekly/monthly period summary card to history section"
```

---

### Task 7: Push & 최종 확인

- [ ] **Step 1: 전체 기능 통합 체크**

브라우저에서 순서대로 확인:
1. ⚙ → API 키 입력 → 저장 → 패널 닫힘
2. 데이터 붙여넣기 → 분석 & 저장
3. 종목 행 클릭 → 모달 열림 → 티커 입력 → 저장 → 차트 로드
4. 동일 종목 재클릭 → 캐시에서 즉시 표시 (로딩 없음)
5. 히스토리 섹션에 기간별 수익률 카드 표시 (2개 이상 저장 시)
6. 주간/월간 탭 전환 동작

- [ ] **Step 2: Push**

```bash
git push origin main
```
