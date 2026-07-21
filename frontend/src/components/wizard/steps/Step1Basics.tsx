'use client';
import { Type, AlignLeft, Search, Target, Zap, Gift, Route, LayoutTemplate } from 'lucide-react';
import { useState } from 'react';
import { useWizardContext } from '@/context/WizardContext';
import { useTemplates } from '@/context/TemplatesContext';
import { getTemplateMeta } from '@/data/promotionTemplates';


export default function StepBasics() {
 const { state, updateBasics, loadPromotion, fieldErrors, clearFieldError } = useWizardContext();
 const { templates } = useTemplates();
 const { name, description, type } = state.basics;
 const [query, setQuery] = useState('');
 const [showTemplates, setShowTemplates] = useState(false);
 const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);




const PROMOTION_TYPES = [
 { id: 'welcome_bonus', icon: '🎉', label: 'Welcome Bonus', pop: true, desc: 'Acquire & activate new customers.' },
 { id: 'deposit_match', icon: '💰', label: 'Deposit Match Bonuses', pop: true, desc: 'Match a percentage of a deposit.' },
 { id: 'bet_get', icon: '🎁', label: 'Bet & Get', pop: true, desc: 'Place a bet, get a free bet or bonus.' },
 { id: 'free_bets', icon: '🎟️', label: 'Free Bets', pop: true, desc: 'Issue free bets to qualifying customers.' },
 { id: 'aviator_free_rounds', icon: '✈️', label: 'Aviator Free Rounds', pop: true, desc: 'Drop free rounds to active Aviator players.' },
 { id: 'cashback', icon: '💸', label: 'Cashback', pop: true, desc: 'Return part of losses or stake as bonus.' },
 { id: 'acca_insurance', icon: '🛡️', label: 'Stakeback / Acca Insurance', pop: true, desc: 'Refunds an acca when one leg fails.' },
 { id: 'manual_bulk', icon: '🧾', label: 'Manual / Bulk Awards', pop: true, desc: 'Grant goodwill, VIP or correction rewards.' },
 { id: 'multiple_bonus', icon: '⚡', label: 'Multiple Bonus', desc: 'Bonus for qualifying multiple/acca bets.' },
 { id: 'odds_boosts', icon: '🚀', label: 'Odds Boosts', desc: 'Boost odds on selected bets or markets.' },
 { id: 'enhanced_odds', icon: '📈', label: 'Enhanced Odds', desc: 'Improved odds on selected markets.' },
 { id: 'bet_streaks', icon: '🔥', label: 'Bet Streaks', desc: 'Reward consecutive qualifying bets.' },
 { id: 'reload_bonus', icon: '🔄', label: 'Reload Bonuses', desc: 'Bonus on a repeat deposit.' },
 { id: 'tournament', icon: '🏆', label: 'Tournament-Specific', desc: 'Offers tied to a tournament or competition.' },
 { id: 'event_based', icon: '📅', label: 'Event-Based', desc: 'Rewards linked to specific events.' },
 { id: 'personalised', icon: '🎯', label: 'Personalised / Targeted', desc: 'Offers tailored to segments or individuals.' },
 { id: 'reactivation', icon: '♻️', label: 'Reactivation Offers', desc: 'Win back inactive or lapsed customers.' },
 { id: 'leaderboards', icon: '🥇', label: 'Leaderboards', desc: 'Ranked competition on points or stakes.' },
 { id: 'referral', icon: '🤝', label: 'Referral Bonuses', desc: 'Reward customers who refer new players.' },
 { id: 'birthday', icon: '🎂', label: 'Birthday Bonuses', desc: 'Reward customers on their birthday.' },
 { id: 'live_betting', icon: '📡', label: 'Live Betting', desc: 'Rewards for in-play betting activity.' },
 { id: 'happy_hour', icon: '⏰', label: 'Price Boost Happy Hours', desc: 'Boosted pricing in a time window.' },
 { id: 'bet_builder', icon: '🧩', label: 'Combo / Bet Builder', desc: 'Offers for combo or bet builder bets.' },
 { id: 'insurance', icon: '🛟', label: 'Insurance (Markets/Events)', desc: 'Insurance on defined markets or events.' },
 { id: 'retention', icon: '📉', label: 'Retention / Churn Prevention', desc: 'Bonuses to reduce churn risk.' },
 { id: 'channel_specific', icon: '📱', label: 'Channel-Specific', desc: 'Offers restricted to a specific channel.' },
];


    return (
        <div className="step-container">
 <div className="form-panel ds-panel">
 <h2 className="panel-title">Basic Information</h2>

 {templates.length > 0 && (
 <div className="template-picker ds-add-action">
 <button
 type="button"
 className="tp-header"
 onClick={() => setShowTemplates((visible) => !visible)}
 aria-expanded={showTemplates}
 aria-controls="saved-promotion-templates"
 >
 <LayoutTemplate size={16} className="tp-icon" />
 <span>{showTemplates ? 'Hide saved templates' : 'Use a saved template'}</span>
 </button>
 {showTemplates && (
 <div id="saved-promotion-templates" className="tp-list" role="region" aria-label="Saved promotion templates">
 {templates.map((tpl) => (
 <button
 key={tpl.id}
 type="button"
 className={`tp-card ${selectedTemplateId === tpl.id ? 'active' : ''}`}
 onClick={() => {
 setSelectedTemplateId(tpl.id);
 loadPromotion(tpl.payload);
 }}
 title={tpl.description || `Load "${tpl.name}"`}
 >
 <span className={`type-radio ${selectedTemplateId === tpl.id ? 'is-selected' : ''}`} aria-label={selectedTemplateId === tpl.id ? 'Selected' : undefined} />
 <span className="tp-name">{tpl.name}</span>
 {tpl.description && <span className="tp-desc">{tpl.description}</span>}
 <span className="tp-meta">{tpl.basedOnType?.replace(/_/g, ' ')}{tpl.market ? ` · ${tpl.market}` : ''}</span>
 </button>
 ))}
 </div>
 )}
 </div>
 )}

 <div className="input-group">

          <label htmlFor="promo-name">Promotion Name</label>
          <div className={`input-wrapper ds-control ${fieldErrors.name ? 'has-error' : ''}`}>
            <Type size={18} className="icon" />
            <input
              id="promo-name"
              type="text"
              placeholder="e.g. Welcome Bonus 2024"
              className="form-input"
              value={name}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'promo-name-error' : undefined}
              onChange={(e) => {
                updateBasics({ name: e.target.value });
                if (fieldErrors.name) clearFieldError('name');
              }}
            />
          </div>
          {fieldErrors.name && (
            <p className="field-error ds-error" id="promo-name-error" role="alert">{fieldErrors.name}</p>
          )}
        </div>


                <div className="input-group">
                    <label>Description (Internal)</label>
 <div className="input-wrapper ds-control">
 <AlignLeft size={18} className="icon" />
                        <textarea
                            placeholder="Description for internal team..."
                            className="form-input"
                            rows={3}
                            value={description}
                            onChange={(e) => updateBasics({ description: e.target.value })}
                        ></textarea>
                    </div>
                </div>

          <div className="input-group">
            <label>Promotion Type</label>
            {fieldErrors.type && (
              <p className="field-error ds-error" role="alert" style={{ marginTop: 0, marginBottom: 12 }}>{fieldErrors.type}</p>
            )}
            <div className="input-wrapper ds-control" style={{ marginBottom: 16 }}>

      <Search size={18} className="icon" />
      <input
       type="text"
       placeholder="Search promotion types..."
       className="form-input"
       value={query}
       onChange={(e) => setQuery(e.target.value)}
      />
     </div>
     <div className="type-grid">
      {[...PROMOTION_TYPES]
       .filter((t) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
       })
       .sort((a, b) => {
        const P = ['welcome_bonus', 'deposit_match', 'bet_get', 'free_bets', 'aviator_free_rounds', 'cashback', 'acca_insurance', 'manual_bulk'];
        const ai = P.indexOf(a.id);
        const bi = P.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
       })
       .map((t) => (
<div
key={t.id}
 className={`type-card ds-choice ${type === t.id ? 'active is-selected' : ''}`}
onClick={() => updateBasics({ type: t.id })}
>
<span className={`type-radio ${type === t.id ? 'is-selected' : ''}`} aria-label={type === t.id ? 'Selected' : undefined} />
<span className="type-icon">{t.icon}</span>
<span className="type-name">{t.label}</span>
<div className="type-desc">{t.desc}</div>
 </div>
 ))}
 </div>

 {(() => {
 const meta = getTemplateMeta(type);
 if (!meta) return null;
 return (
 <div className="template-summary ds-hint" role="region" aria-label="Template details">
 <div className="ts-row"><Target size={16} className="ts-icon" /><div><span className="ts-label">Purpose</span><p className="ts-text">{meta.purpose}</p></div></div>
 <div className="ts-row"><Zap size={16} className="ts-icon" /><div><span className="ts-label">Trigger</span><p className="ts-text">{meta.trigger}</p></div></div>
 <div className="ts-row"><Gift size={16} className="ts-icon" /><div><span className="ts-label">Allowed rewards</span><div className="ts-chips">{meta.allowedRewards.map((r) => (<span key={r} className="ts-chip">{r}</span>))}</div></div></div>
 <div className="ts-row"><Route size={16} className="ts-icon" /><div><span className="ts-label">Customer journey</span><p className="ts-text">{meta.journey}</p></div></div>
 </div>
 );
 })()}
 </div>



            </div>

<style jsx>{`
.step-container { max-width: 900px; margin: 0 auto; animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.form-panel {
padding: 32px;
}
.panel-title { margin: 0 0 4px; color: var(--color-text-primary); font-size: 20px; font-weight: 600; line-height: 1.3; }
.panel-title::after { content: 'Name the promotion and choose how customers are rewarded.'; display: block; margin-top: 4px; color: var(--color-text-muted); font-size: 14px; font-weight: 400; }

.input-group { margin-top: 24px; margin-bottom: 0; }
.input-group label { display: block; margin-bottom: 8px; color: var(--color-text-primary); font-size: 14px; font-weight: 500; }

/* Saved template picker */
.template-picker { margin-top: 24px; margin-bottom: 0; border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 8px; background: rgba(255, 255, 255, 0.025); }
.tp-header { width: 100%; display: flex; align-items: center; gap: 8px; padding: 12px 14px; border: 0; background: transparent; color: var(--color-text-secondary); cursor: pointer; font: inherit; font-size: 13px; font-weight: 500; text-align: left; }
.tp-header:hover { color: var(--color-text-primary); }
.tp-icon { color: var(--color-betika-yellow); }
.tp-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding: 0 14px 14px; }
 .tp-card { display: flex; min-height: 107px; min-width: 0; flex-direction: column; align-items: flex-start; gap: 6px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; background: rgba(255, 255, 255, 0.05); cursor: pointer; text-align: left; transition: background-color 0.2s ease, border-color 0.2s ease; }
 .tp-card:hover { background: rgba(255, 255, 255, 0.08); }
 .tp-card.active { padding: 16px; border: 2px solid var(--color-betika-yellow); background: rgba(255, 255, 255, 0.1); }
.tp-name { color: var(--color-text-primary); font-size: 13px; font-weight: 600; }
.tp-desc { max-width: 100%; overflow: hidden; color: var(--color-text-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.tp-meta { margin-top: 2px; color: var(--color-text-muted); font-size: 10px; text-transform: capitalize; }

.input-wrapper { position: relative; display: flex; align-items: center; min-height: 48px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; background: rgba(255, 255, 255, 0.05); transition: border-color 0.2s ease, background-color 0.2s ease; }
.icon { margin-left: 14px; color: var(--color-text-muted); }
.form-input { width: 100%; padding: 12px 14px; border: none; outline: none; background: transparent; color: var(--color-text-primary); font-family: inherit; font-size: 15px; line-height: 1.4; }
textarea.form-input { align-self: stretch; min-height: 96px; resize: vertical; }
.input-wrapper:focus-within { border-color: rgba(255, 222, 36, 0.8); background: rgba(255, 255, 255, 0.07); }
.input-wrapper.has-error { border-color: #ef4444; }
.input-wrapper.has-error:focus-within { border-color: #ef4444; box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.35); }
.field-error { margin: 6px 0 0 2px; color: #ef4444; font-size: 12px; }

.type-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.type-card { position: relative; display: flex; min-height: 107px; flex-direction: column; align-items: flex-start; gap: 6px; overflow: hidden; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; background: rgba(255, 255, 255, 0.05); color: var(--color-text-primary); cursor: pointer; text-align: left; transition: background-color 0.2s ease, border-color 0.2s ease; }
.type-card:hover { background: rgba(255, 255, 255, 0.08); }
.type-card.active { padding: 16px; border: 2px solid var(--color-betika-yellow); background: rgba(255, 255, 255, 0.1); box-shadow: none; color: var(--color-text-primary); }
 .type-radio { position: relative; width: 16px; height: 16px; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 50%; }
 .type-radio.is-selected { border: 2px solid #008e00; }
 .type-radio.is-selected::after { content: ''; position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; border-radius: 50%; background: #008e00; transform: translate(-50%, -50%); }
.type-icon { display: none; }
.type-name { color: var(--color-text-primary); font-size: 14px; font-weight: 500; line-height: 1.25; }
.type-desc { color: var(--color-text-muted); font-size: 12px; font-weight: 400; line-height: 1.35; }

.template-summary { display: flex; flex-direction: column; gap: 14px; margin-top: 20px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; background: rgba(255, 255, 255, 0.05); }
.ts-row { display: flex; gap: 12px; align-items: flex-start; }
.ts-icon { flex-shrink: 0; margin-top: 2px; color: var(--color-betika-yellow); }
.ts-label { display: block; margin-bottom: 2px; color: var(--color-text-muted); font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; }
.ts-text { margin: 0; color: var(--color-text-primary); font-size: 13px; line-height: 1.4; }
.ts-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ts-chip { padding: 3px 10px; border: 1px solid rgba(242, 214, 65, 0.3); border-radius: 999px; background: rgba(242, 214, 65, 0.12); color: var(--color-betika-yellow); font-size: 12px; }

@media (max-width: 720px) {
.form-panel { padding: 24px; }
.type-grid, .tp-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 440px) {
.form-panel { padding: 20px; }
.type-grid, .tp-list { grid-template-columns: 1fr; }
}
`}</style>

        </div>
    )
}
