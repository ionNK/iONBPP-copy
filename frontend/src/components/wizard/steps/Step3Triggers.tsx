'use client';
import { Layers, Zap, Users, Code, Trash2, Plus, X, ChevronDown, Check, CheckCircle2, Save, AlertTriangle, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWizardContext, Trigger, Rule } from '@/context/WizardContext';

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
                    { name: 'Outcome', type: 'enum', options: ['Win', 'Loss', 'One-Cut'] }
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
      {
        id: 'login', label: 'User Login',
        params: [
          { name: 'Days Inactive', type: 'integer' },
          { name: 'Platform', type: 'enum', options: ['App', 'Web', 'Mobile', 'USSD'] },
          { name: 'Is First Login', type: 'boolean' },
          { name: 'Is First App Login', type: 'boolean' }
        ]
      },

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
 { value: 'in', label: 'IN List' },
 { value: 'contains', label: 'Contains' },
 { value: 'between', label: 'Between' }
];

export default function StepTriggers() {
  const { state, updateEligibility } = useWizardContext();
  const [activeTriggerIdForParam, setActiveTriggerIdForParam] = useState<string | null>(null);
  const triggers = state.eligibility?.triggers || [];

  // Derived context for advisory UI (read-only; no backend involvement)
  const perPlayerCap = state.schedule?.limits?.perPlayer;

  const selectedChannels = state.eligibility?.channels || [];
  // Does any selected channel represent the mobile App?
  const appChannelSelected = selectedChannels.some(
    (c) => c.toLowerCase() === 'app' || c.toLowerCase() === 'mobile'
  );


    // UI State
const [isEventModalOpen, setIsEventModalOpen] = useState(false);
const [isAdvancedMode, setIsAdvancedMode] = useState(false);
const [openRuleDropdown, setOpenRuleDropdown] = useState<string | null>(null);

useEffect(() => {
if (!openRuleDropdown) return;

const closeOnOutsideClick = (event: MouseEvent) => {
const target = event.target as HTMLElement;
if (!target.closest(`[data-rule-dropdown-id="${openRuleDropdown}"]`)) {
setOpenRuleDropdown(null);
}
};

document.addEventListener('mousedown', closeOnOutsideClick);
return () => document.removeEventListener('mousedown', closeOnOutsideClick);
}, [openRuleDropdown]);

    // Initial load: Add empty Deposit trigger if none exists
    useEffect(() => {
        if (triggers.length === 0) {
            updateEligibility({ triggers: [{ id: 't-init', eventId: 'deposit', rules: [] }] });
        }
    }, []);

    // --- Trigger Logic ---
    const selectEvent = (eventId: string) => {
        updateEligibility({ triggers: [...triggers, { id: `t-${Date.now()}`, eventId, rules: [] }] });
        setIsEventModalOpen(false);
    };

    const removeTrigger = (triggerId: string) => {
        updateEligibility({ triggers: triggers.filter(t => t.id !== triggerId) });
    };

    // --- Rule Logic ---
  // Choose a sensible default operator based on the parameter's data type.
  // Numeric params default to ">"; text/enum/boolean params default to "="
  // (so we never produce nonsensical rules like "Platform > App").
  const defaultOperatorFor = (type: string) =>
    type === 'integer' || type === 'float' ? '>' : '=';

  const addRuleToTrigger = (triggerId: string, param: EventParam) => {
    const newRule: Rule = {
      id: Date.now(),
      param: param.name,
      operator: defaultOperatorFor(param.type),
      value: '',
      type: param.type
    };

        const updatedTriggers = triggers.map(t => {
            if (t.id === triggerId) {
                return { ...t, rules: [...(t.rules || []), newRule] };
            }
            return t;
        });
        updateEligibility({ triggers: updatedTriggers });
        setActiveTriggerIdForParam(null);
    };

    const removeRuleFromTrigger = (triggerId: string, ruleId: number) => {
        const updatedTriggers = triggers.map(t => {
            if (t.id === triggerId) {
                return { ...t, rules: (t.rules || []).filter(r => r.id !== ruleId) };
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
                    rules: (t.rules || []).map(r => r.id === ruleId ? { ...r, [field]: value } : r)
                };
            }
            return t;
        });
        updateEligibility({ triggers: updatedTriggers });
    };

    // --- Helpers ---
    const getEventLabel = (eventId: string) => {
        if (!eventId) return 'Unknown Event';
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

const renderRuleDropdown = (
triggerId: string,
ruleId: number,
field: string,
value: string,
options: Array<{ value: string; label: string }>,
className: string,
ariaLabel: string
) => {
const dropdownId = `${triggerId}-${ruleId}-${field}`;
const isOpen = openRuleDropdown === dropdownId;
const selectedOption = options.find((option) => option.value === value);

return (
 <div className={`rule-dropdown ${className}`} data-rule-dropdown-id={dropdownId}>
 <button
 type="button"
 className="ds-control ds-dropdown-trigger rule-dropdown-trigger"
onClick={() => setOpenRuleDropdown(isOpen ? null : dropdownId)}
aria-expanded={isOpen}
aria-haspopup="listbox"
>
<span className={selectedOption ? 'ds-dropdown-trigger__value' : 'ds-dropdown-trigger__placeholder'}>
{selectedOption?.label || 'Select...'}
</span>
<ChevronDown size={16} className="ds-dropdown-trigger__chevron" />
</button>
{isOpen && (
 <div className="ds-dropdown-menu rule-dropdown-menu" role="listbox" aria-label={ariaLabel}>
{options.map((option) => {
const selected = option.value === value;
return (
<button
key={option.value}
type="button"
 className={`ds-dropdown-item ${selected ? 'is-selected' : ''}`}
role="option"
aria-selected={selected}
onClick={() => {
updateRule(triggerId, ruleId, field, option.value);
setOpenRuleDropdown(null);
}}
>
<span>{option.label}</span>
{selected && <Check size={16} className="rule-dropdown-check" />}
</button>
);
})}
</div>
)}
</div>
);
};

const renderValueInput = (rule: Rule, triggerId: string) => {
const paramDef = getParamDef(triggers.find(t => t.id === triggerId)?.eventId || '', rule.param);

if (rule.type === 'boolean') {
return renderRuleDropdown(
triggerId,
rule.id,
'value',
rule.value,
[
{ value: 'true', label: 'Yes (True)' },
{ value: 'false', label: 'No (False)' },
],
'val-mini',
`${rule.param} value`
);
}

if (paramDef?.type === 'enum' && paramDef.options) {
return renderRuleDropdown(
triggerId,
rule.id,
'value',
rule.value,
paramDef.options.map((option) => ({ value: option, label: option })),
'val-mini',
`${rule.param} value`
);
}

        if (rule.operator === 'between') {
            const valStr = String(rule.value || '');
            const [min, max] = valStr.includes('-') ? valStr.split('-').map(s => s.trim()) : [valStr, ''];

            return (
                <div className="flex gap-2 items-center flex-1">
                    <input
                        type="number"
 className="trigger-input interactive-input ds-control"
 value={min || ''}
                        placeholder="Min"
                        onChange={(e) => updateRule(triggerId, rule.id, 'value', `${e.target.value}-${max || ''}`)}
                    />
                    <span className="range-separator text-muted text-xs">to</span>
                    <input
                        type="number"
 className="trigger-input interactive-input ds-control"
 value={max || ''}
                        placeholder="Max"
                        onChange={(e) => updateRule(triggerId, rule.id, 'value', `${min || ''}-${e.target.value}`)}
                    />
                </div>
            );
        }

        return (
            <input
                type={paramDef?.type === 'integer' || paramDef?.type === 'float' ? 'number' : 'text'}
 className="trigger-input interactive-input ds-control"
 value={rule.value}
                placeholder="Value"
                onChange={(e) => updateRule(triggerId, rule.id, 'value', e.target.value)}
            />
        );
    };

    return (
        <div className="wizard-triggers step-container">
            <div className="trigger-layout">
                <div className="ds-panel">
                    <div className="panel-header">
                        <div className="header-row">
                            <div>
                                <h3 className="panel-title"><Zap size={18} className="text-yellow" /> Qualification Rules</h3>
                                <p className="panel-subtitle">Define the event-driven qualifications for this promotion.</p>
                            </div>
              <div className="sh-actions">
                <button className={`btn-xs ${isAdvancedMode ? 'active-mode' : ''}`} onClick={() => setIsAdvancedMode(!isAdvancedMode)}>
                  <Code size={12} /> Advanced Mode
                </button>
              </div>
            </div>
 {perPlayerCap && (
 <div className="cap-reminder ds-notice ds-notice--warning">
 <span className="ds-notice__icon" aria-hidden="true"><AlertTriangle /></span>
 <span>Eligibility cap: <strong>{perPlayerCap} per player</strong> (set in Schedule)</span>
 </div>
 )}
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
                                            {(trigger.rules || []).map((rule) => (
                                                <div key={rule.id} className="code-rule-line">
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
                                    <div key={trigger.id} className="trigger-card ds-card">
                                        <div className="trigger-header">
                                            <div className="trigger-title">
                                                <span className="trigger-badge">WHEN</span>
                                                <span className="trigger-name">{getEventLabel(trigger.eventId)}</span>
                                            </div>
                                            <button className="icon-btn danger" onClick={() => removeTrigger(trigger.id)}><Trash2 size={14} /></button>
                                        </div>

                          <div className="rules-list">
                            {(trigger.rules || []).length === 0 && (
                              <div className="trigger-hint">
                                <CheckCircle2 size={12} /> Fires on any occurrence of this event. Add a condition below to narrow it down.
                              </div>
                            )}
                            {(trigger.rules || []).map((rule) => {
                              // Advisory: flag App-targeted rules when 'app' isn't a selected channel
                              const isAppRule =
                                (rule.param === 'Platform' || rule.param === 'Reg Method') &&
                                rule.value.toLowerCase() === 'app';
                              const showChannelWarning = isAppRule && !appChannelSelected;
                              return (

                                    <div key={rule.id}>
                                      <div className="rule-item">
                                        <div className="rule-badge">AND</div>
                                        <div className="rule-content">
                                          <span className="param-label">{rule.param}</span>
<div className="op-mini-wrapper">
{renderRuleDropdown(
trigger.id,
rule.id,
'operator',
rule.operator,
OPERATORS,
'op-mini',
`${rule.param} operator`
)}
</div>
                                          {renderValueInput(rule, trigger.id)}
                                        </div>
                                        <button className="icon-btn" onClick={() => removeRuleFromTrigger(trigger.id, rule.id)}><X size={12} /></button>
                                      </div>
 {showChannelWarning && (
 <div className="channel-warning ds-notice ds-notice--warning" role="status">
 <span className="ds-notice__icon" aria-hidden="true"><AlertTriangle /></span>
 <span>This rule targets the App, but 'app' isn't a selected channel in Scope.</span>
 </div>
 )}
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
                                                                <button key={p.name} className="param-opt ds-choice" onClick={() => addRuleToTrigger(trigger.id, p)}>
                                                                    {p.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className="add-condition-btn ds-add-action" onClick={() => setActiveTriggerIdForParam(trigger.id)}>
                                                        <Plus size={14} /> Add Condition
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {index < triggers.length - 1 && <div className="logic-connector">OR</div>}
                                    </div>
                                ))}

                                <button className="btn-add-trigger ds-add-action" onClick={() => setIsEventModalOpen(true)}>
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
                                                <button key={ev.id} className="event-tile ds-choice" onClick={() => selectEvent(ev.id)}>
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
        </div>
    );
}
