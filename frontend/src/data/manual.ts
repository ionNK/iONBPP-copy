/**
 * Settings → Tutorials content: user manual sections, how-to video list,
 * glossary and the checklist progress store (`tutorials.v1.progress`).
 *
 * Content is written from the platform's own behaviour and the agreed
 * business rules (BR-4 award metadata, BR-6 alerts never block, BR-8
 * maker-checker). Extend by adding entries, never UI.
 */

export type ManualBlock =
  | { type: 'p' | 'h' | 'note'; text: string }
  | { type: 'ul'; items: string[] };

export interface ManualSection {
  id: string;
  title: string;
  blocks: ManualBlock[];
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    blocks: [
      { type: 'p', text: 'ionix Boost is the Zambia promotions workspace. Use it to configure promotions, define the player events that qualify, set the award and monitor promotion spend against budget.' },
      { type: 'h', text: 'How work flows' },
      {
        type: 'ul',
        items: [
          'Create a promotion through the seven-step wizard: Basics, Qualification, Award, Budget, Schedule, Content and Review.',
          'Save a draft while work is incomplete, then submit it for checker approval. Nothing goes live without an approver.',
          'Monitor live, scheduled, expired and pending promotions from All Promotions and the Dashboard.',
        ],
      },
      { type: 'note', text: 'A budget is a monitoring limit, not a hard stop. Budget alerts notify the business; they never block a qualifying award.' },
    ],
  },
  {
    id: 'creating-a-promotion',
    title: 'Creating a promotion',
    blocks: [
      { type: 'p', text: 'Open All Promotions and choose New promotion. Start from a template (Aviator Welcome Offer, Sportsbook Cashback) or from a blank promotion.' },
      { type: 'h', text: 'Step by step' },
      {
        type: 'ul',
        items: [
          'Basics: name, promotion type and product vertical. Zambia is the implicit market.',
          'Qualification: one or more triggers (bet placed, bet settled, deposit, registration and so on) with rules on stake, result, odds and player context. Free-bet, voided and cancelled stakes are excluded unless you choose otherwise. Bet timing sets whether prematch bets, live bets or both can qualify; the default is both.',
          'Award: a freebet (count, value, expiry) or cash (fixed amount or an odds-tier matrix).',
          'Budget: optional amount, alert threshold and alert recipients.',
          'Schedule: start date and time, then a fixed end or ongoing.',
          'Content: short description, banner, call to action and terms shown to the customer.',
          'Review: check every section, then Save draft or Submit for approval.',
        ],
      },
      { type: 'note', text: 'Submit uses confirm-before-commit. The promotion shows as Pending approval in the list until a checker approves it.' },
    ],
  },
  {
    id: 'budgets-and-alerts',
    title: 'Budgets and alerts',
    blocks: [
      { type: 'p', text: 'Each promotion may carry a budget in Kwacha. The workspace default alert threshold is set in Settings → Budget & alerts (50–100%, default 90%) and can be overridden per promotion.' },
      { type: 'h', text: 'Alerts at threshold, never a block' },
      { type: 'p', text: 'When spend reaches the threshold the platform alerts the configured recipients, bundled by the chosen digest frequency. An optional early warning fires at 75%.' },
      { type: 'note', text: 'Alerts are informational. Reaching or exceeding a budget never stops a qualifying player from being awarded; the business decides whether to pause the promotion.' },
    ],
  },
  {
    id: 'bulk-upload',
    title: 'Bulk upload',
    blocks: [
      { type: 'p', text: 'Bulk upload awards freebets to many players from one file. It is the route for manual awards that are not driven by a configured trigger.' },
      { type: 'h', text: 'CSV format' },
      {
        type: 'ul',
        items: [
          'Comma-separated .csv with a header row.',
          'One player per row: player_id or mobile_number, promo_reference, award_value.',
          'Values in Kwacha with up to two decimals; no currency symbols or thousands separators.',
        ],
      },
      { type: 'h', text: 'Vet, then credit' },
      { type: 'p', text: 'Every row is vetted before any wallet is credited: unknown players, duplicates and malformed values are reported back. Only the vetted rows go forward, and crediting still requires checker approval.' },
    ],
  },
  {
    id: 'approvals',
    title: 'Approvals',
    blocks: [
      { type: 'p', text: 'Approvals use maker-checker control. A maker prepares and submits a promotion or manual award action; a separate authorised checker reviews it before the action is completed.' },
      { type: 'h', text: 'What is checked' },
      { type: 'p', text: 'Pending promotions and actions appear in Approvals. The configured approver role and, where enabled, a second approver determine who can check the item.' },
      { type: 'note', text: 'Manual awards always require approval. Automated promotions can require approval when their budget is above the configured threshold.' },
    ],
  },
  {
    id: 'how-awards-are-recorded',
    title: 'How awards are recorded',
    blocks: [
      { type: 'p', text: 'When an award is made, the platform credits the player wallet and debits the promotional expense account as a double-entry record.' },
      { type: 'h', text: 'Required reconciliation data' },
      { type: 'p', text: 'Each record is tagged with the product vertical, provider code and promotion reference so Finance and Operations can reconcile the award back to its source.' },
      { type: 'note', text: 'There is no funded pool. Awards post directly to the player wallet and the promotional expense account.' },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    blocks: [
      { type: 'p', text: 'The dashboard summarises total spend and active promotions for the selected period, with a Budget attention list of promotions at or above the alert threshold.' },
      { type: 'p', text: 'Use Needs attention to open pending approvals and promotions starting or ending soon. Spend charts can be viewed by promotion type, provider or channel and used as filters.' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    blocks: [
      { type: 'p', text: 'Settings holds workspace formatting defaults, budget alerts, approval controls, users and roles, this learning centre and build information.' },
      { type: 'p', text: 'Product vertical, provider code and promotion reference are always mandatory on every award for ledger reconciliation; these rules are fixed and not configurable.' },
    ],
  },


];

export interface TutorialVideo {
  title: string;
  duration: string;
  slug: string;
}

export const TUTORIAL_VIDEOS: TutorialVideo[] = [
  { title: 'Getting started', duration: '3:20', slug: 'getting-started' },
  { title: 'Creating a promotion', duration: '5:10', slug: 'creating-a-promotion' },
  { title: 'Bulk upload and approvals', duration: '4:05', slug: 'bulk-upload-and-approvals' },
  { title: 'Reading the dashboard', duration: '2:45', slug: 'reading-the-dashboard' },
];

export const GLOSSARY = [
  ['Promotional expense account', 'The ledger account debited when a promotion award is credited to a player wallet.'],
  ['Double entry', 'The paired ledger record that credits the player wallet and debits promotional expense for the same award.'],
  ['Budget alert', 'A notification raised when spend reaches a configured threshold. It does not block awards.'],
  ['Maker-checker', 'A control where one person submits an action and a separate authorised person approves it.'],
  ['Bulk upload', 'A CSV-based way to prepare awards for many players in one batch.'],
  ['Vet-then-credit', 'The process of validating batch rows before crediting only the approved awards.'],
  ['Product vertical', 'The product area an award belongs to, such as Sportsbook, Aviator, Casino, Crash or Virtuals.'],
  ['Provider code', 'The short code that identifies the relevant game or product provider on an award record.'],
  ['Promo reference', 'The identifier linking an award ledger record back to its promotion.'],
  ['Network-level promotion', 'A promotion configured for the wider product network rather than a single provider or game.'],
['Bet timing', 'Whether a promotion accepts prematch bets (placed before the event starts), live bets (placed after it starts) or both.'],
] as const;

export type TutorialProgress = Partial<Record<'bulkUpload' | 'approvals' | 'simulation', boolean>>;
export const TUTORIAL_PROGRESS_KEY = 'tutorials.v1.progress';

export function loadTutorialProgress(): TutorialProgress {
  if (typeof window === 'undefined') return {};
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(TUTORIAL_PROGRESS_KEY) ?? '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored as TutorialProgress : {};
  } catch {
    return {};
  }
}

export function markTutorialProgress(item: keyof TutorialProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify({ ...loadTutorialProgress(), [item]: true }));
  } catch {
    /* Non-fatal prototype storage. */
  }
}
