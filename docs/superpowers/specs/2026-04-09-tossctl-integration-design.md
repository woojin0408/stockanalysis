# tossctl 연동 설계

**날짜:** 2026-04-09  
**목표:** "토스에서 불러오기" 버튼 하나로 tossctl 포트폴리오 데이터를 자동 로드

---

## 아키텍처

### 추가 파일

**`server.js`** — Node.js 내장 모듈만 사용 (의존성 없음)
- `GET /` → `index.html` 파일 서빙
- `GET /api/portfolio` → `tossctl portfolio positions --output json` + `tossctl account summary --output json` 병렬 실행, 결과 합쳐서 JSON 반환
- CORS 헤더 불필요 (같은 origin에서 서빙)
- 포트: 3737

**`package.json`**
- `"start": "node server.js"` 스크립트

### index.html 변경

**버튼 추가** (입력 카드 상단, textarea 위)
- "토스에서 불러오기" 버튼
- 클릭 시 로딩 스피너 표시

**`loadFromToss()` 함수**
1. `GET /api/portfolio` 호출
2. tossctl JSON → 내부 `stocks` 포맷 변환
3. `saveSnapshot(date, data)` + `render(data, date)` 호출 (textarea 우회)
4. 에러 시 toast 표시

**데이터 매핑 (tossctl → 내부 포맷)**
| tossctl 필드 | 내부 필드 | 변환 |
|---|---|---|
| `name` | `name` | 그대로 |
| `profit_rate` | `rate` | × 100 |
| `unrealized_pnl` | `pnl` | 그대로 |
| `average_price` | `avg` | 그대로 |
| `current_price` | `cur` | 그대로 |
| `quantity` | `qty` | 그대로 |
| `market_value` | `value` | 그대로 |
| `market_value - unrealized_pnl` | `invested` | 계산 |
| `daily_profit_rate` | `dailyRate` | × 100 |
| `daily_profit_loss` | `dailyPnl` | 그대로 |

**헤더 (account summary → header)**
| tossctl 필드 | 내부 필드 |
|---|---|
| `total_asset_amount` | `totalValue` |
| `evaluated_profit_amount` | `totalPnl` |
| `profit_rate` × 100 | `totalRate` |
| stocks dailyPnl 합계 | `dailyPnl` |
| (totalPnl / totalInvested) | `dailyRate` |

**보너스: 티커 자동 등록**
- tossctl 응답에 `symbol` 필드 포함 (RDW, RKLB 등)
- 불러올 때 기존 ticker_map에 없는 종목이면 자동 추가

---

## 사용 흐름

```
npm start           # 서버 시작 (한 번)
브라우저 → http://localhost:3737
"토스에서 불러오기" 클릭 → 자동 로드
```

---

## 에러 처리

- tossctl 세션 만료: "토스 로그인이 필요해요 (`tossctl auth login`)" toast
- 서버 미실행: "서버를 먼저 시작해주세요 (`npm start`)" toast
- 데이터 없음: "종목이 없어요" toast
