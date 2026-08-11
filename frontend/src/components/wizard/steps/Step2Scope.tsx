'use client';
import { Globe, Smartphone, Monitor, Users, CheckCircle2, Plus, RefreshCw, X, Upload, FileText, Phone, ChevronDown, Check, Sparkles, Search } from 'lucide-react';
import { useWizardContext } from '@/context/WizardContext';
import { useState, useEffect, useRef } from 'react';
import { getSegments, newSegmentDraft, Segment } from '@/data/segments';
import SegmentBuilder from '@/components/crm/SegmentBuilder';
import { features } from '@/config/features';

// Robust flag emoji generator
const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

export default function StepScope() {
    const { state, updateEligibility } = useWizardContext();
    const { markets, channels: platforms, segment } = state.eligibility;
 const platformIds = ['desktop', 'mobile', 'app', 'ussd'];

    const [availableMarkets, setAvailableMarkets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
  // Segments created in the CRM Segments builder (localStorage-backed) plus
  // the built-in presets. These must appear in the promotion audience picker
  // so a freshly-created segment is immediately selectable here.
  const [savedSegments, setSavedSegments] = useState<Segment[]>([]);
 // Custom dropdown open state + click-outside handling.
 const [segmentOpen, setSegmentOpen] = useState(false);
 const segmentRef = useRef<HTMLDivElement | null>(null);
 const [marketOpen, setMarketOpen] = useState(false);
 const marketRef = useRef<HTMLDivElement | null>(null);
 // Whether the menu should open upward instead of downward. We flip it up
  // when there isn't enough space below the trigger (e.g. the segment field
  // sits just above the wizard's fixed bottom navigation bar).
  const [segmentDropUp, setSegmentDropUp] = useState(false);
 // Inline segment builder (replaces the old "open in new tab" behaviour).
 const [builderDraft, setBuilderDraft] = useState<Segment | null>(null);
  // Search query for filtering the (potentially large) saved-segment list.
  const [segmentQuery, setSegmentQuery] = useState('');

    const loadMarkets = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:4000/countries');
            if (res.ok) {
                const data = await res.json();
                setAvailableMarkets(data.map((c: any) => ({
                    id: c.code,
                    name: c.name
                })));
            } else {
                throw new Error('Failed to fetch countries');
            }
        } catch (error) {
            console.error('Error fetching markets:', error);
            // Fallback only on error
            setAvailableMarkets([
                { id: 'KE', name: 'Kenya' },
                { id: 'GH', name: 'Ghana' },
                { id: 'NG', name: 'Nigeria' },
                { id: 'ET', name: 'Ethiopia' },
                { id: 'TZ', name: 'Tanzania' },
                { id: 'UG', name: 'Uganda' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMarkets();
        // Listen for settings changes
        window.addEventListener('storage', loadMarkets);
        return () => window.removeEventListener('storage', loadMarkets);
    }, []);

// When multi-country is disabled, keep the wizard pinned to the single
// instance market so validation and downstream payloads stay valid.
useEffect(() => {
if (!features.multiCountry && state.eligibility.markets.length === 0) {
updateEligibility({ markets: ['ZM'], primaryMarket: 'ZM' });
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // Load segments saved in the CRM Segments builder so they appear in the
  // audience picker. Re-load on focus and on storage events so a segment
  // created in the "Create new" tab shows up when the user returns here.
  useEffect(() => {
    const loadSegments = () => setSavedSegments(getSegments());
    loadSegments();
    window.addEventListener('focus', loadSegments);
    window.addEventListener('storage', loadSegments);
    return () => {
      window.removeEventListener('focus', loadSegments);
      window.removeEventListener('storage', loadSegments);
    };
  }, []);

    const refreshMarkets = () => {
        setIsLoading(true);
        setTimeout(() => {
            loadMarkets();
            setIsLoading(false);
        }, 500);
    };

 const chooseMarket = (id: string) => {
 updateEligibility({
 markets: [id],
 primaryMarket: id,
 });
 setMarketOpen(false);
 };

    const togglePlatform = (id: string) => {
 if (id === 'all') {
 const allSelected = platformIds.every((platform) => platforms.includes(platform));
 updateEligibility({ channels: allSelected ? [] : platformIds });
 return;
 }
        if (platforms.includes(id)) updateEligibility({ channels: platforms.filter(p => p !== id) });
        else updateEligibility({ channels: [...platforms, id] });
    };

 // Close the custom dropdown when clicking outside of it.
 useEffect(() => {
 const onDocClick = (e: MouseEvent) => {
 if (segmentRef.current && !segmentRef.current.contains(e.target as Node)) {
 setSegmentOpen(false);
 }
 if (marketRef.current && !marketRef.current.contains(e.target as Node)) {
 setMarketOpen(false);
 }
 };
 document.addEventListener('mousedown', onDocClick);
 return () => document.removeEventListener('mousedown', onDocClick);
 }, []);

 // Built-in audience options rendered in the custom dropdown.
 const builtInOptions = [
 { value: '', label: 'No segment', desc: 'Use qualification criteria instead', icon: '—' },
 { value: 'all', label: 'All Registered Players', desc: 'Every registered account', icon: '🌍' },
 { value: 'new', label: 'New Players', desc: 'Registered less than 30 days ago', icon: '✨' },
 { value: 'vip', label: 'VIP Segments Only', desc: 'High-value players', icon: '👑' },
 ];

 // Resolve the human-readable label for the currently selected segment so
 // the closed dropdown shows a friendly name rather than a raw id.
 const selectedLabel = (() => {
 if (segment === 'custom_csv') return 'Custom CSV List (uploaded)';
 const builtIn = builtInOptions.find((o) => o.value === segment);
 if (builtIn && segment !== '') return builtIn.label;
 const saved = savedSegments.find((s) => s.id === segment);
 if (saved) return saved.name;
 if (segment) return segment;
 return 'Select Segment (Optional)';
 })();

 const estimatedReach = (() => {
 const reachBySegment: Record<string, string> = {
 all: '214,900',
 new: '48,200',
 vip: '10,745',
 custom_csv: '12,405',
 };
 return reachBySegment[segment] || '2.4M';
 })();

 const chooseSegment = (val: string) => {
 updateEligibility({ segment: val });
 setSegmentOpen(false);
    setSegmentQuery('');
 };

  // Decide whether the menu opens up or down based on the trigger's position
  // within the viewport, then open it. Called right before opening so it
  // reflects the current scroll/layout state (the segment field sits just
  // above the wizard's fixed bottom navigation bar).
  const openSegmentMenu = () => {
    if (segmentOpen) {
      setSegmentOpen(false);
      return;
    }
    const el = segmentRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 360; // approximate max-height of the menu
      // Flip up only when there isn't room below AND there is more room above.
      setSegmentDropUp(spaceBelow < menuHeight && spaceAbove > spaceBelow);
    }
    setSegmentOpen(true);
  };

  // Filter saved segments by the search query (name or description).
  const filteredSegments = savedSegments.filter((s) => {
    const q = segmentQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.description ? s.description.toLowerCase().includes(q) : false)
    );
  });
  // Only show the search box once the list is large enough to warrant it.
  const showSegmentSearch = savedSegments.length > 8;

 // Open the segment builder inline (drawer) instead of a new browser tab.
 const openInlineBuilder = () => {
 setSegmentOpen(false);
 setBuilderDraft(newSegmentDraft());
 };

 // When the builder saves, refresh the segment list and auto-select the
 // newly created segment (the most recently updated custom segment).
 const onSegmentSaved = () => {
 const fresh = getSegments();
 setSavedSegments(fresh);
 const custom = fresh.filter((s) => !s.preset);
 const newest = custom.sort(
 (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
 )[0];
 if (newest) updateEligibility({ segment: newest.id });
 setBuilderDraft(null);
 };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simulate upload
        setUploadProgress(10);
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        updateEligibility({ segment: 'custom_csv' });
                        setIsUploadModalOpen(false);
                        setUploadProgress(0);
                    }, 500);
                    return 100;
                }
                return prev + 20;
            });
        }, 300);
    };

    return (
        <div className="step-container wizard-scope">
            <div className="form-panel ds-panel">
                <h2 className="panel-title">Scope & Eligibility</h2>

                {/* Markets Section */}
{features.multiCountry && (

                <div className="form-section">
                    <div className="section-header">
                        <label className="section-label wizard-section-label"><Globe size={16} /> Target Market</label>
                        <button className="refresh-btn" onClick={refreshMarkets} title="Reload countries from settings">
                            <RefreshCw size={14} /> Refresh List
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="loading-state ds-card">Loading markets...</div>
                    ) : (
                        <div className="market-selector">
 {availableMarkets.length === 0 ? (
 <div className="empty-state ds-card">
 No countries configured. Please go to Settings &gt; Countries & Limits.
 </div>
 ) : (
 <div className="market-dropdown" ref={marketRef}>
 <button
 type="button"
 className={`market-trigger ds-control ${marketOpen ? 'open' : ''}`}
 onClick={() => setMarketOpen((open) => !open)}
 aria-expanded={marketOpen}
 aria-haspopup="listbox"
 >
 <span className={markets[0] ? 'market-value' : 'market-placeholder'}>
 {(() => {
 const selectedMarket = availableMarkets.find((market) => market.id === (markets[0] || '').toUpperCase());
 return selectedMarket ? `${getFlagEmoji(selectedMarket.id)} ${selectedMarket.name}` : 'Select a Target Market';
 })()}
 </span>
 <ChevronDown size={18} className="market-chevron" />
 </button>
 {marketOpen && (
 <div className="market-menu" role="listbox" aria-label="Target Market">
 {availableMarkets.map((market) => {
 const selected = market.id === (markets[0] || '').toUpperCase();
 return (
 <button
 key={market.id}
 type="button"
 className={`market-item ${selected ? 'selected' : ''}`}
 role="option"
 aria-selected={selected}
 onClick={() => chooseMarket(market.id)}
 >
 <span>{getFlagEmoji(market.id)} {market.name}</span>
 {selected && <Check size={16} className="market-check" />}
 </button>
 );
 })}
 </div>
 )}
 </div>
 )}
                        </div>
                    )}
                </div>
)}


{/* Channels Section */}
<div className="form-section">
<div className="section-header">
<label className="section-label wizard-section-label"><Smartphone size={16} /> Channels</label>
</div>
<div className="platform-options" role="group" aria-label="Promotion channels">
 <button
 type="button"
 className={`option-card ds-choice ${platformIds.every((platform) => platforms.includes(platform)) ? 'active is-selected' : ''}`}
 onClick={() => togglePlatform('all')}
 aria-pressed={platformIds.every((platform) => platforms.includes(platform))}
 >
 <Globe size={24} className="icon" />
 <span className="name">All</span>
 </button>
 <button
 type="button"
                            className={`option-card ds-choice ${platforms.includes('desktop') ? 'active is-selected' : ''}`}
                            onClick={() => togglePlatform('desktop')}
 aria-pressed={platforms.includes('desktop')}
                        >
                            <Monitor size={24} className="icon" />
                            <span className="name">Desktop</span>
 </button>
 <button
 type="button"
                            className={`option-card ds-choice ${platforms.includes('mobile') ? 'active is-selected' : ''}`}
                            onClick={() => togglePlatform('mobile')}
 aria-pressed={platforms.includes('mobile')}
                        >
                            <Smartphone size={24} className="icon" />
                            <span className="name">Mobile Web</span>
 </button>
 <button
 type="button"
                            className={`option-card ds-choice ${platforms.includes('app') ? 'active is-selected' : ''}`}
                            onClick={() => togglePlatform('app')}
 aria-pressed={platforms.includes('app')}
                        >
                            <div className="icon-group">
                                <Smartphone size={24} className="icon" />
                            </div>
                            <span className="name">Mobile App</span>
 </button>
 <button
 type="button"
                            className={`option-card ds-choice ${platforms.includes('ussd') ? 'active is-selected' : ''}`}
                            onClick={() => togglePlatform('ussd')}
 aria-pressed={platforms.includes('ussd')}
                        >
                            <Phone size={24} className="icon" />
                            <span className="name">USSD</span>
 </button>
                    </div>
                </div>

                {/* Segments */}
{features.segmentTargeting && (

                <div className="form-section">
                    <div className="section-header">
                        <label className="section-label wizard-section-label">
                            <Users size={16} /> Segments <span className="segment-guidance">(leave empty if you will be setting a qualification criteria)</span>
                        </label>
                    </div>
                    <div className="segment-selector">
 <div className="seg-dropdown" ref={segmentRef}>
 <button
 type="button"
className="seg-trigger ds-control ds-dropdown-trigger"
onClick={openSegmentMenu}
aria-expanded={segmentOpen}
aria-haspopup="listbox"
>
<span className={segment ? 'ds-dropdown-trigger__value' : 'ds-dropdown-trigger__placeholder'}>{selectedLabel}</span>
<ChevronDown size={18} className="ds-dropdown-trigger__chevron" />
 </button>

 {segmentOpen && (
              <div className={`seg-menu ds-dropdown-menu ${segmentDropUp ? 'drop-up' : ''}`} role="listbox" aria-label="Promotion audience segment">
                    {/* Menu header with an explicit close control so the dropdown
                        can always be dismissed without relying on click-outside. */}
                    <div className="seg-menu-header">
                      <span className="seg-menu-title">Choose audience</span>
                      <button
                        type="button"
                        className="seg-menu-close"
                        onClick={() => { setSegmentOpen(false); setSegmentQuery(''); }}
                        aria-label="Close"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* 1. Create new segment — primary action, listed first. */}
                    <div className="seg-group-label">Create</div>
                    <button type="button" className="seg-item ds-dropdown-item action create" onClick={openInlineBuilder}>
                      <span className="seg-item-icon"><Sparkles size={15} /></span>
                      <span className="seg-item-text">
                        <span className="seg-item-title">Create New Segment</span>
                        <span className="seg-item-desc">Build a segment without leaving the wizard</span>
                      </span>
                      <Plus size={16} className="seg-item-check" />
                    </button>

                    {/* 2. Your saved segments. */}
                    {savedSegments.length > 0 && (
                      <>
                        <div className="seg-group-label">
                          Your saved segments
                          <span className="seg-count">{savedSegments.length}</span>
                        </div>
                        {showSegmentSearch && (
                          <div className="seg-search" onMouseDown={(e) => e.stopPropagation()}>
                            <Search size={14} className="seg-search-icon" />
                            <input
                              type="text"
                              className="seg-search-input"
                              placeholder="Search segments…"
                              value={segmentQuery}
                              autoFocus
                              onChange={(e) => setSegmentQuery(e.target.value)}
                            />
                            {segmentQuery && (
                              <button
                                type="button"
                                className="seg-search-clear"
                                onClick={() => setSegmentQuery('')}
                                aria-label="Clear search"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        )}
                        {filteredSegments.length === 0 ? (
                          <div className="seg-empty">No segments match “{segmentQuery}”.</div>
                        ) : (
                          filteredSegments.map((seg) => (
 <button
 key={seg.id}
 type="button"
className={`seg-item ds-dropdown-item ${segment === seg.id ? 'selected is-selected' : ''}`}
role="option"
aria-selected={segment === seg.id}
onClick={() => chooseSegment(seg.id)}
 >
 <span className="seg-item-icon"><Users size={15} /></span>
 <span className="seg-item-text">
 <span className="seg-item-title">
 {seg.name}
 {seg.preset && <span className="seg-badge">preset</span>}
 </span>
 {seg.description && <span className="seg-item-desc">{seg.description}</span>}
 </span>
 {segment === seg.id && <Check size={16} className="seg-item-check" />}
 </button>
                          ))
                        )}
 </>
 )}

 <div className="seg-divider" />
                    {/* 3. And the rest — built-in audiences + CSV upload. */}
                    <div className="seg-group-label">Built-in audiences</div>
                    {builtInOptions.map((opt) => (
                      <button
                        key={opt.value || 'none'}
                        type="button"
className={`seg-item ds-dropdown-item ${segment === opt.value ? 'selected is-selected' : ''}`}
role="option"
aria-selected={segment === opt.value}
onClick={() => chooseSegment(opt.value)}
                      >
                        <span className="seg-item-icon">{opt.icon}</span>
                        <span className="seg-item-text">
                          <span className="seg-item-title">{opt.label}</span>
                          <span className="seg-item-desc">{opt.desc}</span>
                        </span>
                        {segment === opt.value && <Check size={16} className="seg-item-check" />}
                      </button>
                    ))}

 <button
 type="button"
className="seg-item ds-dropdown-item action"
onClick={() => { setSegmentOpen(false); setIsUploadModalOpen(true); }}
 >
 <span className="seg-item-icon"><Upload size={15} /></span>
 <span className="seg-item-text">
 <span className="seg-item-title">Custom List (Upload CSV)</span>
 <span className="seg-item-desc">Upload a player list from a file</span>
 </span>
 </button>
 </div>
 )}
 </div>
 <div className="reach-card ds-card" role="status" aria-live="polite">
 <span className="reach-dot" aria-hidden="true" />
 <div className="reach-copy">
 <p className="reach-title">Estimated reach: {estimatedReach} customers</p>
 <p className="reach-description">
 Based on current segment size. Actual reach depends on activity during the promotion window.
 </p>
 </div>
 </div>
                    </div>
                </div>
)}


                {
                    features.segmentTargeting && state.eligibility.segment === 'custom_csv' && (
                        <div className="csv-success-badge">
                            <FileText size={14} /> <span>Custom list uploaded successfully (12,405 users)</span>
                            <button className="remove-btn" onClick={() => updateEligibility({ segment: 'all' })}><X size={12} /></button>
                        </div>
                    )
                }

            </div >

            {/* Upload Modal */}
            {
                isUploadModalOpen && (
                    <div className="modal-overlay">
                        <div className="upload-modal">
                            <div className="modal-header">
                                <h3>Upload Player List</h3>
                                <button onClick={() => setIsUploadModalOpen(false)}><X size={18} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="upload-area ds-add-action">
                                    <Upload size={32} className="upload-icon" />
                                    <p>Drag and drop your CSV file here</p>
                                    <span className="sub-text">or click to browse</span>
                                    <input type="file" accept=".csv" onChange={handleFileUpload} />
                                </div>

                                {uploadProgress > 0 && (
                                    <div className="progress-container">
                                        <div className="p-bar-bg"><div className="p-bar-fill" style={{ width: `${uploadProgress}%` }} /></div>
                                        <span className="p-text">Uploading... {uploadProgress}%</span>
                                    </div>
                                )}

                                <div className="info-notes">
                                    <p>• Accepted format: CSV, XLS</p>
                                    <p>• Required columns: player_id, mobile_number</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

 {/* Inline segment builder drawer — keeps the wizard state intact. */}
 {builderDraft && (
 <SegmentBuilder
 initial={builderDraft}
 onClose={() => setBuilderDraft(null)}
 onSaved={onSegmentSaved}
 />
 )}
        </div >
    );
}
