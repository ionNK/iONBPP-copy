// Shared audit trail utilities.
//
// Every governance-sensitive action (approve / reject / request changes /
// launch / pause / resume / end / emergency stop / edit) is recorded here so
// the Audit view and the Governance console read from a single source of truth.
//
// Backed by localStorage for now; when real APIs land, swap the read/write
// helpers for network calls and keep the same event shape.

export type AuditActionType =
  | 'approve'
  | 'reject'
  | 'request_changes'
  | 'create'
  | 'edit'
  | 'launch'
  | 'pause'
  | 'resume'
  | 'end'
  | 'emergency_stop'
  | 'comment';

export interface AuditEvent {
  id: string;
  /** Machine-readable action. */
  action: AuditActionType;
  /** Human-readable summary, e.g. "Approved Kenya Mega Jackpot Boost". */
  summary: string;
  /** Actor who performed the action. */
  actor: string;
  actorRole: string;
  /** Promotion / request the action targeted. */
  targetId: string;
  targetName: string;
  /** Market/country scope for filtering. */
  market: string;
  /** Optional free-text reason / comment attached to the action. */
  reason?: string;
  /** ISO timestamp. */
  timestamp: string;
}

const STORAGE_KEY = 'promotion_audit_trail';

// Severity buckets for UI colour coding.
export const ACTION_SEVERITY: Record<AuditActionType, 'success' | 'warning' | 'error' | 'info'> = {
  approve: 'success',
  launch: 'success',
  resume: 'success',
  create: 'info',
  edit: 'info',
  comment: 'info',
  pause: 'warning',
  request_changes: 'warning',
  reject: 'error',
  end: 'error',
  emergency_stop: 'error',
};

export const ACTION_LABEL: Record<AuditActionType, string> = {
  approve: 'Approved',
  reject: 'Rejected',
  request_changes: 'Requested Changes',
  create: 'Created',
  edit: 'Edited',
  launch: 'Launched',
  pause: 'Paused',
  resume: 'Resumed',
  end: 'Ended',
  emergency_stop: 'Emergency Stop',
  comment: 'Commented on',
};

// A small seed so the Audit view isn't empty on first load.
const SEED: AuditEvent[] = [
  {
    id: 'AUD-SEED-1',
    action: 'create',
    summary: 'Created Ethiopia Acca Insurance',
    actor: 'David Otieno',
    actorRole: 'Campaign Manager',
    targetId: 'PRM-2024-001',
    targetName: 'Ethiopia Acca Insurance',
    market: 'Ethiopia',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'AUD-SEED-2',
    action: 'approve',
    summary: 'Approved Ethiopia Acca Insurance',
    actor: 'Sarah Kimani',
    actorRole: 'Marketing Lead',
    targetId: 'PRM-2024-001',
    targetName: 'Ethiopia Acca Insurance',
    market: 'Ethiopia',
    reason: 'Reviewed mechanics and budget cap — approved.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'AUD-SEED-3',
    action: 'launch',
    summary: 'Launched Ethiopia Acca Insurance',
    actor: 'System',
    actorRole: 'Scheduler',
    targetId: 'PRM-2024-001',
    targetName: 'Ethiopia Acca Insurance',
    market: 'Ethiopia',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
  },
  {
    id: 'AUD-SEED-4',
    action: 'pause',
    summary: 'Paused Ghana Welcome Offer',
    actor: 'Sarah Kimani',
    actorRole: 'Marketing Lead',
    targetId: 'PRM-2024-003',
    targetName: 'Ghana Welcome Offer',
    market: 'Ghana',
    reason: 'Suspected abuse spike — pausing pending investigation.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

function read(): AuditEvent[] {
  if (typeof window === 'undefined') return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as AuditEvent[];
  } catch {
    return SEED;
  }
}

function write(events: AuditEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    // Notify any listeners in the same tab (storage event only fires cross-tab).
    window.dispatchEvent(new CustomEvent('audit-trail-updated'));
  } catch {
    /* ignore */
  }
}

export function getAuditEvents(): AuditEvent[] {
  return read().sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export interface RecordAuditInput {
  action: AuditActionType;
  targetId: string;
  targetName: string;
  market: string;
  reason?: string;
  actor?: string;
  actorRole?: string;
  summary?: string;
}

/** Append a new event to the audit trail and return it. */
export function recordAudit(input: RecordAuditInput): AuditEvent {
  const actor = input.actor ?? 'Admin User';
  const actorRole = input.actorRole ?? 'Super Admin';
  const summary =
    input.summary ?? `${ACTION_LABEL[input.action]} ${input.targetName}`;

  const event: AuditEvent = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: input.action,
    summary,
    actor,
    actorRole,
    targetId: input.targetId,
    targetName: input.targetName,
    market: input.market,
    reason: input.reason,
    timestamp: new Date().toISOString(),
  };

  const events = read();
  write([event, ...events]);
  return event;
}

/** Format an ISO timestamp into a compact relative string. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
