'use client';
import { Layers, Zap, Users, Code, Trash2, Plus, X, ChevronDown, CheckCircle2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWizardContext, Trigger, Rule } from '@/context/WizardContext';
import { getSegments, Segment } from '@/data/segments';

// Robust flag emoji generator
const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return '🌐';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

// Extensive Event Catalog for the Event-Driven Engine

interface EventParam {
    name: string;
    type: string;
    options?: string[];
}

interface EventDef {
    id: string;
    label: string;
    params: EventParam[];
}

interface CatalogCategory {
    label: string;
    events: EventDef[];
}

// Extensive Event Catalog for the Event-Driven Engine
const EVENT_CATALOG: Record<string, CatalogCategory> = {

    sports: {
        label: 'Sportsbook',
        events: [
            {
                id: 'bet_placement', label: 'Bet Placed (Prematch)',
                params: [
                    { name: 'Stake', type: 'float' },
                    { name: 'Odds', type: 'float' },
                    { name: 'Sport', type: 'enum', options: ['Football', 'Basketball', 'Tennis', 'Ice Hockey', 'Rugby', 'Cricket', 'Any'] },
                    { name: 'League', type: 'string' },
                    { name: 'Market', type: 'string' },
                    { name: 'Selections Count', type: 'integer' },
                    { name: 'Potential Win', type: 'float' }
                ]
            },
            {
                id: 'live_bet_placement', label: 'Live Bet Placed',
                params: [
                    { name: 'Stake', type: 'float' },
                    { name: 'Current Score', type: 'string' },
                    { name: 'Match Minute', type: 'integer' },
                    { name: 'Sport', type: 'enum', options: ['Football', 'Tennis', 'Basketball', 'Table Tennis'] }
                ]
            },
            {
                id: 'bet_settled', label: 'Bet Settled (General)',
                params: [
                    { name: 'Outcome', type: 'enum', options: ['Win', 'Loss', 'Void', 'Cashout', 'Half-Win', 'Half-Loss'] },
                    { name: 'Losing Selections Count', type: 'integer' },
                    { name: 'Winning Selections Count', type: 'integer' },
                    { name: 'Voided Selections Count', type: 'integer' },
                    { name: 'Payout', type: 'float' },
                    { name: 'Profit', type: 'float' },
                    { name: 'Total Odds', type: 'float' }
                ]
            },
            {
                id: 'acca_bet_settled', label: 'Accumulator Settled',
                params: [
                    { name: 'Total Legs', type: 'integer' },
                    { name: 'Losing Legs', type: 'integer' },
                    { name: 'Min Odds per Leg', type: 'float' },
                    { name: 'Outcome', type: 'enum', options: ['Win', 'Loss', 'One-Cut'] } // One-Cut is popular terminology
                ]
            },
            {
                id: 'cashout', label: 'Cashout Execution',
                params: [
                    { name: 'Cashout Type', type: 'enum', options: ['Full', 'Partial', 'Auto'] },
                    { name: 'Amount', type: 'float' },
                    { name: 'Original Stake', type: 'float' },
                    { name: 'Cashout %', type: 'float' }
                ]
            }
        ]
    },
    aviator: {
        label: 'Aviator & Crash Games',
        events: [
            {
                id: 'aviator_bet', label: 'Aviator Bet Placed',
                params: [
                    { name: 'Stake', type: 'float' },
                    { name: 'Auto Cashout Enabled', type: 'boolean' },
                    { name: 'Auto Cashout Target', type: 'float' }
                ]
            },
            {
                id: 'aviator_cashout', label: 'Aviator Cashout',
                params: [
                    { name: 'Multiplier', type: 'float' },
                    { name: 'Win Amount', type: 'float' },
                    { name: 'Burst Multiplier', type: 'float' }
                ]
            },
            {
                id: 'aviator_crash', label: 'Round Crashed (Loss)',
                params: [
                    { name: 'Stake Lost', type: 'float' },
                    { name: 'Crash Point', type: 'float' }
                ]
            }
        ]
    },
    wallet: {
        label: 'Wallet & Transactions',
        events: [
            {
                id: 'deposit', label: 'Deposit (General)',
                params: [
                    { name: 'Amount', type: 'float' },
                    { name: 'Method', type: 'enum', options: ['Mpesa', 'AirtelMoney', 'Cashia', 'Card', 'BankTransfer', 'Voucher'] },
                    { name: 'Currency', type: 'enum', options: ['KES', 'GHS', 'NGN', 'UGX', 'ETB', 'TZS', 'MWK'] },
                    { name: 'Is First Deposit', type: 'boolean' },
                    { name: 'Promo Code', type: 'string' }
                ]
            },
            {
                id: 'first_deposit', label: 'First Time Deposit (FTD)',
                params: [
                    { name: 'Amount', type: 'float' },
                    { name: 'Method', type: 'string' },
                    { name: 'Days Since Reg', type: 'integer' }
                ]
            },
            { id: 'withdrawal', label: 'Withdrawal Request', params: [{ name: 'Amount', type: 'float' }, { name: 'Method', type: 'string' }] },
            { id: 'withdrawal_completed', label: 'Withdrawal Completed', params: [{ name: 'Amount', type: 'float' }] }
        ]
    },
    casino: {
        label: 'Casino & Slots',
        events: [
            { id: 'game_launch', label: 'Game Launch', params: [{ name: 'Game ID', type: 'string' }, { name: 'Provider', type: 'string' }, { name: 'Category', type: 'string' }] },
            { id: 'spin', label: 'Spin / Round', params: [{ name: 'Bet Amount', type: 'float' }, { name: 'Game Type', type: 'enum', options: ['Slots', 'Table', 'Live Casino'] }] },
            { id: 'game_win', label: 'Big Win', params: [{ name: 'Win Amount', type: 'float' }, { name: 'Multiplier', type: 'float' }] },
            { id: 'bonus_round', label: 'Bonus Round Entry', params: [{ name: 'Game ID', type: 'string' }] }
        ]
    },
    engagement: {
        label: 'Engagement & Lifecycle',
        events: [
            { id: 'registration', label: 'New Registration', params: [{ name: 'Reg Method', type: 'enum', options: ['SMS', 'Web', 'App'] }, { name: 'Referral Code', type: 'string' }] },
            { id: 'login', label: 'User Login', params: [{ name: 'Days Inactive', type: 'integer' }, { name: 'Platform', type: 'string' }] },
            { id: 'profile_update', label: 'KYC Verified', params: [{ name: 'Doc Type', type: 'string' }] },
            { id: 'app_install', label: 'App Installation', params: [{ name: 'OS', type: 'enum', options: ['Android', 'iOS'] }] }
        ]
    }
};

const OPERATORS = [
  { value: '>', label: '> Greater Than' },
  { value: '>=', label: '≥ Greater or Equal' },
  { value: '<', label: '< Less Than' },
  { value: '<=', label: '≤ Less or Equal' },
  { value: '=', label: '= Equals' },
  { value: '!=', label: '≠ Not Equals' },
  { value: 'between', label: '⇔ Between' },
  { value: 'not_between', label: '⇎ Not Between' },
  { value: 'in', label: 'IN List' },
  { value: 'not_in', label: 'NOT IN List' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'is_set', label: 'Is Set (has value)' },
  { value: 'is_empty', label: 'Is Empty (no value)' },
];

// Operators that take no value (presence checks) and those that take a range (two values).
const ZERO_ARITY_OPS = new Set(['is_set', 'is_empty']);
const RANGE_OPS = new Set(['between', 'not_between']);


export default function StepEligibility() {
  const { state, updateEligibility } = useWizardContext();
  const searchParams = useSearchParams();
  const [activeTriggerIdForParam, setActiveTriggerIdForParam] = useState<string | null>(null);
  const [availableMarkets, setAvailableMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

 // CRM handoff: audience details passed from the Segments page (segment → promotion).
 const [crmHandoff, setCrmHandoff] = useState<{ id: string; name: string; audience: number } | null>(null);

 // Segments saved in the CRM Segments builder (localStorage-backed). These must
 // appear in the promotion audience picker so a freshly-created segment is
 // immediately selectable here.
 const [savedSegments, setSavedSegments] = useState<Segment[]>([]);

    // Context Access
    const { markets } = state.eligibility;
    const channels = state.eligibility.channels;
    const triggers = state.eligibility.triggers;
    const customSegments = state.eligibility.customSegments || [];

    // Temporary local state for UI management (moved save to Wizard footer)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);

    // Initial load: Add empty Deposit trigger if none exists (common start point)
    useEffect(() => {
        if (triggers.length === 0) {
            updateEligibility({ triggers: [{ id: 't-init', eventId: 'deposit', rules: [] }] });
        }
    }, []);

  // CRM handoff: pre-attach an incoming segment from the Segments page.
  useEffect(() => {
    if (!searchParams) return;
    const segId = searchParams.get('segment');
    if (!segId) return;

    const segName = searchParams.get('segmentName') || segId;
    const audience = parseInt(searchParams.get('audience') || '0', 10) || 0;

    setCrmHandoff({ id: segId, name: segName, audience });

    // Ensure the segment is a selectable option and mark it as the active target.
    if (!customSegments.includes(segId)) {
      updateEligibility({ customSegments: [...customSegments, segId], segment: segId });
    } else {
      updateEligibility({ segment: segId });
    }
  }, [searchParams]);

 // Load segments saved in the CRM Segments builder so they appear in the
 // audience picker. Re-load on focus and on storage events so a segment
 // created in the "Create new" tab shows up when the user returns here.
 useEffect(() => {
 const loadSegments = () => setSavedSegments(getSegments().filter((s) => !s.preset));
 loadSegments();
 window.addEventListener('focus', loadSegments);
 window.addEventListener('storage', loadSegments);
 return () => {
 window.removeEventListener('focus', loadSegments);
 window.removeEventListener('storage', loadSegments);
 };
 }, []);

 // Load settings with fallback
 useEffect(() => {
 const loadMarkets = () => {
            if (typeof window === 'undefined') return;

            const saved = localStorage.getItem('settings_countries');

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setAvailableMarkets(parsed.map((c: any) => ({
                            id: c.code,
                            name: c.name
                        })));
                        setIsLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse settings_countries", e);
                }
            }

            // Fallback if nothing saved - use a default list to avoid empty state on first load
            setAvailableMarkets([
                { id: 'KE', name: 'Kenya' },
                { id: 'GH', name: 'Ghana' },
                { id: 'NG', name: 'Nigeria' },
                { id: 'ET', name: 'Ethiopia' },
                { id: 'TZ', name: 'Tanzania' },
                { id: 'UG', name: 'Uganda' },
            ]);
            setIsLoading(false);
        };

        loadMarkets();

        // Optional: Listen for storage events (if settings changed in another tab)
        window.addEventListener('storage', loadMarkets);
        return () => window.removeEventListener('storage', loadMarkets);
    }, []);

  const toggleMarket = (id: string) => {
    // Normalize codes to a single canonical case so the default seed ('ke')
    // and the settings-provided codes ('KE') can never coexist and desync the
    // derived currency. All market codes are stored uppercase.
    const code = id.toUpperCase();
    const normalized = markets.map(m => m.toUpperCase());
    if (normalized.includes(code)) {
      // Deselecting: drop it, and if it was the primary market, promote the
      // first remaining market (or clear) so the derived currency stays valid.
      const remaining = normalized.filter(m => m !== code);
      const currentPrimary = (state.eligibility.primaryMarket || '').toUpperCase();
      const nextPrimary = currentPrimary === code ? (remaining[0] || '') : currentPrimary;
      updateEligibility({ markets: remaining, primaryMarket: nextPrimary });
    } else {
      // Selecting: the newly chosen market becomes the primary (drives currency).
      updateEligibility({ markets: [...normalized, code], primaryMarket: code });
    }
  };



    const toggleChannel = (id: string) => {
        if (channels.includes(id)) updateEligibility({ channels: channels.filter(c => c !== id) });
        else updateEligibility({ channels: [...channels, id] });
    };

    const setSegment = (val: string) => {
        updateEligibility({ segment: val });
    };

    // --- Trigger Logic ---
    const selectEvent = (eventId: string) => {
        updateEligibility({ triggers: [...triggers, { id: `t-${Date.now()}`, eventId, rules: [] }] });
        setIsEventModalOpen(false);
    };

    const removeTrigger = (triggerId: string) => {
        updateEligibility({ triggers: triggers.filter(t => t.id !== triggerId) });
    };

    // --- Rule Logic ---
    const addRuleToTrigger = (triggerId: string, param: EventParam) => {
        const newRule: Rule = {
            id: Date.now(),
            param: param.name,
            operator: 'eq',
            value: '',
            type: param.type
        };
        const updatedTriggers = triggers.map(t => {
            if (t.id === triggerId) {
                return { ...t, rules: [...t.rules, newRule] };
            }
            return t;
        });
        updateEligibility({ triggers: updatedTriggers });
        setActiveTriggerIdForParam(null);
    };

    const removeRuleFromTrigger = (triggerId: string, ruleId: number) => {
        const updatedTriggers = triggers.map(t => {
            if (t.id === triggerId) {
                return { ...t, rules: t.rules.filter(r => r.id !== ruleId) };
            }
            return t;
        });
        updateEligibility({ triggers: updatedTriggers });
    };

    const updateRule = (triggerId: string, ruleId: number, field: string, value: string) => {
        const updatedTriggers = triggers.map(t => {
            if (t.id === triggerId) {
                return {
                    ...t,
                    rules: t.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r)
                };
            }
            return t;
        });
        updateEligibility({ triggers: updatedTriggers });
    };

    // --- Helpers ---
    const getEventLabel = (eventId: string) => {
        for (const cat of Object.values(EVENT_CATALOG)) {
            const ev = cat.events.find(e => e.id === eventId);
            if (ev) return ev.label;
        }
        return eventId;
    };

    const getParams = (eventId: string) => {
        for (const cat of Object.values(EVENT_CATALOG)) {
            const ev = cat.events.find(e => e.id === eventId);
            if (ev) return ev.params;
        }
        return [];
    };

    const getParamDef = (eventName: string, paramName: string) => {
        for (const cat of Object.values(EVENT_CATALOG)) {
            const ev = cat.events.find(e => e.id === eventName);
            if (ev) return ev.params.find(p => p.name === paramName);
        }
        return null;
    };

  const renderValueInput = (rule: Rule, triggerId: string) => {
    const paramDef = getParamDef(triggers.find(t => t.id === triggerId)?.eventId || '', rule.param);

    // Presence operators (is_set / is_empty) take no value at all.
    if (ZERO_ARITY_OPS.has(rule.operator)) {
      return <span className="val-mini" style={{ opacity: 0.5 }}>— no value —</span>;
    }

    if (rule.type === 'boolean') {
      return (
        <select className="val-mini" value={rule.value} onChange={(e) => updateRule(triggerId, rule.id, 'value', e.target.value)}>
          <option value="">Select...</option>
          <option value="true">Yes (True)</option>
          <option value="false">No (False)</option>
        </select>
      );
    }

    if (paramDef?.type === 'enum' && paramDef.options) {
      return (
        <select className="val-mini" value={rule.value} onChange={(e) => updateRule(triggerId, rule.id, 'value', e.target.value)}>
          <option value="">Select...</option>
          {paramDef.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }

    const inputType = paramDef?.type === 'integer' || paramDef?.type === 'float' ? 'number' : 'text';

    // Range operators (between / not_between) take two values.
    if (RANGE_OPS.has(rule.operator)) {
      return (
        <span className="val-range">
          <input
            type={inputType}
            className="val-mini input"
            value={rule.value}
            placeholder="Min"
            onChange={(e) => updateRule(triggerId, rule.id, 'value', e.target.value)}
          />
          <span className="range-sep">and</span>
          <input
            type={inputType}
            className="val-mini input"
            value={(rule as any).value2 ?? ''}
            placeholder="Max"
            onChange={(e) => updateRule(triggerId, rule.id, 'value2', e.target.value)}
          />
        </span>
      );
    }

    return (
      <input
        type={inputType}
        className="val-mini input"
        value={rule.value}
        placeholder={rule.operator === 'in' || rule.operator === 'not_in' ? 'Comma-separated' : 'Value'}
        onChange={(e) => updateRule(triggerId, rule.id, 'value', e.target.value)}
      />
    );
  };


    return (
        <div className="step-container">
            <div className="split-layout">

                {/* LEFT COLUMN: Scope */}
                <div className="glass-panel column-panel">
            <div className="panel-header">
              <h3 className="panel-title"><Users size={18} className="text-cyan" /> Target Audience</h3>
              <p className="panel-subtitle">Who is eligible for this promotion?</p>
            </div>

            {crmHandoff && (
              <div className="crm-handoff-banner">
                <CheckCircle2 size={16} className="handoff-icon" />
                <div className="handoff-text">
                  <span className="handoff-title">CRM Segment attached</span>
                  <span className="handoff-detail">
                    <strong>{crmHandoff.name}</strong>
                    {crmHandoff.audience > 0 && (
                      <> · {crmHandoff.audience.toLocaleString()} players</>
                    )}
                  </span>
                </div>
              </div>
            )}

                    <div className="section">
                        <label className="section-label">Markets</label>
                        {isLoading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Loading markets...</div>
                        ) : (
                            <div className="grid-options">
                                {availableMarkets.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '13px', color: '#ccc' }}>
                                        No countries configured. <br /> Please go to Settings to add markets.
                                    </div>
                                ) : availableMarkets.map((m) => {
                                    const isActive = markets.some(mk => mk.toLowerCase() === m.id.toLowerCase());
                                    return (
                                        <div
                                            key={m.id}
                                            className={`option-card market-card ${isActive ? 'active' : ''}`}
                                            onClick={() => toggleMarket(m.id)}
                                        >
                                            <span className="flag-large">{getFlagEmoji(m.id)}</span>
                                            <span className="name">{m.name}</span>
                                            {isActive && <CheckCircle2 size={16} className="check-icon" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="section">
                        <label className="section-label">Channels</label>
                        <div className="platform-toggles">
                            {['web', 'mobile', 'app', 'ussd'].map(c => (
                                <div key={c} className={`p-toggle ${channels.includes(c) ? 'active' : ''}`} onClick={() => toggleChannel(c)}>
                                    <span style={{ textTransform: 'capitalize' }}>{c}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="section">
                        <label className="section-label">Player Segments</label>
                        <select
                            className="form-select full-width"
                            value={state.eligibility.segment}
                            onChange={(e) => {
                                const val = e.target.value;
    if (val === 'create_new') {
      // Send the user to the Segments builder in a new tab so their in-progress
      // promotion draft isn't lost. ?create=1 auto-opens a blank segment.
      window.open('/admin/crm/segments?create=1', '_blank');
      return;

                                }
                                setSegment(val);
                            }}
                        >
 <option value="all">All Registered Players</option>
 <option value="new">{"New Players (<30 days)"}</option>
 <option value="vip">VIP Tiers 1-3</option>

 {/* Segments created in the CRM Segments builder (localStorage). */}
 {savedSegments.length > 0 && (
 <optgroup label="Your saved segments">
 {savedSegments.map(seg => (
 <option key={seg.id} value={seg.id}>{seg.name}</option>
 ))}
 </optgroup>
 )}

 {/* Any ad-hoc custom segment ids not already covered above (e.g. CRM handoff). */}
 {customSegments
 .filter(seg => !savedSegments.some(s => s.id === seg))
 .map(seg => (
 <option key={seg} value={seg}>{seg.replace(/_/g, ' ').toUpperCase()}</option>
 ))}

 <option value="create_new">+ Create new segment…</option>
 </select>

                    </div>
                </div>

                {/* RIGHT COLUMN: Triggers */}
                {/* RIGHT COLUMN: Triggers */}
                <div className="glass-panel column-panel flex-grow relative-container">
                    <div className="panel-header">
                        <div className="header-row">
                            <div>
                                <h3 className="panel-title"><Zap size={18} className="text-yellow" /> Qualification Rules</h3>
                                <p className="panel-subtitle">Event-driven triggers</p>
                            </div>
                            <div className="sh-actions">
                                <button className={`btn-xs ${isAdvancedMode ? 'active-mode' : ''}`} onClick={() => setIsAdvancedMode(!isAdvancedMode)}>
                                    <Code size={12} /> Advanced
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-section form-scrollable">
                        {isAdvancedMode ? (
                            <div className="advanced-editor">
                                <div className="editor-lines">
                                    <span className="kwd">PROMOTION RULES</span>
                                    {triggers.map((trigger, idx) => (
                                        <div key={trigger.id} className="code-block">
                                            {idx > 0 && <div className="kwd block-sep">OR</div>}
                                            <div><span className="kwd">WHEN</span> EVENT <span className="str">"{getEventLabel(trigger.eventId)}"</span></div>
                                            {trigger.rules.map((rule) => (
                                                <div key={rule.id} style={{ paddingLeft: 20 }}>
                                                    <span className="kwd">AND</span> <span className="prop">{rule.param}</span> <span className="op">{rule.operator}</span> <span className="val">"{rule.value}"</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="triggers-container">
                                {triggers.map((trigger, index) => (
                                    <div key={trigger.id} className="trigger-card">
                                        <div className="trigger-header">
                                            <div className="trigger-title">
                                                <span className="trigger-badge">WHEN</span>
                                                <span className="trigger-name">{getEventLabel(trigger.eventId)}</span>
                                            </div>
                                            <button className="icon-btn danger" onClick={() => removeTrigger(trigger.id)}><Trash2 size={14} /></button>
                                        </div>

                                        <div className="rules-list">
                                            {trigger.rules.map((rule) => {
                                                return (
                                                    <div key={rule.id} className="rule-item">
                                                        <div className="rule-badge">AND</div>
                                                        <div className="rule-content">
                                                            <span className="param-label">{rule.param}</span>
                                                            <div className="op-mini-wrapper">
                                                                <select className="op-mini" value={rule.operator} onChange={(e) => updateRule(trigger.id, rule.id, 'operator', e.target.value)}>
                                                                    {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                                                                </select>
                                                            </div>
                                                            {renderValueInput(rule, trigger.id)}
                                                        </div>
                                                        <button className="icon-btn" onClick={() => removeRuleFromTrigger(trigger.id, rule.id)}><X size={12} /></button>
                                                    </div>
                                                );
                                            })}

                                            <div className="add-condition-section">
                                                {activeTriggerIdForParam === trigger.id ? (
                                                    <div className="param-selector-inline">
                                                        <div className="param-picker-header">
                                                            <span>Select Parameter</span>
                                                            <button onClick={() => setActiveTriggerIdForParam(null)}><X size={12} /></button>
                                                        </div>
                                                        <div className="param-options">
                                                            {getParams(trigger.eventId).map(p => (
                                                                <button key={p.name} className="param-opt" onClick={() => addRuleToTrigger(trigger.id, p)}>
                                                                    {p.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className="add-condition-btn" onClick={() => setActiveTriggerIdForParam(trigger.id)}>
                                                        <Plus size={14} /> Add Condition
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {index < triggers.length - 1 && <div className="logic-connector">OR</div>}
                                    </div>
                                ))}

                                <button className="btn-add-trigger" onClick={() => setIsEventModalOpen(true)}>
                                    <Plus size={16} /> Add Trigger Event
                                </button>
                            </div>
                        )}
                    </div>
                </div>


                {/* Event Selection Modal Overlay */}
                {isEventModalOpen && (
                    <div className="modal-overlay">
                        <div className="event-modal">
                            <div className="modal-header">
                                <h3>Select Trigger Event</h3>
                                <button onClick={() => setIsEventModalOpen(false)}><X size={18} /></button>
                            </div>
                            <div className="modal-body">
                                {Object.entries(EVENT_CATALOG).map(([key, cat]) => (
                                    <div key={key} className="catalog-category">
                                        <div className="cat-header">{cat.label}</div>
                                        <div className="cat-grid">
                                            {cat.events.map(ev => (
                                                <button key={ev.id} className="event-tile" onClick={() => selectEvent(ev.id)}>
                                                    <span className="ev-label">{ev.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .step-container { max-width: 1200px; margin: 0 auto; animation: fadeUp 0.3s ease; }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .split-layout { display: flex; gap: 24px; align-items: flex-start; }
                .glass-panel { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; }
                .column-panel { flex: 1; min-height: 400px; }
                .flex-grow { flex: 1.6; }
                .relative-container { position: relative; }

                .form-scrollable { overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: var(--color-border) transparent; }
                .form-scrollable::-webkit-scrollbar { width: 6px; }
                .form-scrollable::-webkit-scrollbar-thumb { background-color: var(--color-border); border-radius: 3px; }

                .panel-title { color: var(--color-text-primary); font-size: 16px; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
                .panel-subtitle { color: var(--color-text-muted); font-size: 12px; margin: 0; }
                .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }

                .text-cyan { color: var(--color-accent-cyan); }
                .text-yellow { color: var(--color-betika-yellow); }

                /* Common Inputs */
                .section { margin-bottom: 24px; }
                .section-label { display: block; font-size: 11px; font-weight: 700; color: var(--color-text-muted); margin-bottom: 8px; text-transform: uppercase; }
                .chip-grid { display: flex; flex-wrap: wrap; gap: 8px; }
                .chip { background: var(--color-bg-card); padding: 8px 16px; border-radius: 6px; font-size: 13px; color: var(--color-text-muted); cursor: pointer; border: 1px solid transparent; }
                .chip.active { background: rgba(6,182,212,0.15); color: var(--color-accent-cyan); border-color: rgba(6,182,212,0.3); }
                
                .platform-toggles { display: flex; gap: 8px; }
                .p-toggle { flex: 1; padding: 10px; background: var(--color-bg-card); border-radius: 6px; text-align: center; font-size: 12px; color: var(--color-text-muted); cursor: pointer; border: 1px solid transparent; }
                .p-toggle.active { background: var(--color-bg-input-focus); color: var(--color-text-primary); border-color: var(--color-border); }
                .form-select { width: 100%; padding: 10px; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text-primary); font-size: 13px; }

                /* Trigger Cards */
                .triggers-container { display: flex; flex-direction: column; gap: 16px; }
                .trigger-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
                
                .trigger-header { padding: 12px 16px; background: var(--color-bg-input); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
                .trigger-title { display: flex; align-items: center; gap: 10px; }
                .trigger-badge { font-size: 10px; font-weight: 800; background: #facc15; color: #000; padding: 2px 6px; border-radius: 4px; }
                .trigger-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }

                .rules-list { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
                .rule-item { display: flex; align-items: center; gap: 8px; }
                .rule-badge { font-size: 9px; font-weight: 700; color: var(--color-text-muted); width: 24px; text-align: right; }
                .rule-content { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--color-bg-input); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--color-border); }
                .param-label { font-size: 12px; color: var(--color-accent-cyan); font-weight: 500; min-width: 80px; }
                
                .op-mini, .val-mini { background: transparent; border: none; font-size: 12px; color: var(--color-text-secondary); padding: 4px; }
                .op-mini { width: 110px; color: var(--color-text-muted); }
                .val-mini { flex: 1; border-bottom: 1px dashed var(--color-border); color: var(--color-text-primary); }
                .val-mini:focus { outline: none; border-bottom-color: var(--color-accent-cyan); }
        .val-range { flex: 1; display: flex; align-items: center; gap: 6px; }
        .val-range .val-mini { flex: 1; min-width: 0; }
        .range-sep { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; }

                
                .icon-btn { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .icon-btn:hover { color: var(--color-text-primary); background: var(--color-bg-input-focus); }
                .icon-btn.danger:hover { color: #f87171; background: rgba(248,113,113,0.1); }

                /* Add Condition Area */
                .add-condition-section { margin-left: 32px; margin-top: 4px; }
                .add-condition-btn { background: transparent; border: 1px dashed var(--color-border); color: var(--color-text-muted); padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
                .add-condition-btn:hover { border-color: #facc15; color: #facc15; background: rgba(250,204,21,0.05); }

                .param-selector-inline { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 6px; width: fit-content; min-width: 200px; animation: fadeIn 0.1s; }
                .param-picker-header { padding: 8px 12px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; }
                .param-options { padding: 4px; display: flex; flex-direction: column; }
                .param-opt { background: transparent; border: none; text-align: left; padding: 6px 12px; color: var(--color-text-secondary); font-size: 12px; cursor: pointer; border-radius: 4px; }
                .param-opt:hover { background: var(--color-accent-cyan); color: #000; }

                .logic-connector { text-align: center; font-size: 10px; font-weight: 800; color: var(--color-text-muted); margin: 4px 0; position: relative; }
                .logic-connector::before, .logic-connector::after { content: ''; display: block; height: 8px; width: 1px; background: var(--color-border); margin: 0 auto; }

                .add-trigger-btn { width: 100%; background: var(--color-bg-card); border: 1px dashed var(--color-border); padding: 12px; border-radius: 8px; color: var(--color-text-muted); font-size: 13px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .add-trigger-btn:hover { background: var(--color-bg-input); color: var(--color-text-primary); border-color: var(--color-text-secondary); }

                /* Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; }
                .event-modal { background: var(--color-bg-panel); width: 600px; border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                .modal-header { padding: 16px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: var(--color-bg-card); }
                .modal-header h3 { margin: 0; font-size: 16px; color: var(--color-text-primary); }
                .modal-header button { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; }
                
                .modal-body { padding: 24px; max-height: 60vh; overflow-y: auto; }
                .catalog-category { margin-bottom: 24px; }
                .cat-header { font-size: 11px; font-weight: 700; color: var(--color-text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .event-tile { background: var(--color-bg-card); border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; color: var(--color-text-primary); font-size: 13px; cursor: pointer; text-align: center; transition: all 0.2s; }
                .event-tile:hover { background: var(--color-accent-cyan); color: #000; border-color: var(--color-accent-cyan); transform: translateY(-2px); }

                /* Segment Creator */
                .form-control { margin-bottom: 16px; }
                .form-control label { display: block; font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
                .form-control input, .form-control textarea { width: 100%; background: var(--color-bg-input); border: 1px solid var(--color-border); color: var(--color-text-primary); padding: 10px; border-radius: 6px; font-size: 13px; outline: none; }
                .form-control input:focus, .form-control textarea:focus { border-color: var(--color-accent-cyan); }
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
                .btn-cancel { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-muted); padding: 8px 16px; border-radius: 6px; cursor: pointer; }
                .btn-primary { background: var(--color-accent-cyan); border: none; color: #000; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
                .btn-primary:hover { background: #22d3ee; }

                .btn-xs { background: var(--color-bg-card); border: 1px solid var(--color-border); padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px; }
                .active-mode { background: var(--color-accent-cyan); color: #000; border-color: var(--color-accent-cyan); font-weight: 600; }
                
                .advanced-editor { background: #000; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.6; color: #ccc; min-height: 400px; } 
                .kwd { color: #c678dd; font-weight: bold; }
                .str { color: #98c379; }
                .prop { color: #e06c75; }
                .op { color: #56b6c2; }
                .val { color: #d19a66; }
                .block-sep { margin: 10px 0; color: #facc15; }

                /* Market Card Styles */
                .grid-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .option-card {
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .option-card:hover { background: var(--color-bg-input-focus); }
                .option-card.active {
                    background: rgba(6, 182, 212, 0.1);
                    border-color: var(--color-accent-cyan);
                }
                .flag-large { font-size: 32px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
                .name { font-size: 12px; font-weight: 500; color: var(--color-text-muted); }
                .check-icon { position: absolute; top: 6px; right: 6px; color: var(--color-accent-cyan); }
                /* Button Refinements */
                .btn-save-seg {
                    background: transparent;
                    color: var(--color-betika-yellow);
                    border: 1px solid var(--color-betika-yellow);
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .btn-save-seg:hover {
                    background: var(--color-betika-yellow);
                    color: #000;
                    box-shadow: 0 0 8px rgba(250, 204, 21, 0.4);
                }

                .btn-add-trigger {
                    width: 100%;
                    padding: 14px;
                    border: 1px dashed var(--color-border);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    color: var(--color-text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 16px;
                    font-size: 13px;
                    font-weight: 500;
                }
                .btn-add-trigger:hover {
                    border-color: var(--color-accent-cyan);
                    color: var(--color-accent-cyan);
                    background: rgba(6, 182, 212, 0.05);
                    transform: translateY(-1px);
                }

        /* CRM Handoff Banner */
        .crm-handoff-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 20px;
          animation: fadeUp 0.3s ease;
        }
        .handoff-icon { color: var(--color-accent-cyan); flex-shrink: 0; }
        .handoff-text { display: flex; flex-direction: column; gap: 2px; }
        .handoff-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-accent-cyan); }
        .handoff-detail { font-size: 13px; color: var(--color-text-secondary); }
        .handoff-detail strong { color: var(--color-text-primary); }

        @media (max-width: 900px) {
          .split-layout { flex-direction: column; }
                    .column-panel { width: 100%; min-height: auto; }
                    .grid-options { grid-template-columns: repeat(2, 1fr); }
                    .cat-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 600px) {
                    .header-row { flex-direction: column; gap: 12px; align-items: flex-start; }
                    .cat-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div >
    );
}
