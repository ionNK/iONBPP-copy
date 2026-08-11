'use client';
import { Type, AlignLeft, Search, Target, Zap, Gift, Route, LayoutTemplate } from 'lucide-react';
import { useState } from 'react';
import { useWizardContext } from '@/context/WizardContext';
import { useTemplates } from '@/context/TemplatesContext';
import { getTemplateMeta } from '@/data/promotionTemplates';
import { features } from '@/config/features';


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
<div className="wizard-basics step-container">
 <div className="form-panel ds-panel">
 <h2 className="panel-title">Basic Information</h2>

 {features.promoTemplatesLegacy && templates.length > 0 && (
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
              <p className="field-error type-error ds-error" role="alert">{fieldErrors.type}</p>
            )}
            <div className="input-wrapper type-search ds-control">

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

</div>
    )
}
