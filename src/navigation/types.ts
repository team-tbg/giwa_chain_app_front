import type { NavigatorScreenParams } from '@react-navigation/native';

/** 하단 6탭 (v10) */
export type MainTabParamList = {
  Home: undefined; // 홈
  Benefit: undefined; // 혜택
  Interest: undefined; // 이자받기
  Shop: undefined; // 포인트샵
  Wallet: undefined; // 내 지갑
  Profile: undefined; // 내정보
};

/** 루트 스택 — 온보딩 + 탭 + 원화 예치 플로우 */
export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Deposit: undefined; // 원화 입금
  Grow: undefined; // 이자 현황(저금 대시보드)
  Attendance: undefined; // 출석체크
  Bonus: undefined; // 오늘의 보너스
  Quiz: undefined; // OX 금융퀴즈
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
