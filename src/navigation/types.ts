import type { NavigatorScreenParams } from '@react-navigation/native';

/** 하단 탭 */
export type MainTabParamList = {
  Home: undefined;
  Boost: undefined;
  Profile: undefined;
};

/** 루트 스택 — 온보딩 + 탭 + 불리기 전환 플로우 */
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  BoostIntro: undefined;
  BoostDashboard: undefined;
  WithdrawMoment: undefined;
  Principal: undefined;
  Done: { amount: number };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
