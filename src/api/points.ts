/** 포인트 API — 잔액/원장. 스펙: docs/11-api-spec.md §4. */
import { api } from './client';

export async function getBalance(): Promise<number> {
  const r = await api<{ points: number }>('/points/balance');
  return r.points;
}

export type LedgerItem = {
  id: string;
  type: string;
  deltaP: number;
  reason: string;
  countsToDailyCap: boolean;
  createdAt: string;
};

export async function getHistory(limit = 20): Promise<LedgerItem[]> {
  const r = await api<{ items: LedgerItem[]; nextCursor: string | null }>(
    `/points/history?limit=${limit}`,
  );
  return r.items;
}
