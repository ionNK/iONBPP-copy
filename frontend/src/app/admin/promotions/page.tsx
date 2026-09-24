'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleCheck, Clock, Funnel, Pencil, Plus, Search, Trash2, TriangleAlert, X } from 'lucide-react';
import './promotions.css';
import T from '@/theme/tokens';
import { Badge, Checkbox, DateRangePicker, DestructiveGhostButton, FilterChip, GhostButton, PrimaryButton, StatChip } from '@/components/ui';
import type { DateRange } from '@/components/ui';
import { CHANNELS, CHANNEL_LABELS, NOTIFICATION_TRIGGERS, NOTIFICATION_TRIGGER_LABELS, PROMO_SEED, channelSummary, consumeListNotice, enabledNotificationTriggers, formatScheduleDate, loadPromotions, notificationChannelSummary, parseSchedule, savePromotions, scheduleOverlaps, sortPromotionsDefault } from '@/lib/promotions';
import type { Channel, Promo, PromoStatus } from '@/lib/promotions';
import { PRODUCT_VERTICALS } from '@/data/promotion-templates';
import { loadSettings } from '@/lib/settings';
import type { ProviderCode } from '@/lib/settings';
import { features } from '@/config/features';
import { runningExperimentForPromotion } from '@/lib/experiments/mockExperiments';

const STATUS: Record<PromoStatus, { label: string; color: string; ghost?: boolean }> = {
active: { label: 'Active', color: T.success },
scheduled: { label: 'Scheduled', color: T.blue },
expired: { label: 'Expired', color: T.darkGrey },
draft: { label: 'Draft', color: T.draft },
/* Maker-checker queue state: ghost pill with navy text. */
pending: { label: 'Pending approval', color: T.navy, ghost: true },
};

/* Status facet order mirrors the StatChip row. */
const STATUS_ORDER: PromoStatus[] = ['active', 'scheduled', 'expired', 'draft', 'pending'];

/* Table pagination, house style: page size 10. */
const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Filter facets: multi-select per facet, all facets AND-ed together.  */
/* Applied filters live in `filters`; the panel edits a draft copy      */
/* until Apply (same draft-until-Apply rule as the DateRangePicker).    */
/* ------------------------------------------------------------------ */

interface PromoFilters {
statuses: PromoStatus[];
types: string[];
channels: Channel[];
verticals: string[];
providers: string[];
dateRange: DateRange | null;
}

const EMPTY_FILTERS: PromoFilters = { statuses: [], types: [], channels: [], verticals: [], providers: [], dateRange: null };

type ListFacet = Exclude<keyof PromoFilters, 'dateRange'>;

const FACET_LABELS: Record<keyof PromoFilters, string> = {
statuses: 'Status',
types: 'Type',
channels: 'Channel',
verticals: 'Vertical',
providers: 'Provider',
dateRange: 'Date range',
};

const countActiveFilters = (f: PromoFilters): number =>
f.statuses.length + f.types.length + f.channels.length + f.verticals.length + f.providers.length + (f.dateRange ? 1 : 0);

/* Local calendar day → UTC midnight, the unit `parseSchedule` works in. */
const toUtcDay = (d: Date): number => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

const fmtRange = (r: DateRange): string => `${formatScheduleDate(toUtcDay(r.from))} – ${formatScheduleDate(toUtcDay(r.to))}`;

const toggleValue = <V,>(list: V[], value: V, on: boolean): V[] =>
on ? (list.includes(value) ? list : [...list, value]) : list.filter((v) => v !== value);

/* One facet inside the filter panel: 14px/600 title + a column of Checkboxes. */
function FacetGroup<V extends string>({ title, options, selected, onToggle }: {
title: string;
options: { value: V; label: string }[];
selected: V[];
onToggle: (value: V, on: boolean) => void;
}) {
return (
<div className="promo-facet" role="group" aria-label={title}>
<div className="promo-facet__title" style={{ color: T.textPrimary }}>{title}</div>
{options.length === 0 ? (
<div className="promo-facet__empty" style={{ color: T.textSecondary }}>No options</div>
) : (
<div className="promo-facet__options">
{options.map((opt) => (
<Checkbox key={opt.value} checked={selected.includes(opt.value)} onChange={(on) => onToggle(opt.value, on)} label={opt.label} />
))}
</div>
)}
</div>
);
}

/* Schedule cell: "01 Sep 2026 → 31 Oct 2026", "… → Ongoing", or "Not scheduled" for drafts. */
function ScheduleCell({ schedule }: { schedule: string }) {
const parsed = parseSchedule(schedule);
if (parsed.start === null) {
return <span style={{ color: T.textSecondary }}>Not scheduled</span>;
}
return (
<span style={{ color: T.textPrimary }}>
<Clock size={12} style={{ color: T.textSecondary }} aria-hidden="true" />
{formatScheduleDate(parsed.start)}
<ArrowRight size={12} style={{ color: T.textSecondary }} aria-hidden="true" />
{parsed.end !== null ? formatScheduleDate(parsed.end) : <span style={{ color: T.textSecondary }}>Ongoing</span>}
</span>
);
}

const fmtK = (n: number) => `K ${n.toLocaleString()}`;

/* Budget cell (BR-6): alert threshold, never enforcement.
 * With features.budgets off the cell degrades to spend only — no budget, ratio bar or alert. */
function BudgetCell({ budget, spend }: { budget: number | null; spend: number | null }) {
if (!features.budgets) {
return spend == null
? <span className="promo-budget__empty" style={{ color: T.textSecondary }}>·</span>
: <span style={{ color: T.textPrimary }}>{fmtK(spend)}</span>;
}
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
const [providers, setProviders] = useState<ProviderCode[]>([]);
const [chip, setChip] = useState<PromoStatus | null>(null);
const [query, setQuery] = useState('');
/* Applied facet filters + the panel's draft copy (committed on Apply). */
const [filters, setFilters] = useState<PromoFilters>(EMPTY_FILTERS);
const [filterDraft, setFilterDraft] = useState<PromoFilters>(EMPTY_FILTERS);
const [filtersOpen, setFiltersOpen] = useState(false);
const [page, setPage] = useState(1);
const [selected, setSelected] = useState<Promo | null>(null);
const [drawerTab, setDrawerTab] = useState<'Overview' | 'Activity'>('Overview');
const [deleteTarget, setDeleteTarget] = useState<Promo | null>(null);
const [notice, setNotice] = useState<string | null>(null);

/* Hydrate from the shared mock stores (localStorage) + show one-shot notices
 * left by flows that routed back here (e.g. New Promotion submit). Provider
 * codes come from Settings so the Provider facet shows names, not just codes. */
useEffect(() => {
/* eslint-disable react-hooks/set-state-in-effect -- mount-only hydration from localStorage / sessionStorage */
setPromos(loadPromotions());
setProviders(loadSettings().providers);
const message = consumeListNotice();
if (message) setNotice(message);
/* eslint-enable react-hooks/set-state-in-effect */
}, []);

const counts = useMemo(() => {
const c: Record<PromoStatus, number> = { active: 0, scheduled: 0, expired: 0, draft: 0, pending: 0 };
promos.forEach((p) => c[p.status]++);
return c;
}, [promos]);

/* Facet options. Type / Vertical / Provider derive from the data so the panel
 * never offers a value that matches nothing; verticals keep catalog order. */
const typeOptions = useMemo(
() => Array.from(new Set(promos.map((p) => p.type))).sort((a, b) => a.localeCompare(b)).map((t) => ({ value: t, label: t })),
[promos],
);
const verticalOptions = useMemo(() => {
const present = new Set(promos.map((p) => p.vertical).filter((v): v is string => v !== null));
const known = PRODUCT_VERTICALS.filter((v) => present.has(v));
const extra = Array.from(present).filter((v) => !(PRODUCT_VERTICALS as string[]).includes(v)).sort();
return [...known, ...extra].map((v) => ({ value: v, label: v }));
}, [promos]);
const providerOptions = useMemo(() => {
const present = Array.from(new Set(promos.map((p) => p.providerCode).filter((c): c is string => c !== null))).sort();
return present.map((code) => {
const provider = providers.find((p) => p.code === code);
return { value: code, label: provider ? `${provider.name} (${code})` : code };
});
}, [promos, providers]);
const providerLabel = (code: string) => providerOptions.find((o) => o.value === code)?.label ?? code;

const filtered = useMemo(() => {
const range = filters.dateRange ? { from: toUtcDay(filters.dateRange.from), to: toUtcDay(filters.dateRange.to) } : null;
const rows = promos.filter((p) => {
if (chip && p.status !== chip) return false;
if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false;
if (filters.types.length > 0 && !filters.types.includes(p.type)) return false;
if (filters.channels.length > 0 && !filters.channels.some((c) => p.channels.includes(c))) return false;
if (filters.verticals.length > 0 && (p.vertical === null || !filters.verticals.includes(p.vertical))) return false;
if (filters.providers.length > 0 && (p.providerCode === null || !filters.providers.includes(p.providerCode))) return false;
if (range && !scheduleOverlaps(p.schedule, range.from, range.to)) return false;
if (query && !`${p.id} ${p.name} ${p.type}`.toLowerCase().includes(query.toLowerCase())) return false;
return true;
});
/* Default sort: Active first, then start date descending. */
return sortPromotionsDefault(rows);
}, [chip, filters, query, promos]);

/* Re-filtering resets to the first page (done in the handlers, not an
 * effect); deletions clamp via currentPage. */
const changeChip = (next: PromoStatus | null) => { setChip(next); setPage(1); };
const changeQuery = (next: string) => { setQuery(next); setPage(1); };
const changeFilters = (next: PromoFilters | ((f: PromoFilters) => PromoFilters)) => { setFilters(next); setPage(1); };

const activeFilterCount = countActiveFilters(filters);

/* Filter panel: opens on a fresh draft of the applied filters. */
const openFilters = () => {
setFilterDraft(filters);
setFiltersOpen(true);
};
const applyFilters = () => {
changeFilters(filterDraft);
setFiltersOpen(false);
};
const toggleDraft = <K extends ListFacet>(facet: K, value: PromoFilters[K][number], on: boolean) =>
setFilterDraft((d) => ({ ...d, [facet]: toggleValue(d[facet] as PromoFilters[K][number][], value, on) }));
const removeFilter = <K extends ListFacet>(facet: K, value: PromoFilters[K][number]) =>
changeFilters((f) => ({ ...f, [facet]: (f[facet] as PromoFilters[K][number][]).filter((v) => v !== value) }));

/* Escape closes the filter panel (the drawer + modal already close via their scrims). */
useEffect(() => {
if (!filtersOpen) return;
const onKey = (e: KeyboardEvent) => {
if (e.key === 'Escape') setFiltersOpen(false);
};
document.addEventListener('keydown', onKey);
return () => document.removeEventListener('keydown', onKey);
}, [filtersOpen]);

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
<StatChip label="Total promotions" value={promos.length} active={chip === null} onClick={() => changeChip(null)} />
<StatChip label="Active" value={counts.active} active={chip === 'active'} onClick={() => changeChip(chip === 'active' ? null : 'active')} />
<StatChip label="Scheduled" value={counts.scheduled} active={chip === 'scheduled'} onClick={() => changeChip(chip === 'scheduled' ? null : 'scheduled')} />
<StatChip label="Expired" value={counts.expired} active={chip === 'expired'} onClick={() => changeChip(chip === 'expired' ? null : 'expired')} />
<StatChip label="Draft" value={counts.draft} active={chip === 'draft'} onClick={() => changeChip(chip === 'draft' ? null : 'draft')} />
<StatChip label="Pending approval" value={counts.pending} active={chip === 'pending'} onClick={() => changeChip(chip === 'pending' ? null : 'pending')} />
</div>

{/* Toolbar: search + Filters button (opens the facet panel). Status and
 * Channel moved into the panel so the bar stays a single row. */}
<div className="promo-filters" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
<div className="promo-search" style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm }}>
<Search size={16} style={{ color: T.textSecondary }} />
<input
value={query}
onChange={(e) => changeQuery(e.target.value)}
placeholder="Search by promotion name, ID or type"
style={{ color: T.textPrimary }}
/>
</div>
<button
type="button"
className="promo-filter-btn"
aria-haspopup="dialog"
aria-expanded={filtersOpen}
onClick={openFilters}
style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.textPrimary, background: T.white }}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = T.white)}
>
<Funnel size={16} style={{ color: T.textSecondary }} aria-hidden="true" />
Filters
{activeFilterCount > 0 && (
<span className="promo-filter-btn__count" style={{ background: T.navy, color: T.white, borderRadius: T.radiusPill }}>
{activeFilterCount}
</span>
)}
</button>
</div>

{/* Active filters: dismissible chips, one per selected value. */}
{activeFilterCount > 0 && (
<div className="promo-active-filters" role="region" aria-label="Active filters">
{filters.statuses.map((s) => (
<FilterChip key={`status-${s}`} label={FACET_LABELS.statuses} value={STATUS[s].label} onRemove={() => removeFilter('statuses', s)} />
))}
{filters.types.map((t) => (
<FilterChip key={`type-${t}`} label={FACET_LABELS.types} value={t} onRemove={() => removeFilter('types', t)} />
))}
{filters.channels.map((c) => (
<FilterChip key={`channel-${c}`} label={FACET_LABELS.channels} value={CHANNEL_LABELS[c]} onRemove={() => removeFilter('channels', c)} />
))}
{filters.verticals.map((v) => (
<FilterChip key={`vertical-${v}`} label={FACET_LABELS.verticals} value={v} onRemove={() => removeFilter('verticals', v)} />
))}
{filters.providers.map((p) => (
<FilterChip key={`provider-${p}`} label={FACET_LABELS.providers} value={providerLabel(p)} onRemove={() => removeFilter('providers', p)} />
))}
{filters.dateRange && (
<FilterChip label={FACET_LABELS.dateRange} value={fmtRange(filters.dateRange)} onRemove={() => changeFilters((f) => ({ ...f, dateRange: null }))} />
)}
{activeFilterCount > 1 && (
<button
type="button"
className="promo-active-filters__clear"
style={{ color: T.textSecondary }}
onClick={() => changeFilters(EMPTY_FILTERS)}
>
Clear all
</button>
)}
</div>
)}


{/* Table: row click opens the detail drawer */}
<div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, overflow: 'hidden' }}>
<div className="promo-table-scroll">
<table className="promo-table">
<thead>
<tr>
{['Promotion', 'Vertical', 'Schedule', 'Status'].map((h) => (
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
{/* Type tag under the name (ghost pill) + ID. */}
<div className="promo-name__meta">
<Badge color={T.textPrimary} ghost>{p.type}</Badge>
<span className="promo-id" style={{ color: T.textSecondary }}>{p.id}</span>
{/* Read-only experiment membership (demo flag). Only Running experiments tag their arms. */}
{features.experiments && runningExperimentForPromotion(p.id) && (
<span data-testid="promo-experiment-tag" title="This promotion is an arm of a running experiment">
<Badge color={T.navy} ghost>In experiment {runningExperimentForPromotion(p.id)?.id}</Badge>
</span>
)}
</div>
</td>
<td className="promo-cell" style={{ color: p.vertical ? T.textPrimary : T.textSecondary }}>
{p.vertical ?? 'Cross-product'}
</td>
<td className="promo-schedule">
<ScheduleCell schedule={p.schedule} />
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
<p className="promo-empty__hint" style={{ color: T.textSecondary }}>Try clearing the search or the active filters above.</p>
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


{/* Filter panel, house style: scrim + right-side panel (400px). Draft-until-Apply. */}
{filtersOpen && (
<div role="dialog" aria-modal="true" aria-labelledby="promo-filters-title">
<div className="promo-drawer__scrim" style={{ background: T.scrim }} onClick={() => setFiltersOpen(false)} />
<aside className="promo-drawer__panel promo-drawer__panel--filters" style={{ background: T.white, borderLeft: `1px solid ${T.border}` }}>
<div className="promo-drawer__header" style={{ borderBottom: `1px solid ${T.border}` }}>
<div>
<h2 id="promo-filters-title" className="promo-drawer__title" style={{ color: T.textPrimary }}>Filters</h2>
<div className="promo-drawer__id" style={{ color: T.textSecondary, marginTop: 4 }}>
{countActiveFilters(filterDraft) === 0 ? 'No filters selected' : `${countActiveFilters(filterDraft)} selected`}
</div>
</div>
<button
type="button"
className="promo-icon-btn"
style={{ color: T.textSecondary, borderRadius: T.radiusSm }}
aria-label="Close filters"
onClick={() => setFiltersOpen(false)}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
<X size={16} />
</button>
</div>
<div className="promo-drawer__body promo-facets">
<FacetGroup
title={FACET_LABELS.statuses}
options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].label }))}
selected={filterDraft.statuses}
onToggle={(v, on) => toggleDraft('statuses', v, on)}
/>
<FacetGroup title={FACET_LABELS.types} options={typeOptions} selected={filterDraft.types} onToggle={(v, on) => toggleDraft('types', v, on)} />
<FacetGroup
title={FACET_LABELS.channels}
options={CHANNELS.map((c) => ({ value: c as Channel, label: CHANNEL_LABELS[c] }))}
selected={filterDraft.channels}
onToggle={(v, on) => toggleDraft('channels', v, on)}
/>
<FacetGroup title={FACET_LABELS.verticals} options={verticalOptions} selected={filterDraft.verticals} onToggle={(v, on) => toggleDraft('verticals', v, on)} />
<FacetGroup title={FACET_LABELS.providers} options={providerOptions} selected={filterDraft.providers} onToggle={(v, on) => toggleDraft('providers', v, on)} />
<div className="promo-facet" role="group" aria-label={FACET_LABELS.dateRange}>
<div className="promo-facet__title" style={{ color: T.textPrimary }}>{FACET_LABELS.dateRange}</div>
<div className="promo-facet__hint" style={{ color: T.textSecondary }}>Promotions running at any point in the range.</div>
<DateRangePicker
value={filterDraft.dateRange}
onChange={(range) => setFilterDraft((d) => ({ ...d, dateRange: range }))}
ariaLabel="Schedule date range"
placeholder="Any dates"
/>
</div>
</div>
<div className="promo-drawer__footer" style={{ borderTop: `1px solid ${T.border}` }}>
<GhostButton onClick={() => setFilterDraft(EMPTY_FILTERS)}>Clear all</GhostButton>
<div className="promo-drawer__footer-actions">
<GhostButton onClick={() => setFiltersOpen(false)}>Cancel</GhostButton>
<PrimaryButton onClick={applyFilters}>Apply</PrimaryButton>
</div>
</div>
</aside>
</div>
)}

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
['Vertical', selected.vertical ?? 'Cross-product'],
['Provider', selected.providerCode ? providerLabel(selected.providerCode) : '·'],
['Channels', channelSummary(selected.channels)],
...(features.budgets ? [['Budget', selected.budget != null ? fmtK(selected.budget) : '·']] : []),
['Spend', selected.spend != null ? fmtK(selected.spend) : '·'],
].map(([label, value]) => (
<div key={label}>
<div className="promo-drawer__label" style={{ color: T.textSecondary }}>{label}</div>
<div className="promo-drawer__value" style={{ color: T.textPrimary }}>{value}</div>
</div>
))}
</div>
{/* Budget / Spend ratio (BR-6): hidden behind features.budgets; Spend is already shown in the grid above. */}
{features.budgets && (
<div className="promo-drawer__section">
<div className="promo-drawer__label" style={{ color: T.textSecondary }}>Budget / Spend</div>
<BudgetCell budget={selected.budget} spend={selected.spend} />
</div>
)}
<div className="promo-drawer__section">
<div className="promo-drawer__label" style={{ color: T.textSecondary }}>Player notifications</div>
{enabledNotificationTriggers(selected.notifications).length === 0 ? (
<div className="promo-drawer__value" style={{ color: T.textSecondary }}>No player messages configured.</div>
) : (
<div className="promo-notify-list">
{NOTIFICATION_TRIGGERS.filter((trigger) => selected.notifications[trigger].enabled).map((trigger) => {
const rule = selected.notifications[trigger];
return (
<div key={trigger} className="promo-notify-card" style={{ background: T.offWhite, borderRadius: T.radiusSm }}>
<div className="promo-notify-card__head">
<span className="promo-drawer__value" style={{ color: T.textPrimary, fontWeight: 500 }}>{NOTIFICATION_TRIGGER_LABELS[trigger]}</span>
<span className="promo-drawer__label" style={{ color: T.textSecondary, marginBottom: 0 }}>{notificationChannelSummary(rule.channels)}</span>
</div>
<div className="promo-drawer__value" style={{ color: T.textPrimary }}>{rule.title}</div>
<div className="promo-drawer__label" style={{ color: T.textSecondary }}>{rule.body}</div>
</div>
);
})}
</div>
)}
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

