'use client';
import { Gift, Percent, ArrowRight, Plus, Trash2, Layers, Calendar, Users, AlertCircle, List, AlertTriangle } from 'lucide-react';
import { useWizardContext, TierRule } from '@/context/WizardContext';
import { getTemplateMeta } from '@/data/promotionTemplates';
import { useState, useEffect } from 'react';

// Maps the reward-type cards in this step to the reward labels declared in template metadata.
const REWARD_LABELS: Record<string, string[]> = {
  freespins: ['Free Rounds'],
  freebets: ['Free Bet'],
  freerounds: ['Free Rounds'],
  cash: ['Cash'],
  bonus: ['Deposit Match Bonus', 'Bonus Funds', 'Cashback Bonus'],
};

// Maps a market code (from Step 2 Scope) to its local currency.
const MARKET_CURRENCY: Record<string, string> = {
  ke: 'KES',
  et: 'ETB',
  gh: 'GHS',
  ng: 'NGN',
  tz: 'TZS',
  ug: 'UGX',
  zm: 'ZMW',
  za: 'ZAR',
  cm: 'XAF',
  cd: 'CDF',
  ml: 'XOF',
  sn: 'XOF',
  mw: 'MWK',
};

// Curated list of games that support Free Rounds / Free Spins style rewards.
const TARGET_GAMES = ['Aviator', 'JetX', 'Spaceman', 'Crash', 'Plinko', 'Mines', 'Lucky Jet'];


export default function StepRewards() {
 const { state, updateRewards } = useWizardContext();
 const { type: rewardType, calcType, matrixDimension, tiers, simpleConfig, wagering, freebet, multiDay } = state.rewards;

 const templateMeta = getTemplateMeta(state.basics.type);
 const rewardAligned = !templateMeta
 ? true
 : (REWARD_LABELS[rewardType] || []).some((label) => templateMeta.allowedRewards.includes(label));



  const { markets, primaryMarket } = state.eligibility;

  // The market that drives the currency: the explicitly-tracked primary market,
  // falling back to the last selected market for older/partial state.
  const currencyMarket = (primaryMarket || (markets && markets[markets.length - 1]) || '').toLowerCase();

  // Currency derived from the primary market (falls back to freebet currency).
  const activeCurrency = (() => {
    if (currencyMarket && MARKET_CURRENCY[currencyMarket]) {
      return MARKET_CURRENCY[currencyMarket];
    }
    return freebet.currency || 'KES';
  })();


  const [countryLimits, setCountryLimits] = useState<Record<string, number>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


    const setRewardType = (val: string) => updateRewards({ type: val });
    const setCalcType = (val: string) => updateRewards({ calcType: val });
    const setMatrixDimension = (val: string) => updateRewards({ matrixDimension: val });

  // Keep the free-bet currency in sync with the primary market chosen in Step 2.
  useEffect(() => {
    if (!currencyMarket) return;
    const mapped = MARKET_CURRENCY[currencyMarket];
    if (mapped && mapped !== freebet.currency) {
      updateRewards({ freebet: { ...freebet, currency: mapped } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyMarket]);



  // Load Country Limits from Settings
  useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('settings_countries');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const limits: Record<string, number> = {};
                    if (Array.isArray(parsed)) {
                        parsed.forEach((c: any) => {
                            if (c.code) limits[c.code.toUpperCase()] = Number(c.promoLimit) || 0;
                        });
                        setCountryLimits(limits);
                    }
                } catch (e) {
                    console.error("Failed to load country limits", e);
                }
            }
        }
    }, []);

    // Validate Config against Limits
    useEffect(() => {
        const errors: string[] = [];
        const selectedMarkets = markets || [];

        selectedMarkets.forEach(m => {
            const code = m.toUpperCase();
            const limit = countryLimits[code];

            if (limit && limit > 0) {
                if (calcType === 'simple') {
                    const currentCap = Number(simpleConfig.cap) || 0;
                    if (currentCap > limit) {
                        errors.push(`Reward Cap (${currentCap}) exceeds the limit for ${code} (${limit})`);
                    }
                } else if (calcType === 'tiered') {
                    tiers.forEach(tier => {
                        const tierCap = Number(tier.cap) || 0;
                        if (tierCap > limit) {
                            errors.push(`Tier value (${tierCap}) exceeds the limit for ${code} (${limit})`);
                        }
                    });
                }
            }
        });

        // Dedup errors
        setValidationErrors([...new Set(errors)]);
    }, [simpleConfig, tiers, calcType, markets, countryLimits]);


    const addTier = () => {
        updateRewards({
            tiers: [...tiers, {
                id: Date.now(),
                dimensionKey: matrixDimension,
                dimensionValue: matrixDimension === 'week' ? 'Week X' : '6 Selections',
                segment: 'Any',
                percentage: '0',
                cap: '0'
            }]
        });
    };

    const removeTier = (id: number) => {
        updateRewards({ tiers: tiers.filter(t => t.id !== id) });
    };

    const updateTier = (id: number, field: keyof TierRule, value: string) => {
        updateRewards({
            tiers: tiers.map(t => t.id === id ? { ...t, [field]: value } : t)
        });
    };

    // Helper to switch matrix type
    const toggleMatrixMode = (mode: string) => {
        setMatrixDimension(mode);
        // Reset tiers for demo purposes when switching
        if (mode === 'selections') {
            updateRewards({
                tiers: [
                    { id: 1, dimensionKey: 'selections', dimensionValue: '6-7 Selections', segment: 'Any', percentage: '100', cap: 'Unlimited' },
                    { id: 2, dimensionKey: 'selections', dimensionValue: '8-9 Selections', segment: 'Any', percentage: '150', cap: 'Unlimited' }
                ]
            });
        } else {
            updateRewards({
                tiers: [
                    { id: 1, dimensionKey: 'week', dimensionValue: 'Week 1', segment: 'Low Value', percentage: '30', cap: '60' }
                ]
            });
        }
    };

    return (
        <div className="step-container">
<div className="form-panel ds-panel">
<h2 className="panel-title">Reward Configuration</h2>

{/* Template guidance banner */}
{templateMeta && (
<div className={`template-guidance ds-notice ${rewardAligned ? 'ds-hint' : 'ds-notice--warning'}`} role="status">
<span className="ds-notice__icon" aria-hidden="true">
{rewardAligned ? <Gift /> : <AlertTriangle />}
</span>
<div className="tg-content">
<p className="tg-title">{rewardAligned ? 'Recommended rewards for this template' : 'Reward type may not suit this template'}</p>
<div className="tg-chips">
{templateMeta.allowedRewards.map((r) => (
<span key={r} className="tg-chip">{r}</span>
))}
</div>
{!rewardAligned && (
<p className="tg-hint">The selected reward type isn't among the rewards typically used for this template. Confirm this is intentional before continuing.</p>
)}
</div>
</div>
)}

 {/* Validation Warning Box */}

                {validationErrors.length > 0 && (
                    <div className="validation-warning">
                        <div className="vw-header">
                            <AlertTriangle size={18} className="text-warning" />
                            <span>Configuration Limit Exceeded</span>
                        </div>
                        <ul className="vw-list">
                            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}

                {/* 1. Reward Type Selection */}
                <div className="form-section">
<label className="ds-section-label">Reward Type</label>
<div className="rewards-grid">
<div className={`reward-card ds-choice ${rewardType === 'freespins' ? 'is-selected' : ''}`} onClick={() => setRewardType('freespins')}>
<span className={`type-radio ${rewardType === 'freespins' ? 'is-selected' : ''}`} aria-label={rewardType === 'freespins' ? 'Selected' : undefined} />
<span className="type-name">Freespins</span>
<div className="type-desc">Spins on specific slot games.</div>
</div>
<div className={`reward-card ds-choice ${rewardType === 'freebets' ? 'is-selected' : ''}`} onClick={() => setRewardType('freebets')}>
<span className={`type-radio ${rewardType === 'freebets' ? 'is-selected' : ''}`} aria-label={rewardType === 'freebets' ? 'Selected' : undefined} />
<span className="type-name">Freebets</span>
<div className="type-desc">Free bet tokens for sports.</div>
</div>
<div className={`reward-card ds-choice ${rewardType === 'freerounds' ? 'is-selected' : ''}`} onClick={() => setRewardType('freerounds')}>
<span className={`type-radio ${rewardType === 'freerounds' ? 'is-selected' : ''}`} aria-label={rewardType === 'freerounds' ? 'Selected' : undefined} />
<span className="type-name">Freerounds</span>
<div className="type-desc">Rounds for crash games.</div>
</div>
<div className={`reward-card ds-choice ${rewardType === 'cash' ? 'is-selected' : ''}`} onClick={() => setRewardType('cash')}>
<span className={`type-radio ${rewardType === 'cash' ? 'is-selected' : ''}`} aria-label={rewardType === 'cash' ? 'Selected' : undefined} />
<span className="type-name">Cash</span>
<div className="type-desc">Real withdrawable cash.</div>
</div>
<div className={`reward-card ds-choice ${rewardType === 'bonus' ? 'is-selected' : ''}`} onClick={() => setRewardType('bonus')}>
<span className={`type-radio ${rewardType === 'bonus' ? 'is-selected' : ''}`} aria-label={rewardType === 'bonus' ? 'Selected' : undefined} />
<span className="type-name">Bonus</span>
<div className="type-desc">Bonus funds with wagering.</div>
</div>
</div>
                </div>

                {/* 2. Value Configuration */}
                <div className="config-box">
                    <div className="config-header">
                        <h3 className="sub-title">Reward Value Model</h3>
                        <div className="toggle-group">
                            <button className={`toggle-btn ds-choice ${calcType === 'simple' ? 'is-selected' : ''}`} onClick={() => setCalcType('simple')}>
                                <Percent size={14} /> Simple Rule
                            </button>
                            <button className={`toggle-btn ds-choice ${calcType === 'tiered' ? 'is-selected' : ''}`} onClick={() => setCalcType('tiered')}>
                                <Layers size={14} /> Tiered Matrix
                            </button>
                        </div>
                    </div>

                    {calcType === 'simple' ? (
                        <div className="value-inputs">
                            <div className="input-col">
                                <label>Match Percentage</label>
 <div className="big-input-wrapper ds-control">
 <input type="number" value={simpleConfig.percentage} className="big-input" onChange={(e) => updateRewards({ simpleConfig: { ...simpleConfig, percentage: e.target.value } })} />
                                    <span className="suffix">%</span>
                                </div>
                            </div>
                            <div className="arrow-col">
                                <ArrowRight size={24} className="text-muted" />
                            </div>
                            <div className="input-col">
                                <label>Max Amount Cap</label>
 <div className="big-input-wrapper ds-control">
 <span className="prefix">{activeCurrency}</span>
 <input type="number" value={simpleConfig.cap} className="big-input" onChange={(e) => updateRewards({ simpleConfig: { ...simpleConfig, cap: e.target.value } })} />

                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="tiered-matrix">
                            <div className="matrix-toolbar">
                                <span className="label">Structure Tiers By:</span>
                                <div className="pill-selector">
                                    <button className={`pill ds-choice ${matrixDimension === 'week' ? 'is-selected' : ''}`} onClick={() => toggleMatrixMode('week')}>Time Period</button>
                                    <button className={`pill ds-choice ${matrixDimension === 'selections' ? 'is-selected' : ''}`} onClick={() => toggleMatrixMode('selections')}>Selection Count</button>
                                </div>
                            </div>

                            <div className="matrix-header">
                                <div className="col">
                                    {matrixDimension === 'week' ? 'Time Period' : 'Selections Range'}
                                </div>
                                <div className="col">Segment / Band</div>
                                <div className="col">Reward Allowed</div>
                                <div className="col">Max Cap</div>
                                <div className="col-action"></div>
                            </div>
                            <div className="matrix-body">
                                {tiers.map((tier) => (
                                    <div key={tier.id} className="matrix-row">
                                        <div className="col">
                                            <div className="field-group">
                                                {matrixDimension === 'week' ? <Calendar size={12} className="field-icon" /> : <List size={12} className="field-icon" />}
                                                <input
                                                    type="text"
                                                    value={tier.dimensionValue}
                                                    onChange={(e) => updateTier(tier.id, 'dimensionValue', e.target.value)}
                                                    className="ds-control t-input"
                                                    placeholder={matrixDimension === 'week' ? 'e.g. Week 1' : 'e.g. 6-10 Selections'}
                                                />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="field-group">
                                                <Users size={12} className="field-icon" />
                                                <input
                                                    type="text"
                                                    value={tier.segment}
                                                    onChange={(e) => updateTier(tier.id, 'segment', e.target.value)}
 className="ds-control t-input"
 placeholder="All Segments"
                                                />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="field-group highlight">
                                                <input
                                                    type="number"
                                                    value={tier.percentage}
                                                    onChange={(e) => updateTier(tier.id, 'percentage', e.target.value)}
                                                    className="ds-control t-input bold"
                                                />
                                                <span className="suffix">%</span>
                                            </div>
                                        </div>
                                        <div className="col">
                        <div className="field-group">
                          <span className="prefix">{activeCurrency}</span>
                          <input
                            type="text"
                            value={tier.cap}

 onChange={(e) => updateTier(tier.id, 'cap', e.target.value)}
 className="ds-control t-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-action">
                                            <button className="remove-btn" onClick={() => removeTier(tier.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="ds-add-action add-row-btn" onClick={addTier}>
                                <Plus size={14} /> Add Reward Tier
                            </button>

                            <div className="matrix-info">
                                <AlertCircle size={14} /> Rules are evaluated top-to-bottom. First match applies.
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Wagering */}
                {rewardType === 'bonus' && (
                    <div className="form-section mt-8">
                        <label className="ds-section-label">Wagering Requirements</label>
                        <div className="wagering-control">
                            <span className="multiplier">x{wagering}</span>
                            <input type="range" min="0" max="100" value={wagering} onChange={(e) => updateRewards({ wagering: parseInt(e.target.value) })} className="range-slider" />
                        </div>
                        <p className="hint-text">Player must wager bonus amount <strong>{wagering} times</strong> before withdrawing.</p>
                    </div>
                )}

                {rewardType === 'cashback' && (
                    <div className="form-section mt-8">
                        <label className="ds-section-label">Credit Timing</label>
                        <div className="radio-group">
                            <label className="radio-opt">
                                <input type="radio" name="timing" defaultChecked />
                                <span>Instant (After Event)</span>
                            </label>
                            <label className="radio-opt">
                                <input type="radio" name="timing" />
                                <span>End of Day (00:00 UTC)</span>
                            </label>
                            <label className="radio-opt">
                                <input type="radio" name="timing" />
                            <span>Weekly Settlement</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Free Bet / Token Configuration (Aviator Welcome Offer style) */}
            {(rewardType === 'freebets' || rewardType === 'freespins' || rewardType === 'freerounds') && (
                <div className="form-section mt-8">
                    <label className="ds-section-label">Free Bet Configuration</label>
                    <div className="config-box">
                <div className="fb-grid">
                  <div className="fb-field">
                    <label>Target Game</label>
                    <select
                      className="ds-select fb-select"
                      value={freebet.targetGame}
                      onChange={(e) => updateRewards({ freebet: { ...freebet, targetGame: e.target.value } })}
                    >
                      {TARGET_GAMES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <span className="fb-hint">Game the free rounds/spins apply to.</span>
                  </div>
                <div className="fb-field">
                  <label>Unit Value</label>
 <div className="fb-input-wrap ds-control">
 <span className="fb-prefix">{activeCurrency}</span>
 <input type="number" value={freebet.unitValue} onChange={(e) => updateRewards({ freebet: { ...freebet, unitValue: e.target.value } })} />
                  </div>
                  <span className="fb-hint">Value of a single free bet ({activeCurrency}, auto-set by market).</span>
                </div>

                            <div className="fb-field">
                                <label>Quantity Per Award</label>
                                <input className="ds-control" type="number" value={freebet.countPerAward} onChange={(e) => updateRewards({ freebet: { ...freebet, countPerAward: e.target.value } })} />
                                <span className="fb-hint">Free bets granted per qualifying day.</span>
                            </div>
                            <div className="fb-field">
                                <label>Max Total Cap</label>
                                <input className="ds-control" type="number" value={freebet.maxTotalCap} onChange={(e) => updateRewards({ freebet: { ...freebet, maxTotalCap: e.target.value } })} />
                                <span className="fb-hint">Max free bets across the whole offer.</span>
                            </div>
                            <div className="fb-field">
                                <label>Expiry (hours)</label>
                                <input className="ds-control" type="number" value={freebet.expiryHours} onChange={(e) => updateRewards({ freebet: { ...freebet, expiryHours: e.target.value } })} />
                                <span className="fb-hint">Free bets expire this many hours after crediting.</span>
                            </div>
                            <div className="fb-field">
                                <label>Credited By (local time)</label>
                                <input className="ds-control" type="time" value={freebet.creditByTime} onChange={(e) => updateRewards({ freebet: { ...freebet, creditByTime: e.target.value } })} />
                                <span className="fb-hint">Free bets credited the next day by this time.</span>
                            </div>
                            <div className="fb-field toggle-field">
                                <label>Stake Returned On Win?</label>
<label className="ds-switch">
<input type="checkbox" checked={freebet.stakeReturned} onChange={(e) => updateRewards({ freebet: { ...freebet, stakeReturned: e.target.checked } })} />
<span className="ds-switch__track" />
</label>
                                <span className="fb-hint">If off, winnings exclude the free bet stake.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Multi-Day / Repeatable Window */}

            <div className="form-section mt-8">
                <div className="toggle-header">
                    <label className="ds-section-label" style={{ marginBottom: 0 }}>Multi-Day Offer Window</label>
<label className="ds-switch">
<input type="checkbox" checked={multiDay.enabled} onChange={(e) => updateRewards({ multiDay: { ...multiDay, enabled: e.target.checked } })} />
<span className="ds-switch__track" />
</label>
                </div>
                {multiDay.enabled && (
                    <div className="config-box">
                        <div className="fb-grid">
                            <div className="fb-field">
                                <label>Window Length (days)</label>
                                <input className="ds-control" type="number" value={multiDay.windowDays} onChange={(e) => updateRewards({ multiDay: { ...multiDay, windowDays: e.target.value } })} />
                            </div>
                            <div className="fb-field toggle-field">
                                <label>Start From Registration</label>
<label className="ds-switch">
<input type="checkbox" checked={multiDay.startFromRegistration} onChange={(e) => updateRewards({ multiDay: { ...multiDay, startFromRegistration: e.target.checked } })} />
<span className="ds-switch__track" />
</label>
                                <span className="fb-hint">Day 1 = player registration day.</span>
                            </div>
                            <div className="fb-field toggle-field">
                                <label>Non-Consecutive Days</label>
<label className="ds-switch">
<input type="checkbox" checked={multiDay.nonConsecutive} onChange={(e) => updateRewards({ multiDay: { ...multiDay, nonConsecutive: e.target.checked } })} />
<span className="ds-switch__track" />
</label>
                                <span className="fb-hint">Player may qualify on any subset of days.</span>
                            </div>
                            <div className="fb-field toggle-field">
                                <label>New Customers Only</label>
<label className="ds-switch">
<input type="checkbox" checked={multiDay.newCustomersOnly} onChange={(e) => updateRewards({ multiDay: { ...multiDay, newCustomersOnly: e.target.checked } })} />
<span className="ds-switch__track" />
</label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>


            <style jsx>{`
                .step-container { max-width: 900px; margin: 0 auto; animation: slideIn 0.3s ease-out; }
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.form-panel { padding: 32px; }
.panel-title { margin: 0 0 4px; color: var(--color-text-primary); font-size: 20px; font-weight: 600; line-height: 1.3; }

                /* Validation Warning */
                .validation-warning { background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px; animation: keyframe 0.3s ease; }
                .vw-header { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #f87171; margin-bottom: 8px; font-size: 14px; }
                .vw-list { margin: 0; padding-left: 24px; color: #fecaca; font-size: 13px; }
                .vw-list li { margin-bottom: 4px; }
                
                .text-warning { color: #f87171; }

/* Reward grid follows the promotion-type global choice pattern. */
.rewards-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 32px; }
.reward-card { display: flex; min-height: 107px; flex-direction: column; align-items: flex-start; gap: 6px; overflow: hidden; padding: 16px; color: var(--color-text-primary); cursor: pointer; text-align: left; }
.type-radio { position: relative; width: 16px; height: 16px; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 50%; }
.type-radio.is-selected { border: 2px solid #008e00; }
.type-radio.is-selected::after { position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; border-radius: 50%; background: #008e00; content: ''; transform: translate(-50%, -50%); }
.type-name { color: var(--color-text-primary); font-size: 14px; font-weight: 500; line-height: 1.25; }
.type-desc { color: var(--color-text-muted); font-size: 12px; font-weight: 400; line-height: 1.35; }

                /* Config Box */
                .config-box { background: var(--color-bg-input); border-radius: 12px; border: 1px solid var(--color-border); padding: 24px; }
                .config-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .sub-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }

                .toggle-group { display: flex; background: var(--color-bg-card); padding: 4px; border-radius: 8px; }
 .toggle-btn { color: var(--color-text-muted); padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; }
 .toggle-btn.is-selected { background: var(--ds-surface-selected); border-color: var(--ds-accent); color: var(--color-text-primary); }

                /* Simple Mode */
                .value-inputs { display: flex; align-items: center; justify-content: space-between; }
                .input-col label { display: block; font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
                .arrow-col { display: flex; align-items: center; justify-content: center; padding-top: 24px; }
                
                .big-input-wrapper { display: flex; align-items: center; padding: 0 16px; width: 220px; }
                .big-input { background: transparent; border: none; color: var(--color-text-primary); font-size: 32px; font-weight: 700; width: 100%; padding: 16px 0; outline: none; text-align: right; }
                .suffix { font-size: 24px; color: var(--color-text-muted); font-weight: 600; margin-left: 8px; }
                .prefix { font-size: 24px; color: var(--color-text-muted); font-weight: 600; margin-right: 8px; }

                /* Tiered Matrix */
                .tiered-matrix { display: flex; flex-direction: column; gap: 8px; }
                
                .matrix-toolbar { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 11px; color: var(--color-text-muted); }
                .pill-selector { background: var(--color-bg-app); border-radius: 20px; padding: 2px; display: flex; }
 .pill { padding: 4px 12px; border-radius: 18px; font-size: 11px; color: var(--color-text-muted); cursor: pointer; }
 .pill.is-selected { background: var(--ds-accent); border-color: var(--ds-accent); color: #000; font-weight: 600; }

                .matrix-header { display: flex; padding: 0 12px; margin-bottom: 4px; }
                .col { flex: 1; font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; padding-right: 8px; }
                .col-action { width: 30px; }
                
                .matrix-row { display: flex; align-items: center; gap: 8px; background: var(--color-bg-card); border: 1px solid var(--color-border); padding: 8px 12px; border-radius: 8px; transition: all 0.2s; }
                .matrix-row:hover { background: var(--color-bg-input-focus); border-color: var(--color-border-hover); }
                
                .field-group { display: flex; align-items: center; gap: 8px; background: var(--color-bg-input); padding: 6px 10px; border-radius: 6px; width: 100%; border: 1px solid transparent; }
 .field-group:focus-within { border-color: var(--ds-accent); background: rgba(242, 214, 65, 0.05); }
 .field-group.highlight { background: rgba(242, 214, 65, 0.1); border-color: rgba(242, 214, 65, 0.2); }

 .field-icon { opacity: 0.5; color: var(--color-text-primary); }
 .t-input { color: var(--color-text-primary); font-size: 13px; width: 100%; }
 .t-input.bold { font-weight: 700; color: var(--ds-accent); }
                .t-select { background: transparent; border: none; color: var(--color-text-primary); font-size: 13px; width: 100%; outline: none; cursor: pointer; }
                .t-select option { background: var(--color-bg-panel); color : var(--color-text-primary) }
                
                .remove-btn { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; }
                .remove-btn:hover { color: #f87171; }
                
 .add-row-btn { padding: 10px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; }
                
                .matrix-info { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 11px; color: var(--color-text-muted); font-style: italic; }

                /* Radio options */
                .radio-group { display: flex; gap: 24px; }
                .radio-opt { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--color-text-secondary); font-size: 13px; }
                .radio-opt input { accent-color: var(--ds-accent); }

                /* Free Bet / Qualifying / Multi-Day config grids */
                .fb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .fb-field { display: flex; flex-direction: column; gap: 8px; }
                .fb-field > label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
 .fb-field input[type="number"]:not(.ds-control), .fb-field input[type="text"]:not(.ds-control), .fb-field input[type="time"]:not(.ds-control) {
 background: var(--color-bg-card);
 border: 1px solid var(--color-border);
 color: var(--color-text-primary);
 padding: 10px 12px;
 border-radius: 8px;
 font-size: 14px;
 outline: none;
 transition: all 0.2s;
 }
 .fb-select { cursor: pointer; font-size: 14px; }
        .fb-select option { background: var(--color-bg-panel); color: var(--color-text-primary); }
 .fb-input-wrap { display: flex; align-items: center; padding: 0 12px; }
 .fb-input-wrap:focus-within { border-color: var(--ds-accent); box-shadow: 0 0 0 1px var(--ds-accent); }
                .fb-input-wrap input { border: none !important; box-shadow: none !important; background: transparent !important; padding: 10px 0 !important; flex: 1; }
                .fb-prefix { font-size: 13px; font-weight: 600; color: var(--color-text-muted); margin-right: 8px; }
                .fb-hint { font-size: 11px; color: var(--color-text-muted); line-height: 1.4; }

                .toggle-field { justify-content: flex-start; }
                .toggle-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }

 .mt-8 { margin-top: 32px; }

@media (max-width: 720px) {
.form-panel { padding: 24px; }
.rewards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 440px) {
.form-panel { padding: 20px; }
.rewards-grid { grid-template-columns: 1fr; }
}

/* Template guidance layout; notice visuals are supplied by the global design system. */
.template-guidance { align-items: flex-start; margin-bottom: 24px; }
.tg-content { min-width: 0; }
.tg-title { margin: 1px 0 8px; font-size: 13px; font-weight: 700; }
.tg-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tg-chip { padding: 3px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.16); color: inherit; font-size: 12px; }
.tg-hint { margin: 10px 0 0; color: inherit; font-size: 12px; line-height: 1.4; opacity: 0.76; }

 `}</style>

        </div>
    );
}
