## Coin PnL Dashboard (Binance/Bybit, multi-account)

운영을 전제로 한 **read-only 트레이딩 성과 대시보드**입니다.

- **서버에서만** 거래소 API 호출 (API Key/Secret 프론트 노출 금지)
- **다계정**: env 변수 suffix 기반으로 자동 등록
- **부분 실패 내성**: 특정 계정 API 실패해도 성공한 계정 데이터로 렌더
- **Next.js App Router + TS + Tailwind + shadcn/ui + Recharts + TanStack Query**

### 실행

```bash
cd coin-pnl-web/coin-pnl-dashboard
copy .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` (또는 콘솔에 나온 포트)에서 확인하세요.

### 환경 변수

`.env.local`에 아래 형태로 등록합니다.

```bash
BINANCE_API_KEY=
BINANCE_SECRET=
BYBIT_API_KEY=
BYBIT_SECRET=

BINANCE_API_KEY_JK=
BINANCE_SECRET_JK=
BYBIT_API_KEY_JK=
BYBIT_SECRET_JK=
```

- `*_API_KEY_<SUFFIX>` ↔ `*_SECRET_<SUFFIX>`가 **한 쌍**으로 있어야 계정이 활성화됩니다.
- 개발 중 API 없이 UI 확인이 필요하면 `USE_MOCK_DATA=true`로 실행하세요.

### 주요 페이지

- `/` 대시보드
- `/trades` 거래 내역
- `/analytics` 성과 분석

### 서버 API

- `GET /api/dashboard`
  - query: `preset=7d|30d|90d|all|custom`, `exchange=all|binance|bybit`, `accountIds=...`

### Troubleshooting (Windows)

Windows에서 `npm install` 중 `EPERM`/`ENOTEMPTY`가 간헐적으로 발생할 수 있습니다(백신/파일 잠금).

- 모든 `next dev`/node 프로세스 종료 후 재시도
- 실패 시 `node_modules` 삭제 후 재설치
