'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, Check, ChevronRight, Circle, CircleCheck, CirclePlay, ExternalLink, FlaskConical, LifeBuoy, Mail, Minus, Pencil, Play, Plus, Printer, RotateCcw, Trash2, UserX, X } from 'lucide-react';
import './settings.css';
import T from '@/theme/tokens';
import { Badge, DestructiveGhostButton, FilterSelect, GhostButton, PrimaryButton, Toggle } from '@/components/ui';
import { DEFAULT_SETTINGS, createDefaultSettings, loadSettings, saveSettings } from '@/lib/settings';
import type { ApproverRole, DigestFrequency, ProviderCode, Settings } from '@/lib/settings';
import { loadPromotions } from '@/lib/promotions';
import { GLOSSARY, MANUAL_SECTIONS, TUTORIAL_VIDEOS, loadTutorialProgress, markTutorialProgress } from '@/data/manual';
import type { ManualBlock, TutorialProgress, TutorialVideo } from '@/data/manual';
import VideoModal from '@/components/settings/VideoModal';
import { requestOnboardingShow, saveOnboardingState } from '../FirstRunTour';
import { USER_ROLES, USER_SEED } from '@/data/users';
import type { AdminUser, UserRole, UserStatus } from '@/data/users';
/* Version is read from the workspace manifest at build time (frontend/package.json). */
import pkg from '../../../../package.json';

/* ---- Tabs (state lives in the URL: /admin/settings?tab=…) ---- */
type TabId = 'general' | 'budget' | 'approvals' | 'metadata' | 'users' | 'tutorials' | 'about';

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'budget', label: 'Budget & alerts' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'metadata', label: 'Award metadata' },
  { id: 'users', label: 'Users & roles' },
  { id: 'tutorials', label: 'Tutorials' },
  { id: 'about', label: 'About' },
];

const isTabId = (value: string | null): value is TabId => TABS.some((tab) => tab.id === value);

/* ---- Persisted cards: which Settings keys each card owns (dirty / save / reset scope) ---- */
type CardId = 'general' | 'budget' | 'approvals' | 'metadata';

const CARD_FIELDS: Record<CardId, (keyof Settings)[]> = {
  general: ['market', 'timezone', 'dateFormat'],
  budget: ['alertThreshold', 'alertRecipients', 'digestFrequency', 'earlyWarning'],
  approvals: ['automatedApprovalThreshold', 'thresholdAmount', 'secondApprover', 'approverRole'],
  metadata: ['providers'],
};

/* Copies `keys` from `source` onto `base` without indexed writes (keeps TS strict, no casts). */
function mergeFields(base: Settings, source: Settings, keys: (keyof Settings)[]): Settings {
  const patch: Partial<Settings> = {};
  keys.forEach((key) => Object.assign(patch, { [key]: source[key] }));
  return { ...base, ...patch };
}

/* Typed option lists: FilterSelect returns a string; pickOption narrows it back to the union. */
const TIMEZONES: Settings['timezone'][] = ['Africa/Lusaka', 'UTC'];
const DATE_FORMATS: Settings['dateFormat'][] = ['DD MMM YYYY', 'YYYY-MM-DD'];
const DIGEST_FREQUENCIES: DigestFrequency[] = ['Immediate', 'Daily', 'Weekly'];
const APPROVER_ROLES: ApproverRole[] = ['Country Manager', 'Finance', 'Either'];
const PROVIDER_VERTICALS = ['Crash', 'Casino', 'Sports', 'Virtuals'];
const MARKETS = ['Zambia'];

function pickOption<Opt extends string>(options: readonly Opt[], value: string, fallback: Opt): Opt {
  return options.find((option) => option === value) ?? fallback;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));

/* BR-6 alert threshold bounds. */
const ALERT_MIN = 50;
const ALERT_MAX = 100;

const PROVIDER_CODE = /^[A-Z0-9]{2,4}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* "thandiwe.phiri@…" → "Thandiwe Phiri" for newly invited rows. */
const nameFromEmail = (email: string) =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Invited user';

/* ---- Users & roles (mock, in-memory for the session) ---- */
const USER_STATUS: Record<UserStatus, { color: string; ghost?: boolean }> = {
  Active: { color: T.success },
  Invited: { color: T.textSecondary, ghost: true },
  Deactivated: { color: T.darkGrey },
};

const MATRIX_COLUMNS = ['Create promotions', 'Approve', 'Bulk upload', 'Manage settings'];
const ROLE_MATRIX: Record<UserRole, boolean[]> = {
  'Super Admin': [true, true, true, true],
  'Country Manager': [true, true, true, false],
  'Gaming Team': [true, false, true, false],
  Finance: [false, true, false, false],
  Viewer: [false, false, false, false],
};

interface UserForm {
  mode: 'invite' | 'edit';
  id?: string;
  email: string;
  role: UserRole;
  market: string;
}

interface ProviderForm {
  code: string;
  name: string;
  vertical: string;
}

interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/* ---- About tab rows: [label, value, 12px meta] ---- */
const ABOUT_ROWS: [string, string, string | null][] = [
  ['Platform', 'ionix Boost · prototype', null],
  ['Version', pkg.version, 'Read from frontend/package.json at build time'],
  ['Design system', 'Unity (light-surface admin adaptation)', 'docs/prototype-style-guide.md · docs/unity-design-system.md'],
  ['Market', 'Zambia · ZMW', null],
];

/* ---- Tutorials tab: checklist definitions. Completion is derived from state
 * where the app already has a signal (promotions list, saved settings) and
 * from `tutorials.v1.progress` for steps whose destination pages are not
 * instrumented yet (bulk upload, approvals, simulator). Following a checklist
 * link marks the bulk-upload / approvals items as an interim measure; the
 * simulator item is only marked by the simulator itself. ---- */
type ChecklistId = 'promotion' | 'threshold' | 'bulkUpload' | 'approvals' | 'simulation';

const CHECKLIST: { id: ChecklistId; label: string; helper: string; href: string; mark?: keyof TutorialProgress }[] = [
  { id: 'promotion', label: 'Create your first promotion', helper: 'Walk through the seven-step wizard and save a draft.', href: '/admin/promotions/new' },
  { id: 'threshold', label: 'Set a budget alert threshold', helper: 'Change the workspace default in Budget & alerts.', href: '/admin/settings?tab=budget' },
  { id: 'bulkUpload', label: 'Upload a bulk award file', helper: 'Vet a CSV of manual awards before crediting.', href: '/admin/promotions/bulk-upload', mark: 'bulkUpload' },
  { id: 'approvals', label: 'Approve an award', helper: 'Review a pending item as the checker.', href: '/admin/promotions/approvals', mark: 'approvals' },
  { id: 'simulation', label: 'Run a simulation', helper: 'Test a promotion against sample player events.', href: '/admin/simulator' },
];

const SUPPORT_EMAIL = 'support@ionix.zm';

/* ---- Shared inline styles (tokens only) ---- */
const inputStyle: CSSProperties = { border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.textPrimary, background: T.white };
const tableFrameStyle: CSSProperties = { border: `1px solid ${T.border}`, borderRadius: T.radiusSm, overflow: 'hidden' };
const thStyle: CSSProperties = { color: T.textSecondary, borderBottom: `1px solid ${T.border}`, background: T.offWhite };

/* ---- Page-local layout pieces (not ui/ primitives) ---- */
function Card({ title, description, action, footer, children }: { title: string; description?: string; action?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="settings-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
      <div className="settings-card__header">
        <div>
          <h2 className="settings-card__heading" style={{ color: T.textPrimary }}>{title}</h2>
          {description && <p className="settings-card__description" style={{ color: T.textSecondary }}>{description}</p>}
        </div>
        {action && <div className="settings-card__action">{action}</div>}
      </div>
      {children}
      {footer && (
        <div className="settings-card__footer" style={{ borderTop: `1px solid ${T.border}`, background: T.offWhite }}>
          {footer}
        </div>
      )}
    </section>
  );
}

function FieldRow({ label, helper, stack, children }: { label: string; helper?: string; stack?: boolean; children: ReactNode }) {
  return (
    <div className="settings-field" style={{ borderTopColor: T.border }}>
      <div>
        <div className="settings-field__label" style={{ color: T.textPrimary }}>{label}</div>
        {helper && <p className="settings-field__helper" style={{ color: T.textSecondary }}>{helper}</p>}
      </div>
      <div className={`settings-field__control${stack ? ' settings-field__control--stack' : ''}`}>{children}</div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className="settings-icon-button"
      style={{ color: T.textSecondary, background: 'transparent', borderRadius: T.radiusSm }}
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

/* Manual body: typed blocks from data/manual.ts rendered with Unity type sizes only. */
function ManualBlocks({ blocks }: { blocks: ManualBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'h') return <h4 key={i} className="settings-manual__subheading" style={{ color: T.textPrimary }}>{block.text}</h4>;
        if (block.type === 'ul') {
          return (
            <ul key={i} className="settings-manual__list" style={{ color: T.textPrimary }}>
              {block.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          );
        }
        if (block.type === 'note') {
          return (
            <p key={i} className="settings-manual__note" style={{ background: T.offWhite, borderRadius: T.radiusSm, color: T.textPrimary }}>
              {block.text}
            </p>
          );
        }
        return <p key={i} className="settings-manual__text" style={{ color: T.textPrimary }}>{block.text}</p>;
      })}
    </>
  );
}

/* Card footer shared by the four persisted cards. */
function CardActions({ dirty, onReset, onSave }: { dirty: boolean; onReset: () => void; onSave: () => void }) {
  return (
    <>
      <GhostButton onClick={onReset}>Reset to defaults</GhostButton>
      <PrimaryButton onClick={onSave} disabled={!dirty}>Save changes</PrimaryButton>
    </>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: TabId = isTabId(tabParam) ? tabParam : 'general';

  /* `saved` mirrors settings.v1; `draft` is the edited copy. Dirty = per-card diff. */
  const [saved, setSaved] = useState<Settings>(createDefaultSettings);
  const [draft, setDraft] = useState<Settings>(createDefaultSettings);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const [providerForm, setProviderForm] = useState<ProviderForm | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>(USER_SEED);
  const [userForm, setUserForm] = useState<UserForm | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  /* Tutorials tab: checklist inputs + manual / video UI state. */
  const [progress, setProgress] = useState<TutorialProgress>({});
  const [promoCount, setPromoCount] = useState(0);
  const [manualSection, setManualSection] = useState(MANUAL_SECTIONS[0].id);
  const [openVideo, setOpenVideo] = useState<TutorialVideo | null>(null);

  /* Hydrate from localStorage after mount (SSR renders defaults). */
  useEffect(() => {
    const stored = loadSettings();
    /* eslint-disable react-hooks/set-state-in-effect -- mount-only hydration from localStorage */
    setSaved(stored);
    setDraft(stored);
    setProgress(loadTutorialProgress());
    setPromoCount(loadPromotions().length);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3000);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => setDraft((cur) => ({ ...cur, ...patch })), []);

  const isDirty = (card: CardId) => CARD_FIELDS[card].some((key) => JSON.stringify(draft[key]) !== JSON.stringify(saved[key]));

  /* Save commits only the card's own fields, so other cards keep their unsaved edits. */
  const save = (card: CardId) => {
    const next = mergeFields(saved, draft, CARD_FIELDS[card]);
    saveSettings(next);
    setSaved(next);
    setDraft((cur) => mergeFields(cur, next, CARD_FIELDS[card]));
    if (card === 'metadata') {
      setProviderForm(null);
      setProviderError(null);
    }
    showNotice('Settings saved');
  };

  /* Reset restores + persists the card's defaults: confirm-before-commit. */
  const requestReset = (card: CardId, cardTitle: string) =>
    setConfirm({
      title: `Reset ${cardTitle} to defaults?`,
      body: 'Unsaved changes in this card will be lost and the defaults will be saved.',
      confirmLabel: 'Reset to defaults',
      onConfirm: () => {
        const next = mergeFields(saved, createDefaultSettings(), CARD_FIELDS[card]);
        saveSettings(next);
        setSaved(next);
        setDraft((cur) => mergeFields(cur, next, CARD_FIELDS[card]));
        if (card === 'metadata') {
          setProviderForm(null);
          setProviderError(null);
        }
        setConfirm(null);
        showNotice('Settings saved');
      },
    });

  /* ---- Provider codes (BR-4), persisted with the Award metadata card ---- */
  const addProvider = () => {
    if (!providerForm) return;
    const code = providerForm.code.trim().toUpperCase();
    const name = providerForm.name.trim();
    if (!PROVIDER_CODE.test(code)) return setProviderError('Code must be 2–4 uppercase letters or digits.');
    if (draft.providers.some((p) => p.code === code)) return setProviderError(`Code ${code} is already in use.`);
    if (!name) return setProviderError('Provider name is required.');
    const provider: ProviderCode = { id: `provider-${code.toLowerCase()}-${Date.now()}`, code, name, vertical: providerForm.vertical };
    update({ providers: [...draft.providers, provider] });
    setProviderForm(null);
    setProviderError(null);
  };

  const requestDeleteProvider = (provider: ProviderCode) =>
    setConfirm({
      title: `Delete provider ${provider.code}?`,
      body: `${provider.name} will be removed from the provider codes list once you save the Award metadata card.`,
      confirmLabel: 'Delete provider',
      destructive: true,
      onConfirm: () => {
        update({ providers: draft.providers.filter((p) => p.id !== provider.id) });
        setConfirm(null);
      },
    });

  /* ---- Users & roles (mock, session-only) ---- */
  const openInvite = () => {
    setUserError(null);
    setUserForm({ mode: 'invite', email: '', role: 'Viewer', market: 'Zambia' });
  };

  const openEdit = (user: AdminUser) => {
    setUserError(null);
    setUserForm({ mode: 'edit', id: user.id, email: user.email, role: user.role, market: user.market });
  };

  const submitUserForm = () => {
    if (!userForm) return;
    const email = userForm.email.trim().toLowerCase();
    if (!EMAIL.test(email)) return setUserError('Enter a valid email address.');
    if (users.some((u) => u.email.toLowerCase() === email && u.id !== userForm.id)) return setUserError('A user with this email already exists.');

    if (userForm.mode === 'invite') {
      const invited: AdminUser = {
        id: `user-${Date.now()}`,
        name: nameFromEmail(email),
        email,
        role: userForm.role,
        market: userForm.market,
        status: 'Invited',
        lastActive: 'Invitation pending',
      };
      setUsers((cur) => [invited, ...cur]);
      showNotice(`Invitation sent to ${email}`);
    } else {
      setUsers((cur) => cur.map((u) => (u.id === userForm.id ? { ...u, email, role: userForm.role, market: userForm.market } : u)));
      showNotice('User updated');
    }
    setUserForm(null);
    setUserError(null);
  };

  const requestDeactivate = (user: AdminUser) =>
    setConfirm({
      title: `Deactivate ${user.name}?`,
      body: `${user.email} will lose access immediately. You can re-invite them later.`,
      confirmLabel: 'Deactivate',
      destructive: true,
      onConfirm: () => {
        setUsers((cur) => cur.map((u) => (u.id === user.id ? { ...u, status: 'Deactivated', lastActive: 'Deactivated today' } : u)));
        setConfirm(null);
        showNotice(`${user.name} deactivated`);
      },
    });

  /* ---- About: replay tour. FirstRunTour only reads the flag on mount (shell level), so
   * we clear the flag and hard-navigate to /admin/promotions to remount the shell. ---- */
  /* ---- Tutorials: derived checklist state ---- */
  const checklistDone: Record<ChecklistId, boolean> = {
    promotion: promoCount > 0,
    threshold: saved.alertThreshold !== DEFAULT_SETTINGS.alertThreshold,
    bulkUpload: progress.bulkUpload === true,
    approvals: progress.approvals === true,
    simulation: progress.simulation === true,
  };
  const checklistCount = CHECKLIST.filter((item) => checklistDone[item.id]).length;

  /* Interim: following the link counts for steps whose pages are not instrumented yet. */
  const followChecklist = (mark?: keyof TutorialProgress) => {
    if (!mark) return;
    markTutorialProgress(mark);
    setProgress(loadTutorialProgress());
  };

  const activeManual = MANUAL_SECTIONS.find((section) => section.id === manualSection) ?? MANUAL_SECTIONS[0];

  const requestReplayTour = () =>
    setConfirm({
      title: 'Replay onboarding tour?',
      body: 'You will be taken to All Promotions and the five-step tour will start again.',
      confirmLabel: 'Replay tour',
      onConfirm: () => {
        /* Reset the record and raise the session flag; FirstRunTour consumes
         * it on the landing route and opens the tour immediately (count 1 of 3). */
        saveOnboardingState({ shownCount: 0, dismissedForever: false });
        requestOnboardingShow();
        setConfirm(null);
        window.location.assign('/admin/promotions');
      },
    });

  return (
    <div className="settings-page" style={{ background: T.offWhite }}>
      {/* Page top bar: title + subtitle only (no primary action) + URL-linked tab bar. */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div className="settings-topbar">
          <h1 className="settings-title" style={{ color: T.textPrimary }}>Settings</h1>
          <p className="settings-subtitle" style={{ color: T.textSecondary }}>ionix Boost · Zambia</p>
        </div>
        <nav className="settings-tabs" aria-label="Settings sections">
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <Link
                key={item.id}
                href={`/admin/settings?tab=${item.id}`}
                scroll={false}
                className={`settings-tab${active ? ' settings-tab--active' : ''}`}
                aria-current={active ? 'page' : undefined}
                style={active ? { color: T.textPrimary, borderBottomColor: T.navy } : { color: T.textSecondary, borderBottomColor: 'transparent' }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="settings-container">
        {notice && (
          <div className="settings-notice" role="status" style={{ background: T.successBg, borderRadius: T.radiusSm }}>
            <CircleCheck size={16} style={{ color: T.success }} aria-hidden="true" />
            <span style={{ flex: 1, color: T.textPrimary }}>{notice}</span>
            <IconButton label="Dismiss notice" onClick={() => setNotice(null)}>
              <X size={14} />
            </IconButton>
          </div>
        )}

        <div className="settings-column">
          {tab === 'general' && (
            <Card
              title="General"
              description="Market, currency and formatting defaults for this workspace."
              footer={<CardActions dirty={isDirty('general')} onReset={() => requestReset('general', 'General')} onSave={() => save('general')} />}
            >
              <FieldRow label="Default market" helper="The market new promotions are created in." stack>
                <FilterSelect label={draft.market} options={MARKETS} onChange={() => update({ market: 'Zambia' })} />
                <p className="settings-control-hint" style={{ color: T.textSecondary }}>More markets soon</p>
              </FieldRow>
              <FieldRow label="Currency display" helper="Fixed by the market: Zambian Kwacha.">
                <div className="settings-readonly" style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, background: T.offWhite, color: T.textSecondary }}>
                  ZMW · K 1,250.00
                </div>
              </FieldRow>
              <FieldRow label="Timezone" helper="Used for schedules and report timestamps.">
                <FilterSelect label={draft.timezone} options={TIMEZONES} onChange={(v) => update({ timezone: pickOption(TIMEZONES, v, 'Africa/Lusaka') })} />
              </FieldRow>
              <FieldRow label="Date format" helper="Applies to tables, exports and the activity log.">
                <FilterSelect label={draft.dateFormat} options={DATE_FORMATS} onChange={(v) => update({ dateFormat: pickOption(DATE_FORMATS, v, 'DD MMM YYYY') })} />
              </FieldRow>
            </Card>
          )}

          {tab === 'budget' && (
            <Card
              title="Budget & alerts"
              description="BR-6: budget thresholds raise alerts; they never stop a promotion from awarding."
              footer={<CardActions dirty={isDirty('budget')} onReset={() => requestReset('budget', 'Budget & alerts')} onSave={() => save('budget')} />}
            >
              <FieldRow label="Alert threshold (%)" helper="Alerts notify; they never block awarding.">
                <input
                  type="number"
                  className="settings-input"
                  style={inputStyle}
                  min={ALERT_MIN}
                  max={ALERT_MAX}
                  step={1}
                  value={draft.alertThreshold || ''}
                  aria-label="Alert threshold percentage"
                  onChange={(e) => update({ alertThreshold: Number(e.target.value) })}
                  onBlur={(e) => update({ alertThreshold: clamp(Math.round(Number(e.target.value)), ALERT_MIN, ALERT_MAX) })}
                />
              </FieldRow>
              <FieldRow label="Alert recipients" helper="Comma-separated email addresses.">
                <input
                  type="text"
                  className="settings-input"
                  style={inputStyle}
                  value={draft.alertRecipients}
                  placeholder="name@ionix.zm, finance@ionix.zm"
                  aria-label="Alert recipients"
                  onChange={(e) => update({ alertRecipients: e.target.value })}
                />
              </FieldRow>
              <FieldRow label="Digest frequency" helper="How often threshold alerts are bundled.">
                <FilterSelect label={draft.digestFrequency} options={DIGEST_FREQUENCIES} onChange={(v) => update({ digestFrequency: pickOption(DIGEST_FREQUENCIES, v, 'Immediate') })} />
              </FieldRow>
              <FieldRow label="Also alert at 75% (early warning)" helper="Sends an additional heads-up before the main threshold.">
                <Toggle checked={draft.earlyWarning} onChange={(v) => update({ earlyWarning: v })} ariaLabel="Also alert at 75 percent" />
              </FieldRow>
            </Card>
          )}

          {tab === 'approvals' && (
            <Card
              title="Approvals"
              description="BR-8: maker-checker rules for manual awards and automated promotions."
              footer={<CardActions dirty={isDirty('approvals')} onReset={() => requestReset('approvals', 'Approvals')} onSave={() => save('approvals')} />}
            >
              <FieldRow label="Require approval for all manual awards" helper="Mandatory business rule">
                <Toggle checked disabled ariaLabel="Require approval for all manual awards (locked)" />
              </FieldRow>
              <FieldRow label="Require approval for automated promotions above a spend threshold" helper="Automated promotions under the threshold go live without a checker.">
                <Toggle checked={draft.automatedApprovalThreshold} onChange={(v) => update({ automatedApprovalThreshold: v })} ariaLabel="Require approval for automated promotions above a spend threshold" />
              </FieldRow>
              {draft.automatedApprovalThreshold && (
                <FieldRow label="Threshold amount (K)" helper="Automated promotions budgeted above this amount need approval.">
                  <input
                    type="number"
                    className="settings-input"
                    style={inputStyle}
                    min={0}
                    step={1000}
                    value={draft.thresholdAmount || ''}
                    aria-label="Threshold amount in Kwacha"
                    onChange={(e) => update({ thresholdAmount: Number(e.target.value) })}
                    onBlur={(e) => update({ thresholdAmount: Math.max(0, Math.round(Number(e.target.value)) || 0) })}
                  />
                </FieldRow>
              )}
              <FieldRow label="Second approver required above K 250,000" helper="Adds a second checker for very large budgets.">
                <Toggle checked={draft.secondApprover} onChange={(v) => update({ secondApprover: v })} ariaLabel="Second approver required above K 250,000" />
              </FieldRow>
              <FieldRow label="Approver roles" helper="Who can act as checker for pending items.">
                <FilterSelect label={draft.approverRole} options={APPROVER_ROLES} onChange={(v) => update({ approverRole: pickOption(APPROVER_ROLES, v, 'Either') })} />
              </FieldRow>
            </Card>
          )}

          {tab === 'metadata' && (
            <Card
              title="Award metadata"
              description="BR-4: every award posts to the ledger with the metadata below. These rules are locked."
              footer={<CardActions dirty={isDirty('metadata')} onReset={() => requestReset('metadata', 'Award metadata')} onSave={() => save('metadata')} />}
            >
              <FieldRow label="Product vertical required" helper="Required by the ledger for reconciliation">
                <Toggle checked disabled ariaLabel="Product vertical required (locked)" />
              </FieldRow>
              <FieldRow label="Game provider code required" helper="Required by the ledger for reconciliation">
                <Toggle checked disabled ariaLabel="Game provider code required (locked)" />
              </FieldRow>
              <FieldRow label="Promotion reference required" helper="Required by the ledger for reconciliation">
                <Toggle checked disabled ariaLabel="Promotion reference required (locked)" />
              </FieldRow>

              <div className="settings-card__header" style={{ marginTop: 20 }}>
                <div>
                  <h2 className="settings-card__heading" style={{ color: T.textPrimary }}>Provider codes</h2>
                  <p className="settings-card__description" style={{ color: T.textSecondary }}>Codes stamped on each award. Changes apply once you save this card.</p>
                </div>
                <div className="settings-card__action">
                  <GhostButton
                    small
                    onClick={() => {
                      setProviderError(null);
                      setProviderForm((cur) => (cur ? null : { code: '', name: '', vertical: PROVIDER_VERTICALS[0] }));
                    }}
                  >
                    <Plus size={16} /> Add provider
                  </GhostButton>
                </div>
              </div>

              <div className="settings-provider-table-wrap" style={tableFrameStyle}>
                <table className="settings-table">
                  <thead>
                    <tr>
                      {['Code', 'Provider name', 'Vertical'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                      <th className="settings-table__actions" style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.providers.map((provider, i) => (
                      <tr key={provider.id} style={i < draft.providers.length - 1 ? { borderBottom: `1px solid ${T.border}` } : undefined}>
                        <td style={{ color: T.textPrimary, fontWeight: 600 }}>{provider.code}</td>
                        <td style={{ color: T.textPrimary }}>{provider.name}</td>
                        <td style={{ color: T.textSecondary }}>{provider.vertical}</td>
                        <td className="settings-table__actions">
                          <DestructiveGhostButton small onClick={() => requestDeleteProvider(provider)}>
                            <Trash2 size={14} /> Delete
                          </DestructiveGhostButton>
                        </td>
                      </tr>
                    ))}
                    {draft.providers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="settings-empty" style={{ color: T.textSecondary }}>No provider codes. Add one to continue stamping awards.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {providerForm && (
                <>
                  <div className="settings-inline-form" role="group" aria-label="New provider">
                    <input
                      type="text"
                      className="settings-input"
                      style={{ ...inputStyle, textTransform: 'uppercase' }}
                      maxLength={4}
                      value={providerForm.code}
                      placeholder="CODE"
                      aria-label="Provider code (max 4 characters)"
                      onChange={(e) => setProviderForm({ ...providerForm, code: e.target.value.toUpperCase().slice(0, 4) })}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      style={inputStyle}
                      value={providerForm.name}
                      placeholder="Provider name"
                      aria-label="Provider name"
                      onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                    />
                    <FilterSelect label={providerForm.vertical} options={PROVIDER_VERTICALS} onChange={(v) => setProviderForm({ ...providerForm, vertical: v })} />
                    <div className="settings-actions">
                      <GhostButton small onClick={() => { setProviderForm(null); setProviderError(null); }}>Cancel</GhostButton>
                      <PrimaryButton onClick={addProvider}>Add</PrimaryButton>
                    </div>
                  </div>
                  {providerError && <p className="settings-control-hint" role="alert" style={{ color: T.destructive }}>{providerError}</p>}
                </>
              )}
            </Card>
          )}

          {tab === 'users' && (
            <>
              {/* Role matrix: static, informational. */}
              <Card title="Role permissions" description="What each role can do in ionix Boost. Roles are assigned per user below.">
                <div className="settings-users-table-wrap" style={tableFrameStyle}>
                  <table className="settings-role-matrix">
                    <thead>
                      <tr>
                        <th style={thStyle}>Role</th>
                        {MATRIX_COLUMNS.map((col) => (
                          <th key={col} style={thStyle}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {USER_ROLES.map((role, i) => (
                        <tr key={role} style={i < USER_ROLES.length - 1 ? { borderBottom: `1px solid ${T.border}` } : undefined}>
                          <td style={{ color: T.textPrimary, fontWeight: 500 }}>{role}</td>
                          {ROLE_MATRIX[role].map((allowed, col) => (
                            <td key={MATRIX_COLUMNS[col]} aria-label={`${role} · ${MATRIX_COLUMNS[col]}: ${allowed ? 'allowed' : 'not allowed'}`}>
                              {allowed ? <Check size={16} style={{ color: T.success }} aria-hidden="true" /> : <Minus size={16} style={{ color: T.textSecondary }} aria-hidden="true" />}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card
                title="Users"
                description={`${users.length} users · ${users.filter((u) => u.status === 'Active').length} active`}
                action={
                  <PrimaryButton onClick={openInvite}>
                    <Plus size={16} /> Invite user
                  </PrimaryButton>
                }
              >
                {userForm && (
                  <>
                    <div className="settings-user-form" role="group" aria-label={userForm.mode === 'invite' ? 'Invite user' : 'Edit user'}>
                      <input
                        type="email"
                        className="settings-input"
                        style={inputStyle}
                        value={userForm.email}
                        placeholder="name@ionix.zm"
                        aria-label="Email address"
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      />
                      <FilterSelect label={userForm.role} options={USER_ROLES} onChange={(v) => setUserForm({ ...userForm, role: pickOption(USER_ROLES, v, 'Viewer') })} />
                      <FilterSelect label={userForm.market} options={MARKETS} onChange={(v) => setUserForm({ ...userForm, market: v })} />
                      <div className="settings-actions">
                        <GhostButton small onClick={() => { setUserForm(null); setUserError(null); }}>Cancel</GhostButton>
                        <PrimaryButton onClick={submitUserForm}>{userForm.mode === 'invite' ? 'Send invite' : 'Save user'}</PrimaryButton>
                      </div>
                    </div>
                    {userError && <p className="settings-control-hint" role="alert" style={{ color: T.destructive, marginBottom: 16 }}>{userError}</p>}
                  </>
                )}

                <div className="settings-users-table-wrap" style={tableFrameStyle}>
                  <table className="settings-table">
                    <thead>
                      <tr>
                        {['User', 'Role', 'Market', 'Status', 'Last active'].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                        <th className="settings-table__actions" style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, i) => (
                        <tr key={user.id} style={i < users.length - 1 ? { borderBottom: `1px solid ${T.border}` } : undefined}>
                          <td>
                            <div className="settings-user-name" style={{ color: T.textPrimary }}>{user.name}</div>
                            <div className="settings-user-email" style={{ color: T.textSecondary }}>{user.email}</div>
                          </td>
                          <td>
                            <Badge color={T.navy} ghost>{user.role}</Badge>
                          </td>
                          <td style={{ color: T.textPrimary }}>{user.market}</td>
                          <td>
                            <Badge color={USER_STATUS[user.status].color} ghost={USER_STATUS[user.status].ghost}>{user.status}</Badge>
                          </td>
                          <td>
                            <span className="settings-last-active" style={{ color: T.textSecondary }}>{user.lastActive}</span>
                          </td>
                          <td className="settings-table__actions">
                            <div className="settings-actions">
                              <IconButton label={`Edit ${user.name}`} onClick={() => openEdit(user)}>
                                <Pencil size={16} />
                              </IconButton>
                              {user.status !== 'Deactivated' && (
                                <IconButton label={`Deactivate ${user.name}`} onClick={() => requestDeactivate(user)}>
                                  <UserX size={16} />
                                </IconButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {tab === 'tutorials' && (
            <div className="settings-tutorials">
              {/* 1. Getting-started checklist: derived + persisted completion. */}
              <Card
                title="Getting started"
                description="Five steps to learn the workspace. Progress is saved in this browser."
                action={<Badge color={checklistCount === CHECKLIST.length ? T.success : T.navy} ghost>{checklistCount} of {CHECKLIST.length} done</Badge>}
              >
                <ol className="settings-checklist">
                  {CHECKLIST.map((item) => {
                    const done = checklistDone[item.id];
                    return (
                      <li key={item.id} className="settings-checklist__item" style={{ borderTopColor: T.border }}>
                        {done ? (
                          <CircleCheck size={20} style={{ color: T.success }} aria-hidden="true" />
                        ) : (
                          <Circle size={20} style={{ color: T.textSecondary }} aria-hidden="true" />
                        )}
                        <div className="settings-checklist__copy">
                          <div className="settings-checklist__label" style={{ color: T.textPrimary }}>
                            {item.label}
                            <span className="settings-visually-hidden">{done ? ' (done)' : ' (not done)'}</span>
                          </div>
                          <p className="settings-checklist__helper" style={{ color: T.textSecondary }}>{item.helper}</p>
                        </div>
                        <Link
                          href={item.href}
                          className="settings-checklist__link"
                          style={{ color: T.textPrimary }}
                          onClick={() => followChecklist(item.mark)}
                        >
                          {done ? 'Revisit' : 'Start'} <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </Card>

              {/* 2. How-to videos: MP4s are not shipped yet; the modal shows a notice when a file is missing. */}
              <Card title="How-to videos" description="Short walkthroughs of the main flows.">
                <ul className="settings-videos">
                  {TUTORIAL_VIDEOS.map((video) => (
                    <li key={video.slug}>
                      <button
                        type="button"
                        className="settings-video"
                        style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, background: T.white, color: T.textPrimary }}
                        onClick={() => setOpenVideo(video)}
                        aria-label={`Play ${video.title}, ${video.duration}`}
                      >
                        <span className="settings-video__thumb" style={{ background: T.navy, borderRadius: T.radiusSm }}>
                          <Play size={16} style={{ color: T.yellow }} aria-hidden="true" />
                        </span>
                        <span className="settings-video__copy">
                          <span className="settings-video__title">{video.title}</span>
                          <span className="settings-video__duration" style={{ color: T.textSecondary }}>{video.duration}</span>
                        </span>
                        <CirclePlay size={16} style={{ color: T.textSecondary }} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
              {/* 3. User manual: section list + body; Print renders every section (see @media print). */}
              <div className="settings-tutorials__wide">
                <Card
                  title="User manual"
                  description="How the platform works, section by section."
                  action={
                    <GhostButton small onClick={() => window.print()} ariaLabel="Print the user manual">
                      <Printer size={16} aria-hidden="true" /> Print manual
                    </GhostButton>
                  }
                >
                  <div className="settings-manual">
                    <nav className="settings-manual__nav" aria-label="Manual sections">
                      {MANUAL_SECTIONS.map((section) => {
                        const active = section.id === activeManual.id;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            className={`settings-manual__nav-item${active ? ' settings-manual__nav-item--active' : ''}`}
                            style={{ color: active ? T.textPrimary : T.textSecondary, background: active ? T.activeFill : 'transparent', borderRadius: T.radiusSm }}
                            aria-current={active ? 'true' : undefined}
                            onClick={() => setManualSection(section.id)}
                          >
                            <BookOpen size={14} aria-hidden="true" />
                            <span>{section.title}</span>
                            <ChevronRight size={14} aria-hidden="true" />
                          </button>
                        );
                      })}
                    </nav>
                    <div className="settings-manual__body">
                      {MANUAL_SECTIONS.map((section) => (
                        <article
                          key={section.id}
                          className={`settings-manual__section${section.id === activeManual.id ? ' settings-manual__section--active' : ''}`}
                        >
                          <h3 className="settings-manual__heading" style={{ color: T.textPrimary }}>{section.title}</h3>
                          <ManualBlocks blocks={section.blocks} />
                        </article>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* 4. Simulator hand-off: opening the link never counts as a completed simulation. */}
              <Card title="Promotion simulator" description="Test how a promotion behaves against sample player events before it goes live.">
                <div className="settings-simulator" style={{ background: T.offWhite, borderRadius: T.radiusSm }}>
                  <FlaskConical size={20} style={{ color: T.navy }} aria-hidden="true" />
                  <p style={{ color: T.textPrimary }}>Pick a promotion, replay bets and deposits, and see which players would qualify and what it would cost.</p>
                  <Link href="/admin/simulator" className="settings-inline-link" style={{ color: T.textPrimary }}>
                    Open the simulator <ExternalLink size={14} aria-hidden="true" />
                  </Link>
                </div>
              </Card>
              {/* 5. Glossary: styled native disclosure (no accordion primitive exists yet). */}
              <Card title="Glossary" description="Terms used across promotions, awards and the ledger.">
                <div className="settings-glossary">
                  {GLOSSARY.map(([term, definition]) => (
                    <details key={term} className="settings-glossary__item" style={{ borderTopColor: T.border }}>
                      <summary className="settings-glossary__term" style={{ color: T.textPrimary }}>
                        <span>{term}</span>
                        <ChevronRight size={16} className="settings-glossary__chevron" style={{ color: T.textSecondary }} aria-hidden="true" />
                      </summary>
                      <p className="settings-glossary__definition" style={{ color: T.textSecondary }}>{definition}</p>
                    </details>
                  ))}
                </div>
              </Card>

              {/* 6. Support. */}
              <Card title="Need help?" description="Product support for ionix Boost in Zambia.">
                <div className="settings-support">
                  <div className="settings-support__item" style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
                    <Mail size={16} style={{ color: T.navy }} aria-hidden="true" />
                    <div>
                      <div className="settings-support__label" style={{ color: T.textPrimary }}>Email support</div>
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="settings-inline-link" style={{ color: T.textPrimary }}>{SUPPORT_EMAIL}</a>
                    </div>
                  </div>
                  <div className="settings-support__item" style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
                    <LifeBuoy size={16} style={{ color: T.navy }} aria-hidden="true" />
                    <div>
                      <div className="settings-support__label" style={{ color: T.textPrimary }}>Onboarding tour</div>
                      <p className="settings-support__meta" style={{ color: T.textSecondary }}>Replay the five-step tour from the About tab at any time.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === 'about' && (
            <Card title="About" description="Build and design-system details for this prototype.">
              <div className="settings-about-list">
                {ABOUT_ROWS.map(([label, value, meta]) => (
                  <div key={label} className="settings-about-row" style={{ borderTopColor: T.border }}>
                    <span className="settings-about-label" style={{ color: T.textSecondary }}>{label}</span>
                    <div>
                      <span style={{ color: T.textPrimary }}>{value}</span>
                      {meta && <p className="settings-about-meta" style={{ color: T.textSecondary }}>{meta}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="settings-about-actions">
                <GhostButton onClick={requestReplayTour}>
                  <RotateCcw size={16} /> Replay onboarding tour
                </GhostButton>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Tutorials: how-to video player (portal; Escape / scrim click closes, focus is trapped). */}
      {openVideo && <VideoModal video={openVideo} onClose={() => setOpenVideo(null)} />}

      {/* Confirm dialog: confirm-before-commit for reset, delete, deactivate and replay. */}
      {confirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="settings-confirm-title">
          <div className="settings-modal__scrim" style={{ background: T.scrim }} onClick={() => setConfirm(null)} />
          <div className="settings-modal__card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
            <h2 id="settings-confirm-title" className="settings-modal__title" style={{ color: T.textPrimary }}>{confirm.title}</h2>
            <p className="settings-modal__body" style={{ color: T.textSecondary }}>{confirm.body}</p>
            <div className="settings-modal__actions">
              <GhostButton onClick={() => setConfirm(null)}>Cancel</GhostButton>
              {confirm.destructive ? (
                <DestructiveGhostButton onClick={confirm.onConfirm}>{confirm.confirmLabel}</DestructiveGhostButton>
              ) : (
                <PrimaryButton onClick={confirm.onConfirm}>{confirm.confirmLabel}</PrimaryButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* useSearchParams needs a Suspense boundary for static prerendering (Next.js app router). */
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="settings-page" style={{ background: T.offWhite }} />}>
      <SettingsContent />
    </Suspense>
  );
}
