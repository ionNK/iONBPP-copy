/**
 * Bulk FreeBet Upload (PROTOTYPE) — Governance approvals stub.
 *
 * TODO(governance): no importable approvals mock store exists yet
 * (frontend/src/app/admin/promotions/approvals/page.tsx is a static placeholder
 * and there is no frontend/src/components/governance). This localStorage-backed
 * stub stands in for it. When the real approvals store lands, replace
 * `pushApproval` with a call into that store and keep the item shape below.
 */

export const APPROVALS_KEY = 'governance:approvals';

export interface BulkFreebetApprovalItem {
  id: string;
  type: 'bulk_freebet_award';
  batchId: string;
  name: string;
  reference: string;
  totalFreebet: number;
  currency: string;
  rowCount: number;
  status: 'pending';
  createdAt: string;
  createdBy: string;
}

export type ApprovalItem = BulkFreebetApprovalItem;

function read(): ApprovalItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(APPROVALS_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as ApprovalItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: ApprovalItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APPROVALS_KEY, JSON.stringify(items));
  } catch {
    /* Prototype mock: storage failures are non-fatal. */
  }
}

export function listApprovals(): ApprovalItem[] {
  return read();
}

export function pushApproval(item: ApprovalItem): void {
  write([item, ...read()]);
}
