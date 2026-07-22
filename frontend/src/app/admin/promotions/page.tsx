'use client';
import Link from 'next/link';
import {
 Plus, Search, Filter, MoreVertical,
 CheckCircle2, AlertCircle,
 PlayCircle, ChevronLeft, ChevronRight,
 RefreshCw, Edit, Trash2, Eye, Copy, LayoutTemplate,
 X, ChevronDown
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { SEED_PROMOTIONS_FROM_TEMPLATES } from '@/data/seedTemplates';

// Helper: infer a product line from the promotion type / name.
function inferProduct(type?: string, name?: string): string {
 const t = `${type || ''} ${name || ''}`.toLowerCase();
 if (/aviator|crash|spin|casino|slot|jet|plinko|mines/.test(t)) return 'Casino';
 if (/acca|sportsbook|bet|odds|league|match/.test(t)) return 'Sportsbook';
 if (/deposit|welcome|cashback|bonus/.test(t)) return 'Deposit';
 return 'Other';
}

// Helper: infer a budget state from cost / status.
function inferBudgetState(promo: any): string {
 const s = (promo.status || '').toLowerCase();
 if (s === 'draft' || s === 'scheduled') return 'Not Started';
 const cost = String(promo.stats?.cost || '').replace(/[^0-9.]/g, '');
 const n = Number(cost);
 if (!cost || cost === '-' || isNaN(n) || n === 0) return 'Healthy';
 if (n >= 100000) return 'Exhausted';
 if (n >= 50000) return 'At Risk';
 return 'Healthy';
}

// Helper: infer tags from name/type.
function inferTags(promo: any): string[] {
 const tags = new Set<string>();
 const t = `${promo.type || ''} ${promo.name || ''}`.toLowerCase();
 if (/new|welcome/.test(t)) tags.add('Acquisition');
 if (/cashback|loss/.test(t)) tags.add('Retention');
 if (/aviator|casino|spin/.test(t)) tags.add('Casino');
 if (/acca|sportsbook/.test(t)) tags.add('Sportsbook');
 if (/launch/.test(t)) tags.add('Launch');
 if (Array.isArray(promo.badges)) promo.badges.forEach((b: string) => tags.add(b));
 return Array.from(tags);
}

// Default seeds if empty
const SEED_PROMOTIONS = [
    {
        id: 'PRM-2024-001',
        name: 'Ethiopia Acca Insurance',
        type: 'Cashback',
        status: 'active',
        segment: 'Sportsbook Players',
 stats: { claims: 1240, cost: 'ETB 124,000', conversion: '12%' },
 period: 'Feb 1 - Ongoing',
 startDate: '2024-02-01',
 endDate: null
    },
    {
        id: 'PRM-2024-002',
        name: 'Cashia Launch Cashback',
        type: 'Deposit Match',
        status: 'active',
        segment: 'New Users',
 stats: { claims: 342, cost: '€3,400', conversion: '15%' },
 period: 'Feb 1 - Feb 28',
 startDate: '2024-02-01',
 endDate: '2024-02-28'
    },
    {
        id: 'PRM-2024-003',
        name: 'Super League Welcome Bonus',
        type: 'Deposit Match',
        status: 'paused',
        segment: 'New Users',
 stats: { claims: 850, cost: '€8,500', conversion: '8%' },
 period: 'Mar 1 - Mar 31',
 startDate: '2024-03-01',
 endDate: '2024-03-31'
    }
];

export default function PromotionsList() {
  const [promotions, setPromotions] = useState<any[]>([]);
 const [filter, setFilter] = useState('all');
 const [search, setSearch] = useState('');
 const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

 // Advanced faceted filters
 const [showFilters, setShowFilters] = useState(false);
 const [fMarket, setFMarket] = useState('');
 const [fProduct, setFProduct] = useState('');
 const [fType, setFType] = useState('');
 const [fOwner, setFOwner] = useState('');
 const [fBudget, setFBudget] = useState('');
 const [fTag, setFTag] = useState('');
 const [fStart, setFStart] = useState('');
 const [fEnd, setFEnd] = useState('');


  useEffect(() => {
    const loadPromotions = async () => {
      // 1. Start with local storage (prototype drafts) + seeds
      const saved = JSON.parse(localStorage.getItem('saved_promotions') || '[]');

      // 2. Try to fetch the real, persisted promotions from the backend
      let apiPromos: any[] = [];
      try {
        const res = await fetch('http://localhost:4000/promotions');
        if (res.ok) {
          const data = await res.json();
          apiPromos = (Array.isArray(data) ? data : []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            status: p.status,
            segment: p.config?.segment || 'All Players',
            stats: { claims: 0, cost: '-', conversion: '-' },
 period: p.startDate
 ? `${new Date(p.startDate).toLocaleDateString()} - ${p.endDate ? new Date(p.endDate).toLocaleDateString() : 'Ongoing'}`
 : 'Scheduled',
 startDate: p.startDate || null,
 endDate: p.endDate || null,
 _source: 'api',
          }));
        }
      } catch (err) {
        console.warn('Could not reach backend for promotions, falling back to local data.', err);
      }

      // 3. Merge: backend records first, then any local-only drafts, then missing seeds
      const apiNames = new Set(apiPromos.map((p: any) => p.name));
      const localOnly = saved.filter((p: any) => !apiNames.has(p.name));
        const combinedNames = new Set([...apiNames, ...localOnly.map((p: any) => p.name)]);
        // Combine the legacy demo seeds with the template-backed seed offers.
        const allSeeds = [...SEED_PROMOTIONS_FROM_TEMPLATES, ...SEED_PROMOTIONS];
        const missingSeeds = allSeeds.filter(s => !combinedNames.has(s.name));

      let allPromos = [...apiPromos, ...localOnly, ...missingSeeds];

 // Ensure required display fields exist + derive filterable facets
 allPromos = allPromos.map(p => {
 const stats = p.stats || { claims: 0, cost: '-', conversion: '-' };
 const withStats = { ...p, stats, segment: p.segment || 'All Players', period: p.period || 'Scheduled' };
 // Derive a market code (fall back to inference / KE)
 let market = (p.market || (Array.isArray(p.markets) ? p.markets[0] : '') || '').toUpperCase();
 if (!market) {
 const t = `${p.name || ''} ${p.type || ''}`.toLowerCase();
 if (t.includes('ethiopia')) market = 'ET';
 else if (t.includes('cashia')) market = 'EU';
 else market = 'KE';
 }
 return {
 ...withStats,
 market,
 product: p.product || inferProduct(p.type, p.name),
 owner: p.owner || 'Promotions Team',
 startDate: p.startDate || null,
 endDate: p.endDate || null,
 budgetState: p.budgetState || inferBudgetState(withStats),
 tags: (p.tags && p.tags.length) ? p.tags : inferTags(withStats),
 };
 });

 setPromotions(allPromos);

    };

    loadPromotions();
  }, []);


  const counts = {
    all: promotions.length,
    active: promotions.filter(p => p.status?.toLowerCase() === 'active').length,
    paused: promotions.filter(p => p.status?.toLowerCase() === 'paused').length,
    scheduled: promotions.filter(p => p.status?.toLowerCase() === 'scheduled').length,
    draft: promotions.filter(p => p.status?.toLowerCase() === 'draft').length,
  };

 // Build facet option lists from loaded promotions
 const facetOptions = useMemo(() => {
 const markets = new Set<string>();
 const products = new Set<string>();
 const types = new Set<string>();
 const owners = new Set<string>();
 const budgets = new Set<string>();
 const tags = new Set<string>();
 promotions.forEach(p => {
 if (p.market) markets.add(p.market);
 if (p.product) products.add(p.product);
 if (p.type) types.add(p.type);
 if (p.owner) owners.add(p.owner);
 if (p.budgetState) budgets.add(p.budgetState);
 (p.tags || []).forEach((t: string) => tags.add(t));
 });
 const sort = (s: Set<string>) => Array.from(s).sort();
 return {
 markets: sort(markets),
 products: sort(products),
 types: sort(types),
 owners: sort(owners),
 budgets: sort(budgets),
 tags: sort(tags),
 };
 }, [promotions]);

 // Count how many advanced filters are active
 const activeFilterCount =
 [fMarket, fProduct, fType, fOwner, fBudget, fTag, fStart, fEnd].filter(Boolean).length;

 const clearAllFilters = () => {
 setSearch('');
 setFilter('all');
 setFMarket(''); setFProduct(''); setFType(''); setFOwner('');
 setFBudget(''); setFTag(''); setFStart(''); setFEnd('');
 };

 // Helper: extract a comparable date from a promotion for range filtering.
 const promoStartMs = (p: any): number | null => {
 if (p.startDate) {
 const d = new Date(p.startDate).getTime();
 return isNaN(d) ? null : d;
 }
 return null;
 };
 const promoEndMs = (p: any): number | null => {
 if (p.endDate) {
 const d = new Date(p.endDate).getTime();
 return isNaN(d) ? null : d;
 }
 return null;
 };

 const filteredPromotions = promotions.filter(p => {
 const matchesFilter = filter === 'all' || p.status?.toLowerCase() === filter;
 const q = search.trim().toLowerCase();
 const matchesSearch =
 !q ||
 p.name?.toLowerCase().includes(q) ||
 p.type?.toLowerCase().includes(q) ||
 p.segment?.toLowerCase().includes(q) ||
 p.owner?.toLowerCase().includes(q) ||
 (p.tags || []).some((t: string) => t.toLowerCase().includes(q)) ||
 String(p.id).toLowerCase().includes(q);

 const matchesMarket = !fMarket || p.market === fMarket;
 const matchesProduct = !fProduct || p.product === fProduct;
 const matchesType = !fType || p.type === fType;
 const matchesOwner = !fOwner || p.owner === fOwner;
 const matchesBudget = !fBudget || p.budgetState === fBudget;
 const matchesTag = !fTag || (p.tags || []).includes(fTag);

 // Date range: promotion must start on/after fStart and end on/before fEnd (when set)
 let matchesDates = true;
 if (fStart) {
 const start = promoStartMs(p);
 const min = new Date(fStart).getTime();
 if (start === null || start < min) matchesDates = false;
 }
 if (matchesDates && fEnd) {
 const end = promoEndMs(p) ?? promoStartMs(p);
 const max = new Date(fEnd).getTime();
 if (end === null || end > max) matchesDates = false;
 }

 return matchesFilter && matchesSearch && matchesMarket && matchesProduct &&
 matchesType && matchesOwner && matchesBudget && matchesTag && matchesDates;
 });


    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            // Ignore clicks on the trigger button itself or inside the menu
            if (target.closest('.btn-icon') || target.closest('.action-menu')) {
                return;
            }
            setActiveMenuId(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="page-container promotions-page">
            {/* 1. Header & Actions */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Promotions</h1>
                    <p className="page-subtitle">Manage and track your campaign performance.</p>
                </div>
        <div className="header-actions">
          <button className="btn btn-secondary icon-only"><RefreshCw size={18} /></button>
          <Link href="/admin/promotions/templates" className="btn btn-secondary">
            <LayoutTemplate size={18} /> Templates
          </Link>
          <Link href="/admin/promotions/create" className="btn btn-primary btn-new-promo">
            <Plus size={18} /> New Promotion
          </Link>
        </div>
            </div>

      {/* 2. Filter Tabs (top) */}
      <div className="filter-group filter-top">
        <div className="tabs">
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All <span className="tab-count">{counts.all}</span></button>
          <button className={`tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Active <span className="tab-count">{counts.active}</span></button>
          <button className={`tab ${filter === 'paused' ? 'active' : ''}`} onClick={() => setFilter('paused')}>Paused <span className="tab-count">{counts.paused}</span></button>
          <button className={`tab ${filter === 'scheduled' ? 'active' : ''}`} onClick={() => setFilter('scheduled')}>Scheduled <span className="tab-count">{counts.scheduled}</span></button>
 <button className={`tab ${filter === 'draft' ? 'active' : ''}`} onClick={() => setFilter('draft')}>Drafts <span className="tab-count">{counts.draft}</span></button>
 </div>

 <button
 className={`btn btn-secondary filter-toggle ${showFilters ? 'active' : ''}`}
 onClick={() => setShowFilters(s => !s)}
 >
 <Filter size={16} /> Filters
 {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
 <ChevronDown size={14} className={`chev ${showFilters ? 'open' : ''}`} />
 </button>

 <div className="search-group">
 <Search size={18} className="search-icon" />
 <input
 type="text"
 placeholder="Search by name, type, owner or tag..."
 className="search-input"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 {search && (
 <button className="clear-search" onClick={() => setSearch('')} title="Clear search">
 <X size={14} />
 </button>
 )}
 </div>

 {(activeFilterCount > 0 || search || filter !== 'all') && (
 <button className="btn btn-secondary clear-all" onClick={clearAllFilters}>
 <X size={14} /> Clear all
 </button>
 )}
 </div>



 {/* 3b. Advanced Filter Panel */}
 {showFilters && (
 <div className="filter-panel glass-panel ds-panel">
 <div className="filter-grid">
 <div className="filter-field">
 <label>Market</label>
 <select className="ds-select" value={fMarket} onChange={(e) => setFMarket(e.target.value)}>
 <option value="">All markets</option>
 {facetOptions.markets.map(m => <option key={m} value={m}>{m}</option>)}
 </select>
 </div>
 <div className="filter-field">
 <label>Product</label>
 <select className="ds-select" value={fProduct} onChange={(e) => setFProduct(e.target.value)}>
 <option value="">All products</option>
 {facetOptions.products.map(p => <option key={p} value={p}>{p}</option>)}
 </select>
 </div>
 <div className="filter-field">
 <label>Type</label>
 <select className="ds-select" value={fType} onChange={(e) => setFType(e.target.value)}>
 <option value="">All types</option>
 {facetOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
 </select>
 </div>
 <div className="filter-field">
 <label>Owner</label>
 <select className="ds-select" value={fOwner} onChange={(e) => setFOwner(e.target.value)}>
 <option value="">All owners</option>
 {facetOptions.owners.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </div>
 <div className="filter-field">
 <label>Budget State</label>
 <select className="ds-select" value={fBudget} onChange={(e) => setFBudget(e.target.value)}>
 <option value="">Any budget state</option>
 {facetOptions.budgets.map(b => <option key={b} value={b}>{b}</option>)}
 </select>
 </div>
 <div className="filter-field">
 <label>Tag</label>
 <select className="ds-select" value={fTag} onChange={(e) => setFTag(e.target.value)}>
 <option value="">All tags</option>
 {facetOptions.tags.map(t => <option key={t} value={t}>{t}</option>)}
 </select>
 </div>
 <div className="filter-field">
 <label>Starts on/after</label>
 <input className="ds-control" type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} />
 </div>
 <div className="filter-field">
 <label>Ends on/before</label>
 <input className="ds-control" type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} />
 </div>
 </div>
 </div>
 )}

 {/* 3c. Active filter chips */}
 {activeFilterCount > 0 && (
 <div className="chips-row">
 {fMarket && <FilterChip label={`Market: ${fMarket}`} onClear={() => setFMarket('')} />}
 {fProduct && <FilterChip label={`Product: ${fProduct}`} onClear={() => setFProduct('')} />}
 {fType && <FilterChip label={`Type: ${fType}`} onClear={() => setFType('')} />}
 {fOwner && <FilterChip label={`Owner: ${fOwner}`} onClear={() => setFOwner('')} />}
 {fBudget && <FilterChip label={`Budget: ${fBudget}`} onClear={() => setFBudget('')} />}
 {fTag && <FilterChip label={`Tag: ${fTag}`} onClear={() => setFTag('')} />}
 {fStart && <FilterChip label={`From: ${fStart}`} onClear={() => setFStart('')} />}
 {fEnd && <FilterChip label={`To: ${fEnd}`} onClear={() => setFEnd('')} />}
 </div>
 )}


            {/* 3. Data Grid */}
            <div className="grid-container glass-panel ds-panel">
                <table className="data-table">
                    <thead>
                        <tr>
 <th>Promotion Name</th>
 <th>Type</th>
 <th>Status</th>
 <th>Starts</th>
 <th>Ends</th>
 <th className="promotions-page__actions-column" />
                        </tr>
                    </thead>
              <tbody>
                {filteredPromotions.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <AlertCircle size={32} />
                        <p className="empty-title">No promotions found</p>
                        <p className="empty-sub">
                          {search.trim()
                            ? `No results match "${search.trim()}".`
                            : `There are no ${filter === 'all' ? '' : filter + ' '}promotions yet.`}
                        </p>
                        {(search.trim() || filter !== 'all') && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setSearch(''); setFilter('all'); }}
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {filteredPromotions.map((promo) => (
                            <tr key={promo.id}>
 <td>
 <div className="cell-primary">
 <Link href={`/admin/promotions/${promo.id}`} className="cell-title hover-link">
 {promo.name}
                                        </Link>
                                        <span className="cell-subtitle">{promo.segment}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="type-badge">{promo.type}</span>
                                </td>
                                <td>
                                    <StatusBadge status={promo.status} />
                                </td>
 <td className="text-secondary text-sm">
 {formatPromotionDate(promo.startDate, 'Not scheduled')}
 </td>
 <td className="text-secondary text-sm">
 {formatPromotionDate(promo.endDate, 'Ongoing')}
 </td>
                                <td className="relative">
                                    <button className="btn-icon" onClick={(e) => toggleMenu(e, promo.id)}>
                                        <MoreVertical size={16} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {activeMenuId === promo.id && (
                                        <div className="action-menu ds-dropdown-menu">
                        <Link href={`/admin/promotions/${promo.id}`} className="menu-item ds-dropdown-item">
                          <Eye size={14} /> View Details
                        </Link>
                        <Link href={`/admin/promotions/preview`} className="menu-item ds-dropdown-item">
                          <PlayCircle size={14} /> Preview Customer View
                        </Link>
                        <Link href={`/admin/promotions/create?edit=${promo.id}`} className="menu-item ds-dropdown-item">
                                                <Edit size={14} /> Edit Config
                                            </Link>
                                            <button className="menu-item ds-dropdown-item"><Copy size={14} /> Duplicate</button>
                                            <div className="menu-divider" />
                                            <button
                                                className="menu-item ds-dropdown-item danger"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to deactivate this promotion?')) {
                                                        const saved = JSON.parse(localStorage.getItem('saved_promotions') || '[]');
                                                        const updated = saved.map((p: any) =>
                                                            p.id === promo.id ? { ...p, status: 'Arranged' } : p // 'Arranged' or 'Inactive'? Using 'Stopped' or 'Inactive'
                                                        );
                                                        // Actually, let's set status to 'Paused' or 'Inactive'
                                                        const finalUpdated = saved.map((p: any) =>
                                                            p.id === promo.id ? { ...p, status: 'Paused' } : p
                                                        );

                                                        localStorage.setItem('saved_promotions', JSON.stringify(finalUpdated));
                                                        setPromotions(finalUpdated);
                                                        setActiveMenuId(null);
                                                    }
                                                }}
                                            >
                                                <Trash2 size={14} /> Deactivate
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Footer */}
                <div className="grid-footer">
                    <div className="rows-selector">
                        <span>Rows per page:</span>
                        <select><option>10</option><option>25</option></select>
                    </div>
                    <div className="pagination">
                        <span className="page-info">1-{filteredPromotions.length} of {filteredPromotions.length}</span>
                        <div className="page-controls">
                            <button className="page-btn disabled"><ChevronLeft size={16} /></button>
                            <button className="page-btn"><ChevronRight size={16} /></button>
                        </div>
                    </div>
</div>
</div>

</div>
    );
}

function formatPromotionDate(date: string | null | undefined, fallback: string) {
 if (!date) return fallback;
 const parsedDate = new Date(date);
 return Number.isNaN(parsedDate.getTime())
 ? fallback
 : parsedDate.toLocaleDateString(undefined, {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 });
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
 return (
 <span className="filter-chip">
 {label}
<button onClick={onClear} title="Remove filter"><X size={12} /></button>
</span>
 );
}

function StatusBadge({ status }: { status: string }) {
 const normalizedStatus = status ? status.toLowerCase() : 'draft';
 const labels: Record<string, string> = {
 active: 'Active',
 paused: 'Paused',
 scheduled: 'Scheduled',
 draft: 'Draft',
 ended: 'Ended',
 };

 const variant = labels[normalizedStatus] ? normalizedStatus : 'default';

 return (
 <span className={`ds-status ds-status--${variant}`}>
 {labels[normalizedStatus] || status || 'Draft'}
 </span>
 );
}
