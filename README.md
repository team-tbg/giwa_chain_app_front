# 나드리 (Naduri) — 프론트엔드

걷기(만보기)로 크립토 무경험자를 입장시켜, 걸어서 번 공돈으로 디파이를 처음 맛보게 하고, 그 신뢰로 원금 예치까지 데려오는 **안드로이드 우선 모바일 앱**. GIWA 체인(OP Stack EVM L2) 기반, GASOK 공모전 출품작.

> 배경·규칙·디자인은 [docs/](./docs/README.md) 참고. **불변 규칙**은 반드시 [docs/08-dev-context-primer.md](./docs/08-dev-context-primer.md)를 먼저 읽을 것.

## 백엔드 연동

`EXPO_PUBLIC_API_BASE_URL` 이 설정되고 로그인 세션(토큰)이 있으면 **서버가 진실의 원천**, 없으면(둘러보기/데모) 로컬 목업으로 동작한다(자동 폴백). API 계층은 [src/api/](./src/api/), 연동 지점은 [src/state/AppState.tsx](./src/state/AppState.tsx).

| 기능 | 엔드포인트 | 상태 |
|---|---|---|
| 로그인 | `POST /auth/social` | ✅ |
| 포인트 잔액·원장 | `GET /points/balance`·`/history` | ✅ (로그인 시 `hydrate`로 동기화) |
| 걸음 적립 | `POST /steps/claim` | ✅ |
| 출석체크 | `POST /rewards/attendance` | ✅ |
| 오늘의 보너스 | `POST /rewards/bonus` | ✅ (금액은 서버 추첨) |
| 이자받기(포인트 저금/해제) | `POST /savings/point/stake`·`/unstake` | ✅ (온체인 볼트 — 서버에 릴레이어 키 필요) |

> 실기기 USB 테스트: 백엔드를 `127.0.0.1:8000`에 띄우고 `adb reverse tcp:8000 tcp:8000` 후 `.env` 를 `http://localhost:8000/v1` 로.

## 스택

- **React Native + Expo** (SDK 57), TypeScript
- **네비게이션**: React Navigation (native-stack + bottom-tabs)
- **만보기**: `expo-sensors` Pedometer (실기기 전용)
- **테마**: 라이트 · 핀테크 블루 단일 테마 — 토큰은 [src/theme/theme.ts](./src/theme/theme.ts) / 문서 [docs/09](./docs/09-design-theme.md)

## 실행

> ⚠️ 이 앱은 네이티브 모듈(구글 로그인 · 하드웨어 만보 센서)을 쓰는 **Dev Client** 앱입니다.
> **Expo Go 로는 실행되지 않습니다.** 아래 순서로 개발 빌드를 기기/에뮬레이터에 한 번 설치한 뒤 개발하세요.

### 0. 사전 준비 (최초 1회)

- **Node.js 18+** 와 **JDK 17**
- **Android Studio** — SDK(Android 14 / API 34+), 그리고 다음 중 하나:
  - 실기기: USB 케이블 + 개발자 옵션에서 **USB 디버깅** 켜기
  - 에뮬레이터: AVD(가상 기기) 하나 생성
- `adb` 가 PATH 에 잡히는지 확인: `adb devices` 실행 시 연결한 기기가 목록에 떠야 합니다.

### 1. 의존성 설치 & 환경변수

```bash
npm install
cp .env.example .env    # 값 채우기 (아래 참고)
```

`.env` 에 최소한 아래 값이 필요합니다 (자세한 설명은 [.env.example](./.env.example)):

| 변수 | 값 |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | 실기기: `https://api.stg.naduri.app/v1` · 로컬 목서버: 실기기 `http://<PC-IP>:3000/v1`, 에뮬레이터 `http://10.0.2.2:3000/v1` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | 구글 OAuth 웹 클라이언트 ID |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | 구글 OAuth Android 클라이언트 ID |

> `.env` 값을 바꾼 뒤에는 `npx expo start -c` 로 캐시를 비우고 재시작해야 반영됩니다.

### 2. 개발 빌드 설치 & 실행 (USB 로 폰에 바로 설치)

폰을 **USB 로 연결**하고 개발자 옵션 → **USB 디버깅**을 켠 뒤, `adb devices` 에 폰이 뜨는지 확인하세요. 그다음:

```bash
npx expo run:android      # (= npm run android) 네이티브 앱을 컴파일해 USB 로 연결된 폰에 설치 + 실행 + Metro 시작
```

이 한 줄이 **컴파일 → 폰에 앱 설치 → 자동 실행**까지 다 해줍니다. `npm run android` 도 정확히 같은 명령이에요([package.json](./package.json) 의 `"android": "expo run:android"`).

- 폰이 여러 대/에뮬레이터가 같이 잡혀 특정 기기를 고르고 싶으면: `npx expo run:android --device` (연결된 기기 목록에서 선택).
- 처음 한 번은 Gradle 빌드로 몇 분 걸립니다. 한 번 설치된 뒤에는 앱이 폰에 남아 있으므로, 이후엔 `npm start` 로 Metro 만 켜고 폰에서 앱을 열면 됩니다.
- 코드를 고치면 저장 즉시 리로드됩니다(Fast Refresh). 네이티브 의존성(`package.json` 의 네이티브 모듈이나 `app.json`/plugins)을 바꿨을 때만 `npx expo run:android` 를 다시 돌리세요.

> USB 케이블 없이 Wi-Fi 로 설치·디버깅하려면 무선 디버깅을 켜고 `adb pair` / `adb connect <폰IP>` 로 연결한 뒤 위 명령을 그대로 쓰면 됩니다.

```bash
npm start          # 이미 Dev Client 가 깔린 기기용 — Metro 서버만 재시작 (QR/‘a’ 로 앱 열기)
```

### 3. (선택) 로컬 목(mock) 로그인 서버

백엔드 없이 로그인 흐름을 끝까지 테스트하려면 별도 터미널에서:

```bash
node mock-server/index.js    # http://localhost:3000/v1
```

그리고 `.env` 의 `EXPO_PUBLIC_API_BASE_URL` 을 목서버 주소로 바꾸세요(위 표 참고).

> 만보기는 **실기기에서만** 실제 걸음이 잡힙니다. 에뮬레이터/웹에서는 데모용 목업 값으로 동작합니다.

## 빌드해서 휴대폰에 설치하기

USB 로 직접 넣는 방법(로컬 빌드)과, 케이블 없이 링크로 받는 방법(EAS 클라우드) 두 가지가 있습니다.

### 방법 A — 로컬에서 APK 빌드 후 USB 설치 (가장 빠름)

`android/` 폴더가 이미 prebuild 되어 있어 바로 빌드됩니다. 현재 release 는 debug 키로 서명되므로(공모전/시연용) **별도 키스토어 없이** APK 가 나옵니다.

**A-1. 그냥 연결된 기기에 바로 깔기 (디버그 빌드)**

```bash
# USB 로 폰 연결 + adb devices 로 인식 확인 후
npm run android          # 컴파일 → 폰에 자동 설치 → 실행
```

**A-2. 배포용 APK 파일 만들기 (release)**

```bash
cd android
./gradlew assembleRelease          # Windows PowerShell 은:  .\gradlew.bat assembleRelease
```

- 결과물: `android/app/build/outputs/apk/release/app-release.apk`
- 이 파일을 카톡/구글드라이브/USB 로 폰에 옮긴 뒤 파일 탭 → 설치(“출처를 알 수 없는 앱” 허용 필요).
- 또는 USB 연결 상태에서 바로 설치:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

> 실제 배포/장기 서비스용이라면 debug 키가 아닌 **본인 릴리스 키스토어**를 만들어 `android/app/build.gradle` 의 `signingConfigs.release` 에 연결해야 합니다(현재는 시연 편의를 위해 debug 키 사용 — build.gradle 주석 참고).

### 방법 B — EAS 클라우드 빌드 (케이블 없이 링크로 설치)

내 PC에 Android SDK 세팅이 안 돼 있거나, 다른 사람 폰에 링크로 배포하고 싶을 때.

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview   # 클라우드에서 설치용 APK 빌드
```

- 빌드가 끝나면 터미널에 **설치 링크/QR** 이 나옵니다. 폰 브라우저로 열어 APK 를 내려받아 설치하세요.
- 프로필은 [eas.json](./eas.json) 참고: `preview`(설치용 APK) · `development`(Dev Client) · `production`(스토어 제출용 AAB).

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
