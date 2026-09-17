'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck, Clock, Pencil, Plus, Search, Trash2, TriangleAlert, X } from 'lucide-react';
import './promotions.css';
import T from '@/theme/tokens';
import { Badge, DestructiveGhostButton, FilterSelect, GhostButton, PrimaryButton, StatChip } from '@/components/ui';
import { PROMO_SEED, consumeListNotice, loadPromotions, savePromotions } from '@/lib/promotions';
import type { Promo, PromoStatus } from '@/lib/promotions';

const STATUS: Record<PromoStatus, { label: string; color: string; ghost?: boolean }> = {
active: { label: 'Active', color: T.success },
scheduled: { label: 'Scheduled', color: T.blue },
expired: { label: 'Expired', color: T.darkGrey },
draft: { label: 'Draft', color: T.draft },
/* Maker-checker queue state: ghost pill with navy text. */
pending: { label: 'Pending approval', color: T.navy, ghost: true },
};

const STATUSES = ['All statuses', 'Active', 'Scheduled', 'Expired', 'Draft', 'Pending approval'];

/* Type filter reset option: the type list itself is derived from the data. */
const ALL_TYPES = 'All types';

/* Table pagination, house style: page size 10. */
const PAGE_SIZE = 10;

const fmtK = (n: number) => `K ${n.toLocaleString()}`;

/* Budget cell (BR-6): alert threshold, never enforcement */
function BudgetCell({ budget, spend }: { budget: number | null; spend: number | null }) {
if (budget == null || spend == null) {
return <span className="promo-budget__empty" style={{ color: T.textSecondary }}>·</span>;
}
const pct = Math.min((spend / budget) * 100, 100);
const alerted = spend / budget >= 0.9;
return (
<div className="promo-budget">
<div className="promo-budget__row">
<span style={{ color: T.textPrimary }}>
{fmtK(spend)} <span style={{ color: T.textSecondary }}>/ {fmtK(budget)}</span>
</span>
{alerted && (
<span className="promo-budget__alert" style={{ color: T.destructive }}>
<TriangleAlert size={12} /> Budget alert
</span>
)}
</div>
<div className="promo-budget__track" style={{ background: T.border, borderRadius: T.radiusPill }}>
<div className="promo-budget__fill" style={{ width: `${pct}%`, background: alerted ? T.destructive : T.navy, borderRadius: T.radiusPill }} />
</div>
</div>
);
}

export default function PromotionsList() {
const router = useRouter();
const [promos, setPromos] = useState<Promo[]>(PROMO_SEED);
const [statusSel, setStatusSel] = useState('All statuses');
const [typeFilter, setTypeFilter] = useState<string | null>(null);
const [chip, setChip] = useState<PromoStatus | null>(null);
const [query, setQuery] = useState('');
const [page, setPage] = useState(1);
const [selected, setSelected] = useState<Promo | null>(null);
const [drawerTab, setDrawerTab] = useState<'Overview' | 'Activity'>('Overview');
const [deleteTarget, setDeleteTarget] = useState<Promo | null>(null);
const [notice, setNotice] = useState<string | null>(null);

/* Hydrate from the shared mock store (localStorage) + show one-shot notices
 * left by flows that routed back here (e.g. New Promotion submit). */
useEffect(() => {
setPromos(loadPromotions());
const message = consumeListNotice();
if (message) setNotice(message);
}, []);

const counts = useMemo(() => {
const c: Record<PromoStatus, number> = { active: 0, scheduled: 0, expired: 0, draft: 0, pending: 0 };
promos.forEach((p) => c[p.status]++);
return c;
}, [promos]);

/* Unique promotion types present in the data, sorted; drives the type select. */
const typeOptions = useMemo(
() => [ALL_TYPES, ...Array.from(new Set(promos.map((p) => p.type))).sort((a, b) => a.localeCompare(b))],
[promos],
);

const filtered = useMemo(
() =>
promos.filter((p) => {
if (chip && p.status !== chip) return false;
if (statusSel !== 'All statuses' && STATUS[p.status].label !== statusSel) return false;
if (typeFilter && p.type !== typeFilter) return false;
if (query && !`${p.id} ${p.name} ${p.type}`.toLowerCase().includes(query.toLowerCase())) return false;
return true;
}),
[chip, statusSel, typeFilter, query, promos],
);

/* Re-filtering resets to the first page; deletions clamp via currentPage. */
useEffect(() => {
setPage(1);
}, [chip, statusSel, typeFilter, query]);

const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
const currentPage = Math.min(page, pageCount);
const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

const openDrawer = (p: Promo) => {
setSelected(p);
setDrawerTab('Overview');
};

/* Confirm-before-commit (maker-checker): mock-submits the deletion. */
const confirmDelete = () => {
if (!deleteTarget) return;
const next = promos.filter((p) => p.id !== deleteTarget.id);
setPromos(next);
savePromotions(next);
if (selected?.id === deleteTarget.id) setSelected(null);
setNotice(`Deletion of ${deleteTarget.name} (${deleteTarget.id}) submitted for checker approval.`);
setDeleteTarget(null);
};


return (
<div className="promo-page" style={{ background: T.offWhite }}>
{/* Page top bar: Internal Tool Shell title + subtitle, primary action right */}
<div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
<div>
<h1 className="promo-title" style={{ color: T.textPrimary }}>Promotions</h1>
<p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
</div>
{/* data-tour anchor for the onboarding CoachMarks (step 5). */}
<span data-tour="new-promotion">
<PrimaryButton onClick={() => router.push('/admin/promotions/new')}>
<Plus size={16} /> New promotion
</PrimaryButton>
</span>
</div>

<div className="promo-container">
{notice && (
<div className="promo-notice" role="status" style={{ background: T.successBg, borderRadius: T.radiusSm }}>
<CircleCheck size={16} style={{ color: T.success }} />
<span className="promo-notice__text" style={{ color: T.textPrimary }}>{notice}</span>
<button
type="button"
className="promo-icon-btn"
style={{ color: T.textSecondary, borderRadius: T.radiusSm }}
aria-label="Dismiss notice"
onClick={() => setNotice(null)}
onMouseEnter={(e) => (e.currentTarget.style.background = T.white)}
onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
<X size={14} />
</button>
</div>
)}

{/* Stat chips: clicking a chip filters the table by status */}
<div className="promo-chips">
<StatChip label="Active" value={counts.active} active={chip === 'active'} onClick={() => setChip(chip === 'active' ? null : 'active')} />
<StatChip label="Scheduled" value={counts.scheduled} active={chip === 'scheduled'} onClick={() => setChip(chip === 'scheduled' ? null : 'scheduled')} />
<StatChip label="Expired" value={counts.expired} active={chip === 'expired'} onClick={() => setChip(chip === 'expired' ? null : 'expired')} />
<StatChip label="Draft" value={counts.draft} active={chip === 'draft'} onClick={() => setChip(chip === 'draft' ? null : 'draft')} />
<StatChip label="Pending approval" value={counts.pending} active={chip === 'pending'} onClick={() => setChip(chip === 'pending' ? null : 'pending')} />
<StatChip label="Total promotions" value={promos.length} active={chip === null} onClick={() => setChip(null)} />
</div>

{/* Filters: search + status + type selects */}
<div className="promo-filters" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
<div className="promo-search" style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm }}>
<Search size={16} style={{ color: T.textSecondary }} />
<input
value={query}
onChange={(e) => setQuery(e.target.value)}
placeholder="Search by promotion name, ID or type"
style={{ color: T.textPrimary }}
/>
</div>
<FilterSelect label={statusSel} options={STATUSES} onChange={setStatusSel} />
<FilterSelect
label={typeFilter ?? ALL_TYPES}
options={typeOptions}
onChange={(value) => setTypeFilter(value === ALL_TYPES ? null : value)}
/>
</div>


{/* Table: row click opens the detail drawer */}
<div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, overflow: 'hidden' }}>
<div className="promo-table-scroll">
<table className="promo-table">
<thead>
<tr>
{['Promotion', 'Type', 'Schedule', 'Budget / Spend', 'Status'].map((h) => (
<th key={h} style={{ color: T.textSecondary, borderBottom: `1px solid ${T.border}` }}>
{h}
</th>
))}
<th className="promo-actions" style={{ color: T.textSecondary, borderBottom: `1px solid ${T.border}` }}>
Actions
</th>
</tr>
</thead>
<tbody>
{pageRows.map((p, i) => (
<tr
key={p.id}
className="promo-row"
style={i < pageRows.length - 1 ? { borderBottom: `1px solid ${T.border}` } : undefined}
onClick={() => openDrawer(p)}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = T.white)}
>
<td>
<div className="promo-name" style={{ color: T.textPrimary }}>{p.name}</div>
<div className="promo-id" style={{ color: T.textSecondary }}>{p.id}</div>
</td>
<td className="promo-cell" style={{ color: T.textPrimary }}>{p.type}</td>
<td className="promo-schedule" style={{ color: T.textSecondary }}>
<span>
<Clock size={12} />
{p.schedule}
</span>
</td>
<td>
<BudgetCell budget={p.budget} spend={p.spend} />
</td>
<td>
<Badge color={STATUS[p.status].color} ghost={STATUS[p.status].ghost}>{STATUS[p.status].label}</Badge>
</td>
<td className="promo-actions">
<div className="promo-actions__group">
<button
type="button"
className="promo-icon-btn"
style={{ color: T.textSecondary, borderRadius: T.radiusSm }}
aria-label={`Edit ${p.name}`}
onClick={(e) => { e.stopPropagation(); openDrawer(p); }}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
<Pencil size={16} />
</button>
<button
type="button"
className="promo-icon-btn"
style={{ color: T.textSecondary, borderRadius: T.radiusSm }}
aria-label={`Delete ${p.name}`}
onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
<Trash2 size={16} />
</button>
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>

{filtered.length === 0 && (
<div className="promo-empty">
<p className="promo-empty__title" style={{ color: T.textPrimary }}>No promotions match these filters</p>
<p className="promo-empty__hint" style={{ color: T.textSecondary }}>Try clearing the search or status filter above.</p>
</div>
)}

{/* Pagination footer: page size 10, buttons disabled at boundaries */}
{filtered.length > 0 && (
<div className="promo-pagination" style={{ borderTop: `1px solid ${T.border}` }}>
<button
type="button"
className="promo-page-btn"
style={{ color: T.textPrimary, border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, background: T.white }}
disabled={currentPage <= 1}
onClick={() => setPage(currentPage - 1)}
>
‹ Previous
</button>
<span className="promo-page-status" style={{ color: T.textSecondary }}>
<span className="promo-page-current" style={{ color: T.textPrimary, border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm }}>
{currentPage}
</span>
of {pageCount}
</span>
<button
type="button"
className="promo-page-btn"
style={{ color: T.textPrimary, border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, background: T.white }}
disabled={currentPage >= pageCount}
onClick={() => setPage(currentPage + 1)}
>
Next ›
</button>
</div>
)}
</div>
</div>


{/* Detail drawer, house style: scrim + right-side 520px panel. */}
{selected && (
<div role="dialog" aria-modal="true" aria-label={`${selected.name} details`}>
<div className="promo-drawer__scrim" style={{ background: T.scrim }} onClick={() => setSelected(null)} />
<aside className="promo-drawer__panel" style={{ background: T.white, borderLeft: `1px solid ${T.border}` }}>
<div className="promo-drawer__header" style={{ borderBottom: `1px solid ${T.border}` }}>
<div>
<h2 className="promo-drawer__title" style={{ color: T.textPrimary }}>{selected.name}</h2>
<div className="promo-drawer__meta">
<span className="promo-drawer__id" style={{ color: T.textSecondary }}>{selected.id}</span>
<Badge color={STATUS[selected.status].color} ghost={STATUS[selected.status].ghost}>{STATUS[selected.status].label}</Badge>
</div>
</div>
<button
type="button"
className="promo-icon-btn"
style={{ color: T.textSecondary, borderRadius: T.radiusSm }}
aria-label="Close details"
onClick={() => setSelected(null)}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
<X size={16} />
</button>
</div>
<div className="promo-drawer__tabs" style={{ borderBottom: `1px solid ${T.border}` }}>
{(['Overview', 'Activity'] as const).map((tab) => (
<button
key={tab}
type="button"
className={`promo-drawer__tab${drawerTab === tab ? ' promo-drawer__tab--active' : ''}`}
style={
drawerTab === tab
? { color: T.textPrimary, borderBottom: `2px solid ${T.navy}` }
: { color: T.textSecondary, borderBottom: '2px solid transparent' }
}
onClick={() => setDrawerTab(tab)}
>
{tab}
</button>
))}
</div>
<div className="promo-drawer__body">
{drawerTab === 'Overview' ? (
<>
<div className="promo-drawer__grid">
{[
['Type', selected.type],
['Schedule', selected.schedule],
['Status', STATUS[selected.status].label],
['Budget', selected.budget != null ? fmtK(selected.budget) : '·'],
['Spend', selected.spend != null ? fmtK(selected.spend) : '·'],
].map(([label, value]) => (
<div key={label}>
<div className="promo-drawer__label" style={{ color: T.textSecondary }}>{label}</div>
<div className="promo-drawer__value" style={{ color: T.textPrimary }}>{value}</div>
</div>
))}
</div>
<div className="promo-drawer__section">
<div className="promo-drawer__label" style={{ color: T.textSecondary }}>Budget / Spend</div>
<BudgetCell budget={selected.budget} spend={selected.spend} />
</div>
</>
) : (
<p className="promo-drawer__empty" style={{ color: T.textSecondary }}>
No activity recorded yet for this promotion.
</p>
)}
</div>
</aside>
</div>
)}

{/* Delete confirm: confirm-before-commit for the destructive action. */}
{deleteTarget && (
<div role="dialog" aria-modal="true" aria-labelledby="promo-delete-title">
<div className="promo-modal__scrim" style={{ background: T.scrim }} onClick={() => setDeleteTarget(null)} />
<div className="promo-modal__card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
<h2 id="promo-delete-title" className="promo-modal__title" style={{ color: T.textPrimary }}>
Delete {deleteTarget.name}?
</h2>
<p className="promo-modal__body" style={{ color: T.textSecondary }}>
This will submit the deletion for checker approval.
</p>
<div className="promo-modal__actions">
<GhostButton onClick={() => setDeleteTarget(null)}>Cancel</GhostButton>
<DestructiveGhostButton onClick={confirmDelete}>Submit for approval</DestructiveGhostButton>
</div>
</div>
</div>
)}
</div>
);
}

