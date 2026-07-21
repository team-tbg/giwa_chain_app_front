# 디자인 — 라이트 테마 · 핀테크 블루 (v1)

> 대상: 디자이너 + FE(React Native). 프로토타입: [prototype/naduri-prototype.html](./prototype/naduri-prototype.html)
> 토큰 구현: [src/theme/theme.ts](../src/theme/theme.ts)
> 방향: **하얀 배경** + 진회색 텍스트. 강조 = **딥블루(신뢰·핀테크)**, 리워드/포지티브 = 그린.

## 컬러 토큰

| 토큰 | HEX | 용도 |
|------|-----|------|
| `bg` | `#FFFFFF` | 앱 배경 (화이트) |
| `surface` | `#FFFFFF` | 카드 (경계선 + 옅은 그림자로 분리) |
| `surface2` | `#F4F6FA` | 입력/보조 채움 (블루기 그레이) |
| `panel`(=panelDeep) | `#EAF1FF` | 히어로·전환 패널 (연블루 틴트) |
| `primary`(=mint) | `#2563EB` | **주 강조** — 주요 버튼/전환/네비 |
| `primaryDeep` | `#1D4ED8` | 눌림 |
| `primarySoft` | `rgba(37,99,235,0.10)` | 블루 틴트 배경 |
| `onPrimary` | `#FFFFFF` | 블루 위 텍스트 |
| `reward`(=honey) | `#059669` | **리워드/포지티브** — 성장·받기 |
| `rewardSoft` | `rgba(5,150,105,0.10)` | 그린 틴트 |
| `ink` | `#16202E` | 본문 텍스트 (블루기 근-검정) |
| `muted` | `#6B7686` | 보조 텍스트 |
| `line` | `#E7EBF1` | 구분선/테두리 |
| `warn` | `#B45309` | 리스크·주의 고지 텍스트 |
| `warnSoft` | `rgba(245,158,11,0.12)` | 주의 배너 배경 |

- **의미색 분리**: 액션/네비 = 블루, 돈이 늘어나는 포지티브 = 그린, 리스크 = 앰버.
- 대비: `ink`/`primary`/`muted` 모두 화이트 위 WCAG AA. `reward`/`primary`는 버튼 배경(흰 라벨) 시 큰 텍스트 AA.
- (하위 호환: 코드의 `mint`/`honey`/`panelDeep`는 각각 `primary`/`reward`/`panel` 별칭)

## 타이포그래피

- **한글 폰트**: Pretendard 우선, 폴백 `-apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR'`
- **타깃 40~50대** → 큰 글씨·굵은 대비·넉넉한 터치. 숫자는 `tabular-nums`.

| 역할 | 크기/굵기 |
|------|-----------|
| Display (h1) | 28 / 800 |
| Heading (h2) | 22 / 800 |
| 큰 숫자 | 46 / 800, tabular |
| 본문/서브 | 16 / 500 |
| 라벨 | 14 / 700 |
| 캡션·고지 | 13 / 500 |

- 주요 버튼 높이 58~62px.

## 레이아웃 원칙

- 화이트 배경, 카드 기반. 카드는 **경계선 + 옅은 그림자**(`cardShadow`)로 분리(라이트에선 명도차만으로 부족).
- 하단 탭(홈/불리기/내 정보) 상시. (unifi식 "내 자산" 분리는 검토 항목)
- 정보 위계: 요약(걸음·받을 리워드) → 상세. 상태는 pill/칩으로 한눈에.

## 카피 — 정직성 규칙 (불변 규칙과 정합)

[08-dev-context-primer](./08-dev-context-primer.md) 규칙을 UI 카피에 강제:

- **체험 예치**: "원금 걱정 없어요"는 여기서 참(걸어서 번 리워드만) — 범위 명시.
- **원금 전환**: 내 원화가 들어가는 순간 → **"원금 보장 안 됨 · 손실 가능"** 명시. "걱정 없어요" 금지.
- **미래 금액/이자**: 항상 가정형 + "달라질 수 있어요". **확정 % 금지**(벤치마크 unifi가 8%/3% 노출하는 것과 명확히 다르게 감).
- **출금**: 3탭 이내, 확인 다이얼로그로 막지 않음.
- 체인 용어(지갑/가스/시드/스왑/코인명/퍼센트)는 노출 금지.

## RN 매핑 메모

- 토큰은 `src/theme/theme.ts`의 `colors/radii/spacing/typography/cardShadow`.
- 라이트 단일 테마로 출시. 다크는 추후 필요 시 토큰만 스왑.
- 이자 카운트업은 setInterval/reanimated로(현재 `BoostDashboardScreen`의 `tickGrowth`).
