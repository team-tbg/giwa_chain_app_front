/** 이자받기(포인트 저금) API. 스펙: docs/11-api-spec.md §6. */
import { api, idemKey } from './client';

export type PointTrack = {
  principalP: number;
  accruedP: string;
  startedAt: string | null;
  todayAccruedP: string;
};

export type Positions = {
  point: PointTrack;
  cash: {
    principalKrw: number;
    accruedKrw: string;
    startedAt: string | null;
    todayAccruedKrw: string;
  };
};

export async function getPositions(): Promise<Positions> {
  return api<Positions>('/savings');
}

export type StakeResult = { point: PointTrack; pointsAfter: number; txHash: string };

export async function stakePoints(amountP: number): Promise<StakeResult> {
  return api<StakeResult>('/savings/point/stake', {
    method: 'POST',
    body: { amountP },
    idempotencyKey: idemKey(),
  });
}

export type UnstakeResult = { creditedP: number; pointsAfter: number; txHash: string };

export async function unstakePoints(): Promise<UnstakeResult> {
  return api<UnstakeResult>('/savings/point/unstake', {
    method: 'POST',
    idempotencyKey: idemKey(),
  });
}
