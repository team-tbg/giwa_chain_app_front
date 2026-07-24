/** 걷기·혜택 API — 걸음 적립/출석체크/오늘의 보너스. 스펙: docs/11-api-spec.md §3·§5. */
import { api, idemKey } from './client';

export type StepsClaim = {
  grantedP: number;
  pointsAfter: number;
  todayEarnedP: number;
  dailyCapP: number;
  walkMaxP: number;
  cappedByDaily: boolean;
};

export async function claimSteps(steps: number): Promise<StepsClaim> {
  return api<StepsClaim>('/steps/claim', {
    method: 'POST',
    body: { steps },
    idempotencyKey: idemKey(),
  });
}

export type Attendance = {
  grantedP: number;
  pointsAfter: number;
  todayEarnedP: number;
  dailyCapP: number;
  streak: number;
};

export async function checkAttendance(): Promise<Attendance> {
  return api<Attendance>('/rewards/attendance', { method: 'POST' });
}

export type Bonus = {
  grantedP: number;
  pointsAfter: number;
  nextAvailableAt: string;
};

export async function claimBonus(): Promise<Bonus> {
  return api<Bonus>('/rewards/bonus', { method: 'POST' });
}
