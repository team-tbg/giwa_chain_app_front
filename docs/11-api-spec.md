# Naduri — API 스펙 (FE↔BE 계약 초안 v0.4)

> 최종 업데이트: 2026-07-22 · 상태: **백엔드 미개발 → 이 문서를 백엔드 팀에 넘긴다.**
> 기준: [prototype/naduri_v10.html](./prototype/naduri_v10.html) · 규칙: [08-dev-context-primer](./08-dev-context-primer.md) · [CLAUDE.md](../CLAUDE.md)
> 이 문서는 **계약(요청/응답 형태)** 을 정의한다. 내부 구현(원장 스키마·이자 배치·정산)은 [08 BE 섹션] 참고.
>
> **v0.4 변경**: 구글 로그인 획득 방식 명시(네이티브=google-signin SDK/SHA-1, 웹=expo-auth-session) · 걸음 소스 = Health Connect(백그라운드) + 가속도계 폴백 + 가입 기준선. `/auth/social` 계약 자체는 동일(id_token 검증).
> **v0.3 변경**: 로그인 provider를 **구글**로 확정(이메일 제외). 토스=심사 문턱, **카카오=가상자산 제한 정책으로 제외**, 2차 소셜은 네이버 검토 중. `provider`/`authCode` 필드는 2차 소셜 대비 예약.
> **v0.2 변경**: `/auth/social`에 `referralCode`(가입 전 입력분) 추가 · `/cash/deposit`에 결제수단 enum, 입금 리스크 박스 제거 · 손실 고지는 변동 자산(BTC/금) 구매 시점으로(§8·§11·§13).

---

## 0. 공통 규약 (Conventions)

- **Base URL**: `https://api.naduri.app/v1` (스테이징 `https://api.stg.naduri.app/v1`). FE는 `EXPO_PUBLIC_API_BASE_URL` 로 주입.
- **프로토콜**: HTTPS · REST · JSON(UTF-8). 요청/응답 본문 `Content-Type: application/json`.
- **인증**: `Authorization: Bearer <accessToken>` (JWT). 액세스 토큰 만료 시 `/auth/refresh`. **`/auth/*` 와 `/config` 외 모든 엔드포인트는 Bearer 필수.**
- **금액 표현 (중요)**:
  - 포인트 `P`: **정수**(원 단위 소수 없음). 필드 접미사 `...P` 또는 `points`.
  - 원화 `KRW`: **정수**(원). 필드 접미사 `...Krw`.
  - 자산 수량(BTC/PAXG): **문자열 소수**(부동소수 오차 방지). BTC 8자리, PAXG 6자리. 예: `"0.00006313"`.
  - 이자 등 실시간 누적값은 `accrued...` 로 서버가 조회 시점에 계산해 내려준다.
  - **확정 % 를 계약으로 노출하지 않는다**(규칙 3). 이자는 항상 "붙은 금액"으로 응답.
- **멱등성**: 모든 금전 뮤테이션(적립·전환·저금·입출금·되팔기)은 `Idempotency-Key: <uuid>` 헤더 필수. 같은 키 재요청 시 최초 결과를 그대로 반환.
- **시간**: ISO-8601 UTC (`2026-07-22T04:15:00Z`).
- **페이지네이션**: 커서 기반. 요청 `?cursor=&limit=20`, 응답 `{ items, nextCursor }`. `nextCursor=null` 이면 끝.
- **에러 봉투**:
  ```json
  { "error": { "code": "INSUFFICIENT_POINTS", "message": "포인트가 부족해요", "detail": { "shortP": 1200 } } }
  ```
  - HTTP 상태: 400 검증, 401 인증, 403 권한, 404 없음, 409 충돌/멱등, 422 규칙위반(한도초과 등), 429 rate limit, 5xx 서버.
  - `message` 는 **유저 노출 가능한 한국어**(규칙 1: 정직). 코드 목록은 §12.
- **버전**: 경로 `/v1`. 파괴적 변경은 `/v2`.

---

## 1. 인증 (Auth) — 소셜 로그인

SNS 간편 로그인(**구글** 확정, 2차 소셜은 네이버 검토 중). 클라이언트가 provider 토큰/인가코드를 획득 → 서버가 검증 후 자체 JWT 발급. **지갑(임베디드/AA)은 최초 로그인 시 서버가 자동 생성**(규칙 5).

### POST /auth/social
소셜 로그인/회원가입(최초면 가입). 멱등적(같은 provider 계정이면 동일 유저).

요청:
```json
{
  "provider": "google",            // 현재 "google"만 (이메일 제외, 2차 소셜 미정)
  "idToken": "<google id_token>",  // google: OIDC id_token
  "authCode": null,                 // 예약: 2차 소셜(인가코드 방식)용 — provider별 택1
  "referralCode": "NADURI7",        // (선택) 로그인 화면에서 미리 넣은 추천인 코드. 가입 시 +500P 적용
  "device": { "os": "android", "pushToken": "<fcm>" }
}
```
> 추천인 코드는 로그인 전에도 입력 가능(v10). 클라이언트가 값을 들고 있다가 `/auth/social` 에 함께 넘긴다. 지급 시점은 v10 문구대로 **신규 가입 + 첫 걸음 적립 시** +500P(피추천/추천 양쪽, 1회, 일일 한도 제외). 부정 방지·정확한 지급 트리거는 §14 오픈이슈. 로그인 후 입력은 §10 `/invite/redeem`.
응답 `200`:
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "expiresIn": 3600,
  "isNewUser": true,
  "user": {
    "id": "usr_01H...",
    "nickname": "나드리회원",
    "provider": "google",
    "wallet": { "upid": "naduri7.up", "address": "0x7A3f...4E27", "network": "GIWA" }
  }
}
```

### POST /auth/refresh
요청 `{ "refreshToken": "<jwt>" }` → 응답 `{ accessToken, refreshToken, expiresIn }`.

### POST /auth/logout
요청 `{ "refreshToken": "<jwt>" }` (푸시 토큰 해제 포함) → `204`.

> **FE 연동 메모**: 구글 `id_token` 획득 방식이 플랫폼별로 다르다. **네이티브(안드로이드/iOS)=`@react-native-google-signin/google-signin`**(공식 SDK — expo-auth-session implicit id_token은 안드로이드에서 `invalid_request`라 사용 불가), **웹=`expo-auth-session`**. 획득한 `id_token`(aud=Web 클라이언트 ID)을 `/auth/social` 로 → 서버가 검증. 필요한 값: 구글 Web/Android/iOS 클라이언트 ID. **⚠️ 안드로이드는 콘솔 Android OAuth 클라이언트에 그 빌드의 SHA-1이 등록돼야 함**(`expo run:android` 디버그빌드는 `android/app/debug.keystore` 기준). JWT는 `expo-secure-store`. (2차 소셜은 미정.)

---

## 2. 유저 / 프로필 (Me)

### GET /me
응답: `user`(위) + `notificationSettings`.

### PATCH /me
요청 `{ "nickname": "새이름" }` → `200` 갱신된 user.

### GET /me/summary
홈 상단·요약용 한 방 호출. **또한 앱 부팅 시 '오늘 상태' 복원의 단일 소스**(아래 참고).
```json
{
  "points": 30154,
  "todayEarnedP": 40,
  "todayBonusP": 0,
  "dailyCapP": 200,
  "streakDays": 7,
  "steps": { "today": 6432, "goal": 10000, "claimableP": 64, "claimed": false },
  "attendance": { "todayChecked": false },
  "bonus": { "nextAvailableAt": "2026-07-25T06:00:00Z" },
  "savings": { "pointStakeP": 0, "pointAccruedP": "0.00", "cashStakeKrw": 0, "cashAccruedKrw": "0.00" },
  "assetsKrw": { "cash": 0, "btc": 0, "gold": 0 },
  "netWorthKrw": 30154
}
```
> `todayBonusP`(오늘 받은 보너스 합계)와 `attendance.todayChecked`·`bonus.nextAvailableAt` 는 **부팅 복원용으로 추가 권장**(기존 §5 상태조회와 중복이지만 요약 1콜로 끝내기 위함).

### 세션 · 일일상태 복원 (Boot rehydrate)  ★ 재실행 지속성
앱을 껐다 켜도 **로그인 유지 + '오늘 이미 한 것'(걸음/출석/보너스) 표시가 유지**되어야 한다(오프체인 상태는 서버가 진실).

1. **로그인 유지**: 토큰은 기기 보안 저장소(SecureStore)에 보관. 부팅 시 토큰이 있으면 로그인 화면을 건너뛰고 메인으로. 닉네임은 `GET /me`(또는 로컬 캐시)로 표시.
2. **오늘 상태 복원**: 로그인 상태면 `GET /me/summary` 한 번으로 `points·todayEarnedP·todayBonusP·streakDays·steps.claimed·attendance.todayChecked·bonus.nextAvailableAt·savings` 를 받아 로컬에 반영한다. 이게 없으면 걸음 재적립 버튼이 다시 활성화되거나(실제론 서버가 409), 보너스가 "열 수 있음"으로 보였다가 열면 실패(429)하는 **표시 불일치**가 생긴다.
3. **폴백(현재 구현)**: `GET /me/summary` 가 아직 백엔드에 없으면, FE는 `GET /points/history` 를 스캔해 오늘(UTC)의 `STEP_CLAIM`/`ATTENDANCE` 존재 → `claimed`/`todayChecked`, 최신 `BONUS.createdAt` → 보너스 쿨다운, 오늘 `countsToDailyCap` 합 → `todayEarnedP` 를 도출한다. **`/me/summary` 구현 시 이 폴백을 대체할 것.**

> ⚠️ 현재 백엔드는 **액션만** 구현: `POST /v1/rewards/attendance`, `POST /v1/rewards/bonus`(아래 §5의 `/checkin`·`/open` 대신 이 경로). **상태조회(`GET /rewards/*`, `GET /me/summary`)는 미구현** → 위 3의 폴백으로 동작 중.

### GET /me/notification-settings · PATCH /me/notification-settings
`{ "push": true, "bonusReminder": true }`.

---

## 3. 걷기 / 적립 (Steps)

> **걸음수는 프론트(기기)에서 관리하고 DB에 저장하지 않는다.** 활동·위치 데이터를 서버에 축적하지 않기 위함(규칙 6, 프라이버시). 서버로 오는 건 **"적립 요청"뿐** — 걸음 원본이 아니라 그 결과 포인트만 원장에 남는다. 별도 `/steps/sync`·`/steps/today`는 두지 않는다.
>
> **걸음 소스(FE)**: ① 안드로이드 **Health Connect**(`react-native-health-connect`) = OS가 백그라운드(앱 꺼져 있어도)에서 센 "오늘 총 걸음" 조회 → 캐시워크식. 실제로 걸음을 세는 건 삼성헬스/구글핏이 HC에 써줌. ② 실패/미지원 시 **가속도계 폴백**(포그라운드만). **가입(첫 실행) 시점 기준선**을 둬서 설치 당일은 그 이후 걸음만 크레딧(설치 전 걸음 제외), 이후엔 자정부터 전체.

### POST /steps/claim  `Idempotency-Key`
걸어서 받을 포인트를 적립(하루 1회, **만보 최대 100P** · 일일 한도 200P 반영). FE가 측정한 걸음수 기반 요청.
요청 `{ "steps": 6432 }`  (클라이언트 측정값. 서버는 상한/한도로 방어)
응답 `200`:
```json
{ "grantedP": 64, "pointsAfter": 30218, "todayEarnedP": 104, "dailyCapP": 200, "walkMaxP": 100, "cappedByDaily": false }
```
`409 ALREADY_CLAIMED` — 오늘 이미 받음. `422 DAILY_CAP_REACHED` — 한도 초과(`detail.remainingP`).
> 걸음수 위변조 방지는 서버측 상한(100P/일)·일일 한도·1일 1회로 최소 방어. 강한 무결성이 필요하면 별도 검증 설계(§14).

---

## 4. 포인트 원장 (Points)

### GET /points/balance
`{ "points": 30154 }`.

### GET /points/history  `?cursor=&limit=&type=`
활동/전환 내역(더블엔트리 원장의 유저 뷰).
```json
{
  "items": [
    { "id": "led_...", "type": "STEP_CLAIM", "deltaP": 64, "reason": "걸음 포인트",
      "countsToDailyCap": true, "createdAt": "2026-07-22T04:15:00Z" },
    { "id": "led_...", "type": "SHOP_REDEEM_CASH", "deltaP": -11000, "reason": "포인트를 현금으로",
      "countsToDailyCap": false, "createdAt": "..." }
  ],
  "nextCursor": "eyJ..."
}
```
`type` enum: `STEP_CLAIM, ATTENDANCE, BONUS, QUIZ, VIDEO, GAME, ROULETTE, GACHA, SURVEY, INVITE, SHOP_REDEEM_CASH, SHOP_BUY_BTC, SHOP_BUY_GOLD, STAKE, UNSTAKE, ADJUST`.

---

## 5. 혜택 / 미니게임 (Rewards)

공통: 적립형은 `Idempotency-Key`, 응답에 `grantedP` + 한도 상태 포함. 일일 한도 적용 여부는 서버 권위(걸음·출석·퀴즈·게임·영상=적용 / 보너스·룰렛·설문·초대=제외).

공통 적립 응답 형태:
```json
{ "grantedP": 5, "pointsAfter": 30159, "todayEarnedP": 109, "dailyCapP": 200, "countsToDailyCap": true }
```

| 기능 | 상태 조회 | 액션 |
|------|-----------|------|
| 출석체크 | `GET /rewards/attendance` → `{ streakDays, todayChecked, calendar[] }` | `POST /rewards/attendance/checkin` |
| 오늘의 보너스 | `GET /rewards/bonus` → `{ nextAvailableAt, remainingToday }` | `POST /rewards/bonus/open` (한도 제외) |
| 영상 보고 받기 | `GET /rewards/video` → `{ remainingToday, rewardTable }` | `POST /rewards/video/complete { adId }` |
| 게임하고 받기 | `GET /rewards/game` → `{ bestScore, remaining }` | `POST /rewards/game/submit { score, nonce }` (서버 검증) |
| 나드리 뽑기 | `GET /rewards/gacha` → `{ costP, prizePool[] }` | `POST /rewards/gacha/draw` (costP 차감, **기대값 ≥ 참가비: 규칙 8**) |
| 행운 룰렛 | `GET /rewards/roulette` → `{ usedToday, segments[] }` | `POST /rewards/roulette/spin` (한도 제외) |
| OX 금융퀴즈 | `GET /rewards/quiz` → `{ solvedToday, dailyLimit, question }` | `POST /rewards/quiz/answer { quizId, answer }` → `{ correct, explanation, grantedP }` |
| 설문 | `GET /rewards/survey` → `{ done, questions[] }` | `POST /rewards/survey/submit { answers }` (한도 제외) |

> **규칙 8(뽑기)**: `prizePool` 의 기대값이 `costP` 이상이 되도록 서버가 보장. FE는 경품 구성을 정직하게 표기.

---

## 6. 이자받기 / 저금 (Savings)

포인트 저금 / 원화 저금 2트랙. 이자는 파일럿 재원 시뮬레이션(§08 BE). **확정 % 미노출 — 붙은 금액으로 응답.**

### GET /savings
```json
{
  "point": { "principalP": 5000, "accruedP": "12.34", "startedAt": "...", "todayAccruedP": "3.20" },
  "cash":  { "principalKrw": 100000, "accruedKrw": "45.67", "startedAt": "...", "todayAccruedKrw": "12.00" }
}
```

### POST /savings/point/stake  `Idempotency-Key`
`{ "amountP": 5000 }` → `{ point: {...}, pointsAfter }`. 부족 시 `422 INSUFFICIENT_POINTS`.

### POST /savings/point/unstake  `Idempotency-Key`
`{}`(전액) 또는 `{ "amountP": 2000 }` → 원금+이자를 `points`로. **언제든 가능(규칙 2)**.

### POST /savings/cash/stake · POST /savings/cash/unstake  `Idempotency-Key`
`{ "amountKrw": 100000 }` / `{}`. 원화 자산↔저금 이동.

---

## 7. 원화 입출금 (Cash)

### POST /cash/deposit  `Idempotency-Key`
원화를 내 자산에 충전(v10: 결제수단 선택 후 입금). 입금 자체는 원화 충전이라 손실이 없다 → **입금 화면엔 원금 비보장 박스를 넣지 않는다**(v10). 손실 고지는 변동 자산(BTC/금) 구매 시점에(§8·§13 규칙 4).
요청:
```json
{ "amountKrw": 100000, "method": "toss" }
```
- `method` enum: `toss | kakaopay | naverpay | card | bank_transfer | simulated`(파일럿). 실서비스는 PG 승인 결과를 서버가 검증 후 반영.
응답 `200`:
```json
{ "cashKrw": 100000, "method": "toss" }
```
> 입금한 돈은 이자를 안 받는 상태로 내 자산에 쌓인다. 이자는 `/savings/cash/stake` 로 저금해야 붙는다.

### POST /cash/withdraw  `Idempotency-Key`  ★ 규칙 2
**한 번의 호출로 완결. 서버는 마찰·인질형 게이팅을 넣지 않는다.**
요청 `{ "amountKrw": 50000, "bankAccountId": "bank_..." }`
응답 `202`:
```json
{ "withdrawalId": "wd_...", "amountKrw": 50000, "status": "pending", "etaBusinessDays": "1~3", "createdAt": "..." }
```

### GET /cash/withdrawals  `?cursor=&limit=`
`{ items: [{ withdrawalId, amountKrw, status: "pending|done|failed", createdAt }], nextCursor }`.

### 출금 계좌
- `GET /me/bank-accounts` → `[{ id, bankName, maskedNumber, holder }]`
- `POST /me/bank-accounts` `{ bankCode, number, holder }` → 계좌 등록(1원 인증 등은 실서비스).
- `DELETE /me/bank-accounts/{id}`.

---

## 8. 포인트샵 (Shop) — 전환 (규칙 7)

포인트를 현금·비트코인·금·쿠폰으로. **카테고리**: `cash | btc | gold | coupon`.

### GET /shop/products  `?category=`
```json
{
  "items": [
    { "id": "prod_cash_10k", "category": "cash", "name": "현금 10,000원", "costP": 11000, "valueKrw": 10000 },
    { "id": "prod_btc_10k", "category": "btc", "name": "비트코인 10,000원어치", "costP": 10800, "valueKrw": 10000 },
    { "id": "prod_gold_50k", "category": "gold", "name": "금 50,000원어치", "costP": 53000, "valueKrw": 50000 },
    { "id": "prod_cafe_ame", "category": "coupon", "name": "아메리카노 교환권", "costP": 4500, "brand": "카페" }
  ]
}
```
자산 상품은 `valueKrw` 를 **주문 시점 오라클 시세**로 수량 환산(응답에 확정 수량 포함).

### POST /shop/redeem  `Idempotency-Key`
`{ "productId": "prod_btc_10k" }`
- cash: 응답 `{ "kind": "cash", "spentP": 11000, "cashKrw": 10000, "pointsAfter": 19154 }`
- btc/gold: `{ "kind": "btc", "spentP": 10800, "qty": "0.00006313", "priceKrw": 158400000, "pointsAfter": ... }`
- coupon: `{ "kind": "coupon", "couponId": "cpn_...", "pointsAfter": ... }`
- 부족: `422 INSUFFICIENT_POINTS { detail.shortP }`.
> **규칙 4 (정직 고지)**: btc/gold 상품은 구매 확인 단계에서 **"값이 오르내리는 자산이에요. 산 금액보다 적어질 수 있고, 실물 배송은 지원하지 않아요."** 를 FE가 노출(v10). 문구는 `/config.disclosures.assetVolatility`.

---

## 9. 자산 (Assets) — 비트코인 / 금

### GET /assets
```json
{
  "holdings": [
    { "kind": "btc", "qty": "0.00006313", "valueKrw": 10000, "priceKrw": 158400000 },
    { "kind": "gold", "qty": "0.000000", "valueKrw": 0, "priceKrw": 4620000 }
  ]
}
```

### GET /assets/prices
`{ "btc": 158400000, "gold": 4620000, "asOf": "...", "source": "upbit-oracle" }`.

### POST /assets/{kind}/sell  `Idempotency-Key`  (kind: btc|gold)
`{ "qty": "0.00006313" }` 또는 `{ "all": true }` → 원화 자산으로.
응답 `{ "kind": "btc", "soldQty": "0.00006313", "creditedKrw": 10000, "cashKrw": ... }`.
> 매수는 §8 `/shop/redeem`. 커스터디·환전은 업비트(VASP) 처리 구조(§08 BE).

---

## 10. 내 지갑 / 쿠폰 / 초대

### GET /wallet
```json
{
  "netWorthKrw": 30154,
  "breakdown": [
    { "key": "points", "label": "쓸 수 있는 포인트", "valueKrw": 30154, "display": "30,154P" },
    { "key": "pointStake", "label": "이자 받는 포인트", "valueKrw": 0, "display": "0P" },
    { "key": "cash", "label": "원화 자산", "valueKrw": 0, "display": "0원" },
    { "key": "btc", "label": "비트코인", "valueKrw": 0, "display": "0.00000000 BTC" },
    { "key": "gold", "label": "금 PAXG", "valueKrw": 0, "display": "0.000000 PAXG" }
  ],
  "wallet": { "upid": "naduri7.up", "address": "0x7A3f...4E27", "network": "GIWA" }
}
```
- `GET /wallet/address` → 전체 주소(복사용). 시드/개인키는 **API로 내리지 않고** 고급설정 별도 인증 흐름(실서비스).

### 쿠폰함
- `GET /coupons` → `{ items: [{ id, name, brand, code, barcode, expiresAt, used }] }`
- `POST /coupons/{id}/use` → `{ used: true }`.

### 초대
- `GET /invite` → `{ code: "NADURI7", rewardP: 500, invitees: [{ maskedName, status: "wait|join|paid" }] }`
- `POST /invite/redeem` `{ "code": "FRIEND7" }` → `{ grantedP: 500 }`(한도 제외, 1계정 1회).

---

## 11. 메타 / 설정 (Config)

### GET /config
앱 부팅 시 1회. 하드코딩 회피용.
```json
{
  "dailyCapP": 200,
  "assets": { "btcPrecision": 8, "goldPrecision": 6 },
  "featureFlags": { "shopBtc": true, "shopGold": true, "gacha": true },
  "disclosures": {
    "assetVolatility": "값이 오르내리는 자산이에요. 산 금액보다 적어질 수 있고, 실물 배송은 지원하지 않아요.",
    "interestVariable": "이자율은 시장 상황에 따라 달라질 수 있어요.",
    "cashConvert": "바꾼 현금은 내 자산에 쌓여요. 바로 출금해도 되고, 두고 이자를 받아도 돼요."
  }
}
```

---

## 12. 에러 코드 (요약)

| code | HTTP | 의미 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 토큰 없음/만료 |
| `INVALID_PROVIDER_TOKEN` | 401 | 소셜 토큰 검증 실패 |
| `INSUFFICIENT_POINTS` | 422 | 포인트 부족 (`detail.shortP`) |
| `INSUFFICIENT_BALANCE` | 422 | 원화/자산 부족 |
| `DAILY_CAP_REACHED` | 422 | 일일 적립 한도 초과 (`detail.remainingP`) |
| `ALREADY_CLAIMED` | 409 | 오늘 이미 받음 |
| `IDEMPOTENCY_CONFLICT` | 409 | 같은 키·다른 본문 |
| `RATE_LIMITED` | 429 | 과요청 |
| `VALIDATION_ERROR` | 400 | 요청 형식 오류 |

---

## 13. 규칙 매핑 (가드레일 → API)

- **규칙 2 (원탭 출금)**: `/cash/withdraw`, `/assets/*/sell`, `/savings/*/unstake` 는 단일 호출로 완결. 서버가 선행 조건(입금 강요 등)을 걸지 않는다.
- **규칙 3 (확정% 금지)**: 이자/수익은 금액 필드로만. `apy`/`rate` 를 계약에 노출하지 않는다.
- **규칙 4 (손실 감언이설 금지)**: 손실 고지는 **변동 자산(btc/gold) 구매 시점**에(`/config.disclosures.assetVolatility`). 원화 입금 화면엔 리스크 박스를 넣지 않는다(입금=원화 충전, 손실 없음).
- **규칙 7 (전환 허용)**: `/shop/redeem` 로 현금·코인·쿠폰 전환.
- **규칙 8 (뽑기 EV)**: `/rewards/gacha` prizePool 기대값 ≥ costP.
- **일일 한도**: 서버 권위. 응답에 항상 `todayEarnedP/dailyCapP` 동봉.

---

## 14. 오픈 이슈 (백엔드와 확정 필요)

1. 이자 계산 방식(초당 accrue vs 배치)과 재원 회계 분리 세부.
2. 자산 매수/매도 시 업비트 VASP 연동 인터페이스(정산·커스터디 경계).
3. 2차 소셜 로그인 미정(구글만 확정). 토스=심사 문턱, 카카오=가상자산 제한 정책 제외, 네이버=보류. 추가 시 provider 분기.
4. 게임 점수 위변조 방지(서버 검증 nonce/서명) 설계.
5. 포인트↔원화 전환 비율(현재 예: 11,000P=10,000원)의 소스·변동 여부.
6. 추천인 코드: 가입 전 입력분을 `/auth/social.referralCode` 로 처리(피추천·추천 양쪽 지급 시점·부정 방지).
7. 쿠폰/기프티콘 상품 소싱·재고·바코드 발급 연동(제휴사).
8. 걸음 수 신뢰(기기 센서 위변조 방지)와 `/steps/sync` 서버측 검증 정책.
