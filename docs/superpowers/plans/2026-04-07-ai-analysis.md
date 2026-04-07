# AI 분석 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 포트폴리오 데이터를 Claude API에 전송해 종목별 액션·코멘트, 리스크 점수, 오늘 요약을 새 카드에 표시한다.

**Architecture:** 단일 index.html 파일에 모든 변경 적용. 왼쪽 패널에 API 키 입력 카드 추가, 분석 결과 영역에 "AI 분석하기" 버튼 추가, 대시보드 최상단에 AI 분석 카드 추가. Claude API는 corsproxy.io 경유 단일 호출, 응답은 JSON 강제.

**Tech Stack:** Vanilla JS, Tailwind CSS, claude-haiku-4-5-20251001, corsproxy.io CORS 프록시, localStorage

---

## 파일 구조

- Modify: `index.html` (전체 변경이 이 파일 하나에 집중)
  - CSS 추가: AI 카드 전용 스타일 (~line 191 앞)
  - HTML 추가: AI 설정 카드 (left panel, ~line 258 뒤)
  - HTML 추가: "AI 분석하기" 버튼 + AI 분석 카드 (results div 내부)
  - JS 추가: API 키 관리, Claude API 호출, AI 카드 렌더링 함수들 (~line 1570 앞)
  - JS 수정: `init()` 에서 API 키 UI 상태 복원

---

### Task 1: AI 설정 카드 CSS + HTML

**Files:**
- Modify: `index.html`

- [ ] **Step 1: CSS 추가** — `</style>` 직전(line 191)에 아래 CSS 삽입

```css
    /* AI key input */
    .ai-key-input {
      font-family: 'Pretendard', system-ui, sans-serif;
      border: 1.5px solid #E5E7EB; border-radius: 12px;
      padding: 10px 14px; font-size: 13px; color: #1F2937;
      background: white; outline: none; width: 100%;
      transition: border-color .2s, box-shadow .2s;
    }
    .ai-key-input:focus {
      border-color: #3182F6;
      box-shadow: 0 0 0 3px rgba(49,130,246,.12);
    }
    /* AI analysis card */
    .ai-action-buy    { background:#ECFDF3; color:#16B364; }
    .ai-action-sell   { background:#FFF1F0; color:#F04438; }
    .ai-action-hold   { background:#F3F4F6; color:#6B7280; }
    .risk-score-ring  { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; flex-shrink:0; }
    .risk-low    { background:#ECFDF3; color:#16B364; }
    .risk-mid    { background:#FFF8E6; color:#D08B00; }
    .risk-high   { background:#FFF1F0; color:#F04438; }
```

- [ ] **Step 2: AI 설정 카드 HTML 추가** — export 카드 닫는 `</div>` 바로 뒤(~line 258), `</div><!-- /left-panel -->` 바로 앞에 삽입

```html
  <!-- ── AI Settings Card ── -->
  <div class="card" id="ai-settings-card">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-base">🤖</span>
      <span class="font-bold text-gray-900">AI 분석 설정</span>
    </div>
    <label class="text-xs font-semibold text-gray-500 block mb-1.5">Claude API 키</label>
    <div class="flex gap-2 mb-2">
      <input type="password" id="ai-key-input" class="ai-key-input" placeholder="sk-ant-..." />
      <button onclick="onSaveApiKey()"
        class="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition whitespace-nowrap">
        저장
      </button>
    </div>
    <div id="ai-key-status" class="text-xs text-gray-400">개인 키는 이 기기에만 저장됩니다</div>
  </div>
```

- [ ] **Step 3: 브라우저에서 확인** — `index.html` 열기 → 왼쪽 패널 하단에 "AI 분석 설정" 카드가 보이는지 확인

- [ ] **Step 4: 커밋**

```bash
git add index.html
git commit -m "feat: add AI settings card to left panel"
```

---

### Task 2: AI 분석 버튼 + AI 분석 카드 HTML

**Files:**
- Modify: `index.html`

- [ ] **Step 1: "AI 분석하기" 버튼 추가** — `<div id="results"` 안, date label div 바로 앞(~line 268)에 삽입

```html
    <!-- AI 분석 버튼 -->
    <div class="flex justify-end mb-2" id="ai-analyze-row" style="display:none!important">
      <button onclick="onAiAnalyze()" id="ai-analyze-btn"
        class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-2xl text-sm font-bold hover:opacity-90 transition shadow-sm">
        <span>✨</span> AI 분석하기
      </button>
    </div>
```

- [ ] **Step 2: AI 분석 카드 HTML 추가** — `<div id="dashboard-grid">` 바로 다음(~line 292)에 첫 번째 자식으로 삽입

```html
      <!-- AI Analysis Card -->
      <div class="card animate-slide-up col-span-3 hidden" id="ai-card" data-card-id="ai-card" style="animation-delay:.05s">
        <div class="drag-handle"><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1.5" width="2.5" height="2.5" rx="1"/><rect x="8" y="1.5" width="2.5" height="2.5" rx="1"/><rect x="2" y="5.5" width="2.5" height="2.5" rx="1"/><rect x="8" y="5.5" width="2.5" height="2.5" rx="1"/><rect x="2" y="9.5" width="2.5" height="2.5" rx="1"/><rect x="8" y="9.5" width="2.5" height="2.5" rx="1"/></svg></div>

        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg">✨</span>
            <span class="font-bold text-gray-900">AI 분석</span>
            <span class="text-xs text-gray-400" id="ai-card-date"></span>
          </div>
          <button onclick="onAiAnalyze()" id="ai-card-refresh"
            class="text-xs text-gray-400 hover:text-blue-500 transition flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            새로고침
          </button>
        </div>

        <!-- Loading state -->
        <div id="ai-card-loading" class="hidden py-8 flex flex-col items-center gap-3">
          <div class="spinner" style="width:24px;height:24px;border-color:rgba(99,102,241,.2);border-top-color:#6366F1"></div>
          <div class="text-sm text-gray-400">Claude가 포트폴리오를 분석하고 있어요...</div>
        </div>

        <!-- Content -->
        <div id="ai-card-content" class="hidden">
          <!-- 오늘 요약 + 리스크 점수 -->
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div class="bg-gray-50 rounded-2xl p-4">
              <div class="text-xs font-semibold text-gray-400 mb-2">📋 오늘 요약</div>
              <p class="text-sm text-gray-700 leading-relaxed" id="ai-summary"></p>
            </div>
            <div class="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
              <div class="risk-score-ring" id="ai-risk-ring">
                <span id="ai-risk-score">—</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-gray-400 mb-1">🎯 리스크 점수</div>
                <p class="text-sm text-gray-600 leading-snug" id="ai-risk-reason"></p>
              </div>
            </div>
          </div>

          <!-- 종목별 분석 -->
          <div class="text-xs font-semibold text-gray-400 mb-3">종목별 분석</div>
          <div id="ai-stocks" class="space-y-2"></div>
        </div>
      </div>
```

- [ ] **Step 3: 브라우저에서 확인** — 분석 실행 후 dashboard-grid 상단에 카드 구조가 hidden 상태로 존재하는지 개발자 도구로 확인

- [ ] **Step 4: 커밋**

```bash
git add index.html
git commit -m "feat: add AI analysis button and card HTML"
```

---

### Task 3: API 키 관리 JS

**Files:**
- Modify: `index.html` — `/* ══ ENTRY POINT ══ */` 블록 바로 앞(~line 1571)에 새 JS 섹션 삽입

- [ ] **Step 1: API 키 스토리지 + UI 함수 추가**

```js
/* ══════════════════════════════════════════
   AI — API KEY
══════════════════════════════════════════ */
const AI_KEY_STORAGE = 'claude_api_key_v1';

function getApiKey() {
  return localStorage.getItem(AI_KEY_STORAGE) || '';
}

function onSaveApiKey() {
  const val = document.getElementById('ai-key-input').value.trim();
  if (!val.startsWith('sk-ant-')) {
    showToast('올바른 Claude API 키를 입력해주세요 (sk-ant- 로 시작)');
    return;
  }
  localStorage.setItem(AI_KEY_STORAGE, val);
  renderApiKeyStatus(true);
  showToast('API 키가 저장됐어요');
}

function renderApiKeyStatus(saved) {
  const statusEl = document.getElementById('ai-key-status');
  const inputEl  = document.getElementById('ai-key-input');
  if (saved) {
    statusEl.innerHTML = '<span class="text-green-500 font-semibold">✓ 키 저장됨</span> · 개인 키는 이 기기에만 저장됩니다';
    inputEl.placeholder = 'sk-ant-••••••••••••';
    inputEl.value = '';
  } else {
    statusEl.textContent = '개인 키는 이 기기에만 저장됩니다';
  }
}
```

- [ ] **Step 2: `init()` 함수 내부 마지막 줄 앞에 API 키 상태 복원 추가**

기존 `init()` 함수(`(function init() {` 블록) 내에서 `})();` 바로 앞에 추가:

```js
  /* Restore AI key status */
  if (getApiKey()) renderApiKeyStatus(true);
```

- [ ] **Step 3: 브라우저에서 확인**
  1. API 키 입력란에 `sk-ant-test` 입력 → 저장 → "✓ 키 저장됨" 표시 확인
  2. 잘못된 키(`abc123`) → "올바른 Claude API 키를 입력해주세요" 토스트 확인
  3. 페이지 새로고침 → "✓ 키 저장됨" 상태 유지 확인

- [ ] **Step 4: 커밋**

```bash
git add index.html
git commit -m "feat: add Claude API key storage and UI"
```

---

### Task 4: Claude API 호출 함수

**Files:**
- Modify: `index.html` — Task 3에서 추가한 섹션 아래에 계속 추가

- [ ] **Step 1: 프롬프트 빌더 + API 호출 함수 추가**

```js
/* ══════════════════════════════════════════
   AI — CLAUDE API CALL
══════════════════════════════════════════ */
function buildAiPrompt(stocks, header, totRate, totValue) {
  const portfolioJson = JSON.stringify({
    totalRate: +totRate.toFixed(2),
    totalValue: Math.round(totValue),
    stocks: stocks.map(s => ({
      name: s.name,
      rate: +s.rate.toFixed(2),
      weight: +(s.value / totValue * 100).toFixed(1),
      value: Math.round(s.value),
      pnl: Math.round(s.pnl),
    }))
  }, null, 2);

  return `당신은 투자 분석 어시스턴트입니다. 아래 포트폴리오를 분석하고 반드시 JSON 형식으로만 응답하세요. 설명 텍스트 없이 JSON만 출력하세요.

포트폴리오 데이터:
${portfolioJson}

응답 JSON 형식 (이 구조를 정확히 따르세요):
{
  "summary": "포트폴리오 전체 상태를 한두 문장으로 요약 (한국어)",
  "riskScore": 숫자(1.0~10.0, 소수점 한 자리),
  "riskReason": "리스크 점수 근거 한 줄 (한국어)",
  "stocks": [
    { "name": "종목명 (데이터와 정확히 동일하게)", "action": "매수 또는 매도 또는 유지", "comment": "한줄 분석 (한국어)" }
  ]
}

주의:
- action 값은 반드시 "매수", "매도", "유지" 셋 중 하나만 사용
- stocks 배열은 입력 종목 전체를 포함
- JSON 외 텍스트 절대 금지`;
}

async function callClaudeApi(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const targetUrl = 'https://api.anthropic.com/v1/messages';
  const proxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  ];

  let lastErr = null;
  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      // JSON 블록 추출 (마크다운 코드펜스 대응)
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('JSON_PARSE_FAIL');
      return JSON.parse(match[0]);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('AI_CALL_FAILED');
}
```

- [ ] **Step 2: 브라우저 콘솔에서 수동 검증** (실제 키 없이 구조만 확인)

개발자 도구 콘솔에서 실행:
```js
buildAiPrompt(
  [{ name: '삼성전자', rate: 5.2, value: 1000000, pnl: 50000 }],
  null, 5.2, 1000000
)
```
예상 결과: 프롬프트 문자열 출력, JSON 형식 포함 확인

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "feat: add Claude API call and prompt builder"
```

---

### Task 5: AI 카드 렌더 + onAiAnalyze 연결

**Files:**
- Modify: `index.html` — Task 4 섹션 아래에 계속 추가

- [ ] **Step 1: `renderAiCard()` 함수 추가**

```js
/* ══════════════════════════════════════════
   AI — RENDER
══════════════════════════════════════════ */
function renderAiCard(result, dateStr) {
  const card    = document.getElementById('ai-card');
  const loading = document.getElementById('ai-card-loading');
  const content = document.getElementById('ai-card-content');

  loading.classList.add('hidden');
  content.classList.remove('hidden');
  card.classList.remove('hidden');

  // 날짜 레이블
  document.getElementById('ai-card-date').textContent = dateStr ? formatDateKR(dateStr) + ' 기준' : '';

  // 요약
  document.getElementById('ai-summary').textContent = result.summary || '—';

  // 리스크 점수
  const score = typeof result.riskScore === 'number' ? result.riskScore : parseFloat(result.riskScore);
  document.getElementById('ai-risk-score').textContent = isNaN(score) ? '—' : score.toFixed(1);
  document.getElementById('ai-risk-reason').textContent = result.riskReason || '';
  const ring = document.getElementById('ai-risk-ring');
  ring.className = 'risk-score-ring ' + (score >= 7 ? 'risk-high' : score >= 4 ? 'risk-mid' : 'risk-low');

  // 종목별
  const stocksEl = document.getElementById('ai-stocks');
  const actionClass = a => a === '매수' ? 'ai-action-buy' : a === '매도' ? 'ai-action-sell' : 'ai-action-hold';
  stocksEl.innerHTML = (result.stocks || []).map(s => `
    <div class="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span class="text-sm font-bold text-gray-900 w-24 shrink-0">${s.name}</span>
      <span class="badge ${actionClass(s.action)} shrink-0" style="font-size:11px;padding:3px 10px">${s.action}</span>
      <span class="text-sm text-gray-600 leading-snug">${s.comment}</span>
    </div>`).join('');
}
```

- [ ] **Step 2: `onAiAnalyze()` 함수 추가** (위 섹션 바로 아래)

이 함수는 현재 렌더링된 포트폴리오 데이터를 참조해야 하므로, `lastRenderData` 전역 변수를 사용한다.

먼저 `/* ══ RENDER — ANALYSIS ══ */` 섹션 상단(~line 631)에 전역 변수 선언 추가:

```js
let lastRenderData = null; // { stocks, header, totRate, totValue, date }
```

그리고 `render()` 함수 내에서 `renderAnalysis(...)` 호출 바로 앞에 저장:

```js
  lastRenderData = { stocks, header, totRate, totValue, date };
```

그런 다음 AI 섹션에 `onAiAnalyze()` 추가:

```js
async function onAiAnalyze() {
  if (!getApiKey()) {
    showToast('API 키를 먼저 입력해주세요');
    document.getElementById('ai-key-input').focus();
    return;
  }
  if (!lastRenderData) {
    showToast('먼저 포트폴리오를 분석해주세요');
    return;
  }

  const btn     = document.getElementById('ai-analyze-btn');
  const refresh = document.getElementById('ai-card-refresh');
  const card    = document.getElementById('ai-card');
  const loading = document.getElementById('ai-card-loading');
  const content = document.getElementById('ai-card-content');

  // 버튼 비활성화
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 분석 중...'; }
  if (refresh) refresh.style.pointerEvents = 'none';

  // 카드 로딩 상태
  card.classList.remove('hidden');
  loading.classList.remove('hidden');
  content.classList.add('hidden');

  try {
    const { stocks, header, totRate, totValue, date } = lastRenderData;
    const prompt = buildAiPrompt(stocks, header, totRate, totValue);
    const result = await callClaudeApi(prompt);
    renderAiCard(result, date);
    showToast('✨ AI 분석 완료');
  } catch (e) {
    card.classList.add('hidden');
    loading.classList.add('hidden');
    if (e.message === 'API_KEY_MISSING') {
      showToast('API 키를 먼저 입력해주세요');
    } else if (e.message === 'JSON_PARSE_FAIL') {
      showToast('응답 형식 오류. 다시 시도해주세요');
    } else {
      showToast('AI 분석에 실패했어요. 잠시 후 다시 시도해주세요');
      console.error('[AI]', e);
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>✨</span> AI 분석하기'; }
    if (refresh) refresh.style.pointerEvents = '';
  }
}
```

- [ ] **Step 3: "AI 분석하기" 버튼 노출 처리** — `render()` 함수 끝(`renderGoalCard(totRate);` 아래)에 추가:

```js
  // AI 분석 버튼 노출
  const aiRow = document.getElementById('ai-analyze-row');
  if (aiRow) aiRow.style.removeProperty('display');
```

- [ ] **Step 4: 브라우저에서 전체 흐름 확인**
  1. 포트폴리오 데이터 붙여넣고 "분석 & 저장" → "✨ AI 분석하기" 버튼 등장 확인
  2. API 키 없이 클릭 → "API 키를 먼저 입력해주세요" 토스트 확인
  3. 올바른 API 키 입력 후 저장 → AI 분석 버튼 클릭 → 로딩 스피너 → 결과 카드 렌더링 확인
  4. AI 카드 내 "새로고침" 버튼 클릭 → 재호출 확인

- [ ] **Step 5: 커밋**

```bash
git add index.html
git commit -m "feat: add AI card render and onAiAnalyze flow"
```

---

### Task 6: 엣지 케이스 + 최종 정리

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 스냅샷 로드 시 AI 카드 초기화** — `loadSnapshot()` 함수 내 `render(...)` 호출 바로 앞에 추가:

```js
  // AI 카드 초기화 (다른 스냅샷 로드 시 이전 AI 분석 숨김)
  const aiCard = document.getElementById('ai-card');
  if (aiCard) aiCard.classList.add('hidden');
  const aiRow = document.getElementById('ai-analyze-row');
  if (aiRow) aiRow.style.setProperty('display', 'none', 'important');
```

- [ ] **Step 2: API 키가 있을 때 분석 결과 로드 시 자동으로 버튼만 노출** — 이미 Task 5 Step 3에서 처리됨, 확인만

- [ ] **Step 3: 리스크 점수 10점 초과 방어** — `renderAiCard()` 내 score 처리 부분 확인:
  - `score.toFixed(1)` 표시 전에 `Math.min(10, Math.max(1, score))` 로 클램프

```js
  const clampedScore = isNaN(score) ? null : Math.min(10, Math.max(1, score));
  document.getElementById('ai-risk-score').textContent = clampedScore !== null ? clampedScore.toFixed(1) : '—';
  const ring = document.getElementById('ai-risk-ring');
  ring.className = 'risk-score-ring ' + (clampedScore >= 7 ? 'risk-high' : clampedScore >= 4 ? 'risk-mid' : 'risk-low');
```

Task 5 Step 1에서 작성한 `renderAiCard()` 내 해당 두 줄을 이 코드로 교체.

- [ ] **Step 4: 전체 흐름 최종 검증**
  1. 빈 포트폴리오로 AI 분석 클릭 → "먼저 포트폴리오를 분석해주세요" 토스트
  2. 스냅샷 전환 → AI 카드 숨겨지고 버튼 다시 노출
  3. 리스크 점수 색상 — 낮음(초록), 중간(노랑), 높음(빨강) 각각 확인 (콘솔에서 `renderAiCard({summary:'x',riskScore:2,riskReason:'y',stocks:[]},'2026-04-07')` 직접 호출)

- [ ] **Step 5: 커밋**

```bash
git add index.html
git commit -m "feat: edge cases and polish for AI analysis feature"
```

---

## 구현 완료 체크리스트

- [ ] 왼쪽 패널에 AI 설정 카드 (API 키 입력 + 저장 상태 표시)
- [ ] "✨ AI 분석하기" 버튼 (분석 결과 있을 때만 노출)
- [ ] AI 분석 카드: 오늘 요약, 리스크 점수(링), 종목별 액션+코멘트
- [ ] 로딩 스피너 + 에러 토스트 처리
- [ ] 스냅샷 전환 시 AI 카드 초기화
- [ ] 리스크 점수 1~10 클램프 + 색상 분기
- [ ] API 키 localStorage 저장/복원
