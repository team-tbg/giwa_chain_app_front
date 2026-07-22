import type { TextStyle } from 'react-native';

/**
 * 나드리 디자인 토큰 (라이트 테마 · 핀테크 블루 v1)
 * 문서: docs/09-design-theme.md
 * 방향: 하얀 배경 + 진회색 텍스트. 강조 = 딥블루(신뢰·핀테크), 리워드/포지티브 = 그린.
 * semantic 토큰(primary/reward/…)을 우선 사용. mint/honey 등은 하위 호환 별칭.
 */

const palette = {
  primary: '#2F6BF3', // 주 강조 — 주요 버튼/전환/네비 (v10 --blue)
  primaryDeep: '#1E4FBF', // 눌림 (v10 --blue-deep)
  primarySoft: '#E8EFFE', // 블루 틴트 배경 (v10 --blue-soft)
  onPrimary: '#FFFFFF', // 블루 위 텍스트

  reward: '#12B76A', // 리워드/포지티브(성장·받기) (v10 --grow)
  rewardSoft: '#DEF7EC', // (v10 --grow-soft)
  rewardDeep: '#087443', // (v10 --grow-deep)
  onReward: '#FFFFFF',

  gold: '#FDB022', // 보너스·강조 포인트 (v10 --gold)
  goldSoft: '#FEF0D5', // (v10 --gold-soft)
  onGold: '#A66A00', // 골드 틴트 위 텍스트

  panel: '#EDF2FF', // 히어로·전환 패널(연블루 틴트)
} as const;

export const colors = {
  bg: '#F5F7FB', // 앱 배경 (v10 --app: 블루기 도는 옅은 그레이)
  surface: '#FFFFFF', // 카드 (흰 배경, 옅은 그림자로 분리)
  surface2: '#F4F6FA', // 입력/보조 채움 (블루기 도는 그레이)

  ink: '#16202E', // 본문 텍스트 (블루기 도는 근-검정)
  muted: '#6E7A8A', // 보조 텍스트 (v10 --muted)
  dim: '#AEB6C2', // 더 옅은 보조·비활성 (v10 --dim)
  line: '#EDEFF4', // 구분선/테두리 (v10 --line)
  red: '#E5484D', // 위험·감소 (v10 --red)
  warn: '#B45309', // 리스크·주의 고지 텍스트
  warnSoft: 'rgba(245,158,11,0.12)',

  ...palette,

  // ── 하위 호환 별칭 (기존 화면 코드). 신규 코드는 위 semantic 토큰 사용 ──
  mint: palette.primary,
  mintDeep: palette.primaryDeep,
  mintSoft: palette.primarySoft,
  mintOn: palette.onPrimary,
  honey: palette.reward,
  honeySoft: palette.rewardSoft,
  honeyOn: palette.onReward,
  panelDeep: palette.panel,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const spacing = (n: number) => n * 4;

/** 40~50대 타깃 → 큰 글씨·굵은 대비. 숫자는 tabular. */
type TypoRole = 'display' | 'heading' | 'bigNum' | 'body' | 'label' | 'caption';
export const typography: Record<TypoRole, TextStyle> = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 35 },
  heading: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  bigNum: { fontSize: 46, fontWeight: '800', letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  body: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '700' },
  caption: { fontSize: 13, fontWeight: '500' },
};

/** 카드용 옅은 그림자 (라이트 테마 분리감) */
export const cardShadow = {
  shadowColor: '#16202E',
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
} as const;

export const theme = { colors, radii, spacing, typography, cardShadow };
export type Theme = typeof theme;
