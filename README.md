# 나드리 (Naduri) — 프론트엔드

걷기(만보기)로 크립토 무경험자를 입장시켜, 걸어서 번 공돈으로 디파이를 처음 맛보게 하고, 그 신뢰로 원금 예치까지 데려오는 **안드로이드 우선 모바일 앱**. GIWA 체인(OP Stack EVM L2) 기반, GASOK 공모전 출품작.

> 배경·규칙·디자인은 [docs/](./docs/README.md) 참고. **불변 규칙**은 반드시 [docs/08-dev-context-primer.md](./docs/08-dev-context-primer.md)를 먼저 읽을 것.

## 스택

- **React Native + Expo** (SDK 57), TypeScript
- **네비게이션**: React Navigation (native-stack + bottom-tabs)
- **만보기**: `expo-sensors` Pedometer (실기기 전용)
- **테마**: 라이트 · 핀테크 블루 단일 테마 — 토큰은 [src/theme/theme.ts](./src/theme/theme.ts) / 문서 [docs/09](./docs/09-design-theme.md)

## 실행

```bash
npm install
npm run android   # 안드로이드 (기기/에뮬레이터)
npm start         # Expo Dev Server (QR → Expo Go)
```

> 만보기는 실기기에서만 실제 걸음이 잡힙니다. 에뮬레이터/웹에서는 데모용 목업 값으로 동작합니다.

## 구조

```
App.tsx                     앱 진입 (Provider + NavigationContainer)
src/
  theme/theme.ts            디자인 토큰 (색·타이포·간격)
  state/AppState.tsx        파일럿용 오프체인 상태(목업 포인트 원장)
  hooks/usePedometer.ts     만보기 훅
  components/               Screen, ui(Button/Card/Pill/Amount)
  navigation/               RootNavigator, MainTabs, types
  screens/
    OnboardingScreen        0. 온보딩(무해한 입장)
    OnboardingScreen        온보딩=로그인(SNS 간편 — 구글) + 추천인 코드
    HomeScreen              1. 홈 · 걷기/적립 (탭)
    BoostTabScreen          불리기 탭
    ProfileScreen           내 정보 탭(계정·설정·로그아웃)
    boost/
      BoostIntroScreen      2. 체험 예치(원금 리스크 0)
      BoostDashboardScreen  3. 체험 대시보드
      WithdrawMomentScreen  4. ★ 출금 모멘트(전환의 심장)
      PrincipalScreen       5. 원금 전환(원금 비보장 고지)
      DoneScreen            6. 완료
```

## 지금 단계 (테스트넷 / 파일럿)

- **만든다**: 로그인, 걷기·적립, 오프체인 포인트, 체험 예치 UX, 이자 시뮬레이션, 출금 모멘트 전환.
- **아직 안 만든다**: 실제 온체인 풀, 업비트 연동, 광고 SDK, 토큰 — 후속(파트너십/메인넷 전제).
- **MVP-now 우선순위**: 로그인 + 만보기 + 포인트(리워드) 조회.
- **시연 기준**: 실제 구현이라 생각하고 진행 — 화면에 "목업/데모/다음 단계" 같은 표기 노출 금지.

## 반드시 지킬 것 (요약)

유저를 속이지 않는다 · 출금은 항상 원탭·진짜 열림 · 확정 수익률 금지(가정형+변동 가능) · 원금 예치 화면엔 원금 비보장 고지 · 체인 용어(지갑/가스/시드/스왑) UI 노출 금지. 상세: [docs/08](./docs/08-dev-context-primer.md).
