'use client';
import { Globe, Smartphone, Monitor, Users, CheckCircle2, Plus, RefreshCw, X, Upload, FileText, Phone, ChevronDown, Check, Sparkles, Search } from 'lucide-react';
import { useWizardContext } from '@/context/WizardContext';
import { useState, useEffect, useRef } from 'react';
import { getSegments, newSegmentDraft, Segment } from '@/data/segments';
import SegmentBuilder from '@/components/crm/SegmentBuilder';

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
        <div className="step-container">
            <div className="form-panel ds-panel">
                <h2 className="panel-title">Scope & Eligibility</h2>

                {/* Markets Section */}
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

                {/* Platform Section */}
                <div className="form-section">
                    <div className="section-header">
                        <label className="section-label wizard-section-label"><Smartphone size={16} /> Platforms</label>
                    </div>
 <div className="platform-options" role="group" aria-label="Promotion platforms">
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
                <div className="form-section">
                    <div className="section-header">
                        <label className="section-label wizard-section-label">
                            <Users size={16} /> Segments <span className="normal-case font-normal ml-2" style={{ color: 'var(--color-betika-yellow)', fontSize: '11px', fontStyle: 'italic', letterSpacing: 'normal', opacity: 0.8, textTransform: 'none' }}>(leave empty if you will be setting a qualification criteria)</span>
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

                {
                    state.eligibility.segment === 'custom_csv' && (
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

            <style jsx>{`
                .step-container { max-width: 900px; margin: 0 auto; animation: slideIn 0.3s ease-out; }
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.form-panel { padding: 32px; }
 .panel-title { margin: 0 0 4px; color: var(--color-text-primary); font-size: 20px; font-weight: 600; line-height: 1.3; }
 .panel-title::after { content: 'Define where the promotion runs and which customers it reaches.'; display: block; margin-top: 4px; color: var(--color-text-muted); font-size: 14px; font-weight: 400; }

 .form-section { margin-top: 24px; margin-bottom: 0; }
 .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
 .section-label { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--color-text-primary); font-size: 14px; font-weight: 500; letter-spacing: normal; text-transform: none; }
 .section-label > svg { color: var(--color-betika-yellow); }
 .refresh-btn { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--color-text-secondary); cursor: pointer; font-size: 11px; transition: background-color 0.2s ease, border-color 0.2s ease; }
 .refresh-btn:hover { border-color: rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.08); color: var(--color-text-primary); }

                .grid-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .grid-options.three-col { grid-template-columns: repeat(3, 1fr); }
 .grid-options.four-col { grid-template-columns: repeat(4, 1fr); }

 /* Keep the complete platform set on one clear, scannable row. On narrow
 screens it scrolls horizontally rather than wrapping a platform out of view. */
 .platform-options {
 display: grid;
 grid-template-columns: repeat(5, minmax(112px, 1fr));
 gap: 10px;
 overflow-x: auto;
 padding-bottom: 4px;
 scrollbar-width: thin;
 }
 .platform-options .option-card {
 min-height: 88px;
 padding: 12px 8px;
 flex-direction: column;
 justify-content: center;
 gap: 8px;
 font: inherit;
 text-align: center;
 }
 .platform-options .option-card:focus-visible { outline: 2px solid var(--color-betika-yellow); outline-offset: 2px; }
 .platform-options .name { white-space: nowrap; }

 .option-card {
 position: relative;
 display: flex;
 align-items: center;
 gap: 12px;
 padding: 16px;
 border: 1px solid rgba(255, 255, 255, 0.1);
 border-radius: 8px;
 background: rgba(255, 255, 255, 0.05);
 cursor: pointer;
 transition: background-color 0.2s ease, border-color 0.2s ease;
 }
 .option-card:hover { background: rgba(255, 255, 255, 0.08); }
 .option-card.active {
 padding: 15px;
 border: 2px solid var(--color-betika-yellow);
 background: rgba(255, 255, 255, 0.1);
 }
 .option-card.active::before {
 content: '';
 position: absolute;
 top: 12px;
 left: 12px;
 width: 12px;
 height: 12px;
 border: 2px solid #008e00;
 border-radius: 50%;
 }
 .option-card.active::after {
 content: '';
 position: absolute;
 top: 16px;
 left: 16px;
 width: 8px;
 height: 8px;
 border-radius: 50%;
 background: #008e00;
 }
 .option-card.active .name, .option-card.active .icon, .option-card.active .icon-text { color: var(--color-text-primary); }

                /* Market Card Specifics */
                .market-card {
                    flex-direction: column;
                    justify-content: center;
                    text-align: center;
                    padding: 24px 16px;
                    gap: 8px;
                }
 .flag-large { font-size: 42px; line-height: 1; }
 .name { font-size: 14px; font-weight: 500; color: var(--color-text-muted); transition: color 0.2s; }
 .icon { color: var(--color-text-muted); transition: color 0.2s; }
 .icon-group { display: flex; align-items: center; gap: 4px; color: var(--color-text-muted); font-weight: 600; font-size: 16px; }
 .check-icon { position: absolute; top: 10px; left: 10px; color: #008e00; }

 .market-dropdown { position: relative; }
 .market-trigger {
 width: 100%;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 12px;
 padding: 12px 14px;
 border: 1px solid rgba(255, 255, 255, 0.1);
 border-radius: 8px;
 background: rgba(255, 255, 255, 0.05);
 color: var(--color-text-primary);
 cursor: pointer;
 font: inherit;
 font-size: 14px;
 text-align: left;
 transition: background-color 0.2s ease, border-color 0.2s ease;
 }
 .market-trigger:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.15); }
 .market-trigger.open { border-color: rgba(255, 255, 255, 0.7); background: rgba(255, 255, 255, 0.05); }
 .market-value { color: var(--color-text-primary); font-weight: 500; }
 .market-placeholder { color: var(--color-text-muted); }
 .market-chevron { flex-shrink: 0; color: var(--color-text-muted); transition: transform 0.2s ease; }
 .market-trigger.open .market-chevron { transform: rotate(180deg); }
 .market-menu {
 position: absolute;
 top: calc(100% + 6px);
 right: 0;
 left: 0;
 z-index: 40;
 max-height: 340px;
 overflow-y: auto;
 padding: 6px;
 border: 1px solid rgba(255, 255, 255, 0.15);
 border-radius: 8px;
 background: #001D3D;
 box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
 }
 .market-item {
 width: 100%;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 12px;
 padding: 10px;
 border: 0;
 border-radius: 8px;
 background: transparent;
 color: #FFFFFF;
 cursor: pointer;
 font: inherit;
 font-size: 13px;
 text-align: left;
 transition: background-color 0.15s ease;
 }
 .market-item:hover, .market-item.selected { background: rgba(255, 255, 255, 0.1); }
 .market-check { flex-shrink: 0; color: #47AA39; }

 .reach-card {
 display: flex;
 align-items: center;
 gap: 12px;
 margin-top: 12px;
 padding: 14px 16px;
 border: 1px solid rgba(255, 255, 255, 0.15);
 border-radius: 8px;
 background: #001d3d;
 }
 .reach-dot {
 width: 8px;
 height: 8px;
 flex: 0 0 8px;
 border-radius: 50%;
 background: #47aa39;
 }
 .reach-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
 .reach-title { margin: 0; color: var(--color-text-primary); font-size: 14px; font-weight: 500; line-height: 1.4; }
 .reach-description { margin: 0; color: var(--color-text-muted); font-size: 12px; font-weight: 400; line-height: 1.4; }

 /* Custom segment dropdown */
 .seg-dropdown { position: relative; margin-bottom: 12px; }
.seg-trigger { font-size: 14px; }
.seg-menu {
position: absolute;
top: calc(100% + 6px);
left: 0;
right: 0;
z-index: 40;
max-height: 340px;
overflow-y: auto;
animation: segIn 0.15s ease-out;
}
 @keyframes segIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
	 /* When there isn't room below the trigger, anchor the menu above it. */
	 .seg-menu.drop-up {
	 top: auto;
	 bottom: calc(100% + 6px);
	 animation: segInUp 0.15s ease-out;
	 }
	 @keyframes segInUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        .seg-menu-header {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 6px 8px;
          margin-bottom: 4px;
 border-bottom: 1px solid rgba(255, 255, 255, 0.1);
 background: #001D3D;
 }
 .seg-menu-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .seg-menu-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          border-radius: 6px;
 background: rgba(255, 255, 255, 0.05);
 color: var(--color-text-muted);
 cursor: pointer;
 transition: all 0.15s;
 }
 .seg-menu-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--color-text-primary); }

 .seg-group-label {
 font-size: 10px;
 text-transform: uppercase;
 letter-spacing: 0.6px;
 color: var(--color-text-muted);
 padding: 8px 10px 4px;
 font-weight: 700;
 }
        .seg-count {
          margin-left: 6px;
 background: rgba(255, 255, 255, 0.05);
 color: var(--color-text-muted);
 padding: 1px 6px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 700;
        }

        .seg-search {
          position: sticky;
          top: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 2px 4px 6px;
          padding: 8px 10px;
 background: rgba(255, 255, 255, 0.05);
 border: 1px solid rgba(255, 255, 255, 0.1);
 border-radius: 8px;
        }
        .seg-search-icon { color: var(--color-text-muted); flex-shrink: 0; }
        .seg-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text-primary);
          font-size: 13px;
        }
        .seg-search-input::placeholder { color: var(--color-text-muted); }
        .seg-search-clear {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          padding: 0;
        }
        .seg-search-clear:hover { color: var(--color-text-primary); }
        .seg-empty {
          padding: 12px 10px;
          text-align: center;
          font-size: 12px;
          color: var(--color-text-muted);
        }

.seg-item {
width: 100%;
display: flex;
align-items: center;
gap: 12px;
text-align: left;
padding: 10px;
}
 .seg-item.create:hover { background: rgba(255, 255, 255, 0.08); }

 .seg-item-icon {
 width: 30px;
 height: 30px;
 flex-shrink: 0;
 display: flex;
 align-items: center;
 justify-content: center;
 background: rgba(255, 255, 255, 0.05);
 border-radius: 8px;
 font-size: 15px;
 color: var(--color-betika-yellow);
 }
 .seg-item-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
 .seg-item-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary); display: flex; align-items: center; gap: 6px; }
 .seg-item-desc { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
 .seg-item-check { color: #008e00; flex-shrink: 0; }
 .seg-badge {
 font-size: 9px;
 text-transform: uppercase;
 letter-spacing: 0.4px;
 background: var(--color-bg-input);
 color: var(--color-text-muted);
 padding: 2px 6px;
 border-radius: 4px;
 font-weight: 700;
 }
 .seg-divider { height: 1px; background: rgba(255, 255, 255, 0.1); margin: 6px 4px; }
                
 .loading-state, .empty-state {
 padding: 24px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; background: rgba(255, 255, 255, 0.05); color: var(--color-text-secondary); text-align: center; font-size: 14px;
 }

                /* CSV Badge */
                .csv-success-badge {
                    margin-top: 12px;
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    color: #22c55e;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .remove-btn { margin-left: auto; background: transparent; border: none; color: #22c55e; cursor: pointer; opacity: 0.7; }
                .remove-btn:hover { opacity: 1; }

                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; }
 .upload-modal { width: 400px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 14px; background: #111d3a; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
 .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); }
                .modal-header h3 { margin: 0; font-size: 16px; color: var(--color-text-primary); }
                .modal-header button { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; }
                
                .modal-body { padding: 24px; }
                .upload-area { 
 border: 2px dashed rgba(255, 255, 255, 0.15);
 border-radius: 8px;
 padding: 32px;
 text-align: center;
 color: var(--color-text-muted);
 position: relative;
 cursor: pointer;
 background: rgba(255, 255, 255, 0.05);
 transition: all 0.2s;
 }
 .upload-area:hover { border-color: var(--color-betika-yellow); color: var(--color-betika-yellow); background: rgba(255, 255, 255, 0.08); }
                .upload-icon { margin-bottom: 12px; opacity: 0.5; }
                .sub-text { font-size: 12px; opacity: 0.7; display: block; margin-top: 4px; }
                .upload-area input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

                .progress-container { margin-top: 20px; }
 .p-bar-bg { height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; }
 .p-bar-fill { height: 100%; background: var(--color-betika-yellow); transition: width 0.3s ease; }
                .p-text { display: block; font-size: 11px; color: var(--color-text-muted); margin-top: 6px; text-align: right; }

                .info-notes { margin-top: 24px; font-size: 12px; color: var(--color-text-secondary); line-height: 1.6; }
            `}</style>
        </div >
    );
}
