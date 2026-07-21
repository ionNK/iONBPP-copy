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
        <div className="page-container">
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
 <th style={{ width: '50px' }}></th>
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

            <style jsx>{`
        .page-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 24px;
        }
        .page-title {
            font-size: 28px;
            font-weight: 700;
            color: var(--color-text-primary);
            margin: 0 0 4px 0;
        }
        .page-subtitle {
            font-size: 14px;
            color: var(--color-text-secondary);
            margin: 0;
        }
        .header-actions {
            display: flex;
            gap: 12px;
        }
        .icon-only { padding: 12px; }

        /* Toolbar */
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px;
          margin-bottom: 24px;
        }
 .search-group {
 position: relative;
 width: 320px;
 display: flex;
 align-items: center;
 gap: 12px;
 min-height: var(--ds-control-height);
 box-sizing: border-box;
 border: 1px solid var(--ds-border-subtle);
 border-radius: var(--ds-radius-control);
 background: var(--ds-surface-raised);
 padding: 0 14px;
 transition: border-color var(--ds-transition), background-color var(--ds-transition), box-shadow var(--ds-transition);
 }
 .search-group:hover {
 border-color: var(--ds-border);
 background: var(--ds-surface-hover);
 }
 .search-group:focus-within {
 border-color: var(--ds-accent);
 background: var(--ds-surface-hover);
 box-shadow: 0 0 0 1px var(--ds-accent);
 }
        .search-icon {
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--color-text-primary);
          padding: 0;
          outline: none;
          min-width: 0;
          font-size: 14px;
        }
        .search-input::placeholder { color: var(--color-text-muted); }
 .clear-search {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 background: transparent;
 border: none;
 color: var(--color-text-muted);
 cursor: pointer;
 padding: 2px;
 border-radius: 50%;
 flex-shrink: 0;
 }
 .clear-search:hover { background: var(--color-bg-elevated); color: var(--color-text-primary); }

 /* Filter toggle button */
 .filter-toggle {
 display: inline-flex;
 align-items: center;
 gap: 8px;
 position: relative;
 }
 .filter-toggle.active {
 border-color: var(--ds-accent);
 color: var(--ds-accent);
 background: rgba(242, 214, 65, 0.08);
 }
 .filter-toggle .chev { transition: transform 0.2s; }
 .filter-toggle .chev.open { transform: rotate(180deg); }
 .filter-badge {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 min-width: 18px;
 height: 18px;
 padding: 0 5px;
 border-radius: 9px;
 font-size: 11px;
 font-weight: 700;
 background: var(--color-betika-yellow);
 color: #000;
 }
 .clear-all { display: inline-flex; align-items: center; gap: 6px; }

 /* Advanced Filter Panel */
 .filter-panel {
 padding: 20px;
 margin-bottom: 16px;
 animation: fadeIn 0.15s ease;
 }
 .filter-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 16px;
 }
 .filter-field { display: flex; flex-direction: column; gap: 6px; }
 .filter-field label {
 font-size: 11px;
 font-weight: 600;
 text-transform: uppercase;
 letter-spacing: 0.03em;
 color: var(--color-text-muted);
 }
 .filter-field select,
 .filter-field input {
 width: 100%;
 font-size: 13px;
 }

 /* Chips row */
 .chips-row {
 display: flex;
 flex-wrap: wrap;
 gap: 8px;
 margin-bottom: 16px;
 }

 @media (max-width: 1024px) {
 .filter-grid { grid-template-columns: repeat(2, 1fr); }
 }
 @media (max-width: 600px) {
 .filter-grid { grid-template-columns: 1fr; }
 }

 /* Top Filter Bar (above search) */

 .filter-top {
 margin-bottom: 16px;
 }
 .filter-group {
 display: flex;
 align-items: center;
 gap: 12px;
 flex-wrap: wrap;
 }
 /* Clear all pushed to the far right */
 .filter-group .clear-all { margin-left: auto; }


 .tabs {
 display: flex;
 padding: 4px;
 border: 1px solid var(--ds-border-subtle);
 border-radius: var(--ds-radius-control);
 background: var(--ds-surface-raised);
 }
        .tab {
            background: transparent;
            border: none;
            color: var(--color-text-secondary);
            padding: 6px 16px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }
 .tab.active {
 background: var(--ds-surface-selected);
 color: var(--color-text-primary);
 box-shadow: none;
 }
        .divider { width: 1px; height: 24px; background: var(--color-border); }
        .btn-sm { padding: 8px 16px; font-size: 13px; min-height: 36px; }

        /* Data Grid */
 .grid-container {
 overflow: visible;
 display: flex;
 flex-direction: column;
 min-height: 400px;
 }
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
 .data-table th {
 text-align: left;
 padding: 16px 24px;
 font-size: 12px;
 font-weight: 600;
 text-transform: uppercase;
 letter-spacing: 0.02em;
 color: var(--color-text-muted);
 border-bottom: 1px solid var(--ds-border-subtle);
 background: rgba(255, 255, 255, 0.025);
 }
 .data-table td {
 padding: 16px 24px;
 border-bottom: 1px solid var(--ds-border-subtle);
 font-size: 14px;
 color: var(--color-text-secondary);
 vertical-align: middle;
 }
 .data-table tr:hover td {
 background: var(--ds-surface-hover);
 color: var(--color-text-primary);
 }
        .data-table tr:last-child td { border-bottom: none; }

        /* Grid Cells */
        .text-mono { font-family: 'Fira Code', monospace; font-size: 12px; }
        .text-muted { color: var(--color-text-muted); }
        .text-sm { font-size: 13px; }
        
        .cell-primary { display: flex; flex-direction: column; }
        .cell-title { color: var(--color-text-primary); font-weight: 600; margin-bottom: 2px; }
        .cell-subtitle { font-size: 11px; color: var(--color-text-muted); }

 .type-badge {
 display: inline-flex;
 align-items: center;
 padding: 4px 8px;
 border: 1px solid var(--ds-border-subtle);
 border-radius: 6px;
 background: var(--ds-surface-raised);
 font-size: 11px;
 color: var(--color-text-secondary);
 font-weight: 500;
 }

        .mini-stats { display: flex; gap: 12px; font-size: 12px; color: var(--color-text-muted); }
        .mini-stats span { display: flex; align-items: center; gap: 4px; }
        
        .flex-center { display: flex; align-items: center; }
        .gap-2 { gap: 8px; }
        
        .relative { position: relative; }

        .btn-icon {
            background: transparent;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            padding: 6px;
            border-radius: 4px;
        }
        .btn-icon:hover { background: var(--ds-surface-hover); color: var(--color-text-primary); }

        .tab-count {
          display: inline-block;
          margin-left: 6px;
          padding: 1px 7px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          background: var(--color-bg-elevated);
          color: var(--color-text-muted);
        }
        .tab.active .tab-count {
          background: var(--color-betika-yellow);
          color: #000;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 48px 24px;
          text-align: center;
          color: var(--color-text-muted);
        }
        .empty-title {
          margin: 8px 0 0 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .empty-sub {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        /* Action Menu */
 .action-menu {
 position: absolute;
 right: 0;
 top: calc(100% + 4px);
 width: 200px;
 z-index: 50;
 animation: fadeIn 0.1s;
 }
        
        /* Target generic menu items (buttons) */
        .menu-item {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--color-text-secondary);
            text-decoration: none;
            background: transparent;
            border: none;
            cursor: pointer;
            border-radius: 4px;
            text-align: left;
            white-space: nowrap;
        }
        /* Explicitly target Link components (anchor tags) to override inline display using global to bypass scope issues */
        :global(.action-menu a) {
          display: flex !important;
          width: 100%;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--color-text-secondary);
            text-decoration: none;
            background: transparent;
            border: none;
            cursor: pointer;
            border-radius: 4px;
            text-align: left;
            white-space: nowrap;
            box-sizing: border-box;
        }
        :global(.action-menu a:hover) {
          background: var(--color-bg-input);
          color: var(--color-text-primary);
        }

 .menu-item:hover { background: var(--ds-surface-hover); color: var(--color-text-primary); }
 .menu-item.danger { color: var(--ds-danger); }
 .menu-item.danger:hover { background: rgba(239, 68, 68, 0.12); }
 .menu-divider { height: 1px; background: var(--ds-border-subtle); margin: 4px 0; }

        /* Footer */
 .grid-footer {
 display: flex;
 justify-content: space-between;
 align-items: center;
 padding: 16px 24px;
 border-top: 1px solid var(--ds-border-subtle);
 background: rgba(255, 255, 255, 0.025);
 margin-top: auto;
 }
        .rows-selector { font-size: 13px; color: var(--color-text-muted); display: flex; gap: 8px; align-items: center; }
        .rows-selector select { 
            background: var(--color-bg-panel); 
            color: var(--color-text-primary); 
            border: 1px solid var(--color-border); 
            border-radius: 4px; 
            padding: 2px 6px; 
        }
        
        .pagination { display: flex; align-items: center; gap: 16px; }
        .page-info { font-size: 13px; color: var(--color-text-muted); }
        .page-controls { display: flex; gap: 4px; }
        .page-btn {
            background: var(--color-bg-panel);
            border: 1px solid var(--color-border);
            color: var(--color-text-primary);
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .page-btn.disabled { opacity: 0.5; cursor: not-allowed; }
        .page-btn:not(.disabled):hover { background: var(--color-bg-input); }

 /* The shared primary button provides the filled Betika-yellow action treatment. */

        @media (max-width: 768px) {
            .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
            .header-actions { width: 100%; justify-content: flex-start; }
            .toolbar { flex-direction: column; gap: 16px; }
            .search-group { width: 100%; }
            .filter-group { flex-wrap: wrap; }
            .tabs { width: 100%; overflow-x: auto; }
            .grid-container { overflow-x: visible; } /* Ensure grid-container doesn't force scroll on desktop */
        }
        /* Only scroll on small screens to prevent clipping dropdowns on desktop */
        .table-responsive { width: 100%; }
        
        @media (max-width: 1024px) {
            .table-responsive { overflow-x: auto; padding-bottom: 20px; } /* padding for potential scrollbar */
        }
        @media (max-width: 768px) {
            .data-table { min-width: 800px; } /* Force scroll */
        }
      `}</style>
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
 <style jsx>{`
 .filter-chip {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 4px 6px 4px 10px;
 border-radius: 16px;
 font-size: 12px;
 font-weight: 500;
 background: var(--color-bg-input);
 border: 1px solid var(--color-border);
 color: var(--color-text-primary);
 }
 .filter-chip button {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 background: transparent;
 border: none;
 color: var(--color-text-muted);
 cursor: pointer;
 border-radius: 50%;
 padding: 2px;
 }
 .filter-chip button:hover {
 background: var(--color-bg-elevated);
 color: var(--color-text-primary);
 }
 `}</style>
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
