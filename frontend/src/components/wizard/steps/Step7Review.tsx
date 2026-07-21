'use client';
import { CheckCircle2, Gift } from 'lucide-react';
import { useWizardContext } from '@/context/WizardContext';

interface StepReviewProps {
    onEdit: (step: number) => void;
}

export default function StepReview({ onEdit }: StepReviewProps) {
const { state } = useWizardContext();
const { basics, eligibility, rewards, schedule, display } = state;
const plannedGoLive = schedule.startDate
? new Date(schedule.startDate).toLocaleDateString()
: 'a date to be scheduled';

return (
        <div className="step-container">
            <div className="review-layout">

{/* Pre-flight Check Banner */}
<div className="ds-notice ds-notice--success" role="status" aria-live="polite">
<span className="ds-notice__icon" aria-hidden="true">
<CheckCircle2 size={14} />
</span>
<div className="review-notice-content">
<strong>All checks passed</strong>
<span>Promotion is ready to go live on {plannedGoLive}.</span>
</div>
</div>

                <div className="summary-grid" role="region" aria-label="Promotion Summary Overview">

 {/* 1. Basics */}
 <div className="summary-card" role="article" aria-label="1. General Info Summary">
                        <div className="card-header">
                            <div className="header-left">
                                <span className="step-num" aria-hidden="true">01</span>
                                <h4>General Info</h4>
                            </div>
                            <button className="edit-link" onClick={() => onEdit(1)}>Edit</button>
                        </div>
                        <div className="card-body">
                            <div className="data-row">
                                <span className="label">Name</span>
                                <span className="value">{basics.name || 'Untitled Promotion'}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Type</span>
                                <span className="value text-yellow" style={{ textTransform: 'capitalize' }}>{(basics.type || '').replace('_', ' ') || 'Not set'}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Tags</span>
                                <div className="tags"><span className="tag">Retention</span><span className="tag">Sports</span></div>
                            </div>
                        </div>
                    </div>

 {/* 2. Scope */}
 <div className="summary-card" role="article" aria-label="2. Scope & Target Summary">
                        <div className="card-header">
                            <div className="header-left">
                                <span className="step-num" aria-hidden="true">02</span>
                                <h4>Scope & Target</h4>
                            </div>
                            <button className="edit-link" onClick={() => onEdit(2)}>Edit</button>
                        </div>
                        <div className="card-body">
                            <div className="data-row">
                                <span className="label">Markets</span>
                                <div className="value">
                                    {eligibility.markets.map(m => m.toUpperCase()).join(', ')}
                                </div>
                            </div>
                            <div className="data-row">
                                <span className="label">Platforms</span>
                                <span className="value" style={{ textTransform: 'capitalize' }}>
                                    {eligibility.channels.join(', ')}
                                </span>
                            </div>
                            <div className="data-row">
                                <span className="label">Audience</span>
                                <span className="value" style={{ textTransform: 'capitalize' }}>{eligibility.segment}</span>
                            </div>
                        </div>
                    </div>

 {/* 3. Mechanics */}
 <div className="summary-card" role="article" aria-label="3. Qualification Rules Summary">
                        <div className="card-header">
                            <div className="header-left">
                                <span className="step-num" aria-hidden="true">03</span>
                                <h4>Qualification Rules</h4>
                            </div>
                            <button className="edit-link" onClick={() => onEdit(3)}>Edit</button>
                        </div>
                        <div className="card-body">
                            {eligibility.triggers.length > 0 ? (
                                <div className="rule-engine-preview">
                                    {eligibility.triggers.map((t, i) => (
                                        <div key={t.id} className="trigger-group">
                                            {i > 0 && <div className="rule-connector">OR</div>}
                                            <div className="trigger-header">
                                                <span className="type-label">EVENT</span>
                                                <span className="event-id">{t.eventId}</span>
                                            </div>
                                            <div className="rule-list">
                                                {t.rules.map(r => (
                                                    <div key={r.id} className="rule-item">
                                                        <span className="rule-op">IF</span>
                                                        <span className="rule-param">{r.param}</span>
                                                        <span className="rule-sign">{r.operator}</span>
                                                        <span className="rule-val">{r.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rule-preview">No rules configured.</div>
                            )}
                        </div>
                    </div>

 {/* 4. Rewards */}
 <div className="summary-card" role="article" aria-label="4. Incentives Summary">
                        <div className="card-header">
                            <div className="header-left">
                                <span className="step-num" aria-hidden="true">04</span>
                                <h4>Incentives</h4>
                            </div>
                            <button className="edit-link" onClick={() => onEdit(4)}>Edit</button>
                        </div>
                        <div className="card-body">
                            <div className="reward-highlight">
                                <Gift size={20} className="text-yellow" />
                                <span style={{ textTransform: 'capitalize' }}>{rewards.type}</span>
                            </div>
                            {rewards.calcType === 'tiered' && rewards.tiers.length > 0 && (
                                <div className="mt-4">
                                    {rewards.tiers.slice(0, 3).map(t => (
                                        <div key={t.id} className="data-row">
                                            <span className="label">{t.dimensionValue}</span>
                                            <span className="value">{t.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {rewards.calcType === 'simple' && (
                                <div className="data-row mt-4">
                                    <span className="label">Match</span>
                                    <span className="value">{rewards.simpleConfig.percentage}%</span>
                                </div>
                            )}
                        </div>
                    </div>

 {/* 5. Schedule */}
 <div className="summary-card" role="article" aria-label="5. Schedule Summary">
                        <div className="card-header">
                            <div className="header-left">
                                <span className="step-num" aria-hidden="true">05</span>
                                <h4>Schedule</h4>
                            </div>
                            <button className="edit-link" onClick={() => onEdit(5)}>Edit</button>
                        </div>
                        <div className="card-body">
                            <div className="data-row">
                                <span className="label">Start</span>
                                <span className="value">{schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Duration</span>
                                <span className="value">{schedule.isRecurring ? `Recurring (${schedule.recurrence.frequency})` : 'Fixed Period'}</span>
                            </div>
                        </div>
                    </div>

 {/* 6a. Display & Content */}
 <div className="summary-card" role="article" aria-label="6. Display & Content Summary">
                        <div className="card-header">
                            <div className="header-left">
                                <span className="step-num" aria-hidden="true">06</span>
                                <h4>Display & Content</h4>
                            </div>
                            <button className="edit-link" onClick={() => onEdit(6)}>Edit</button>
                        </div>
                        <div className="card-body">
                            <div className="data-row">
                                <span className="label">Title</span>
                                <span className="value">{display.title || 'Untitled'}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Teaser</span>
                                <span className="value text-xs">{display.teaser || 'No teaser'}</span>
                            </div>
                            {display.bannerImage && (
                                <div className="mt-4 banner-thumb-area">
                                    <img src={display.bannerImage} alt="Banner" className="banner-thumb" />
                                </div>
                            )}
                        </div>
                    </div>

 {/* 6b. Communication */}
 <div className="summary-card" role="article" aria-label="7. Communication Summary">
                        <div className="card-header">
                            <div className="header-left">
                                <span className="step-num" aria-hidden="true">07</span>
                                <h4>Communication</h4>
                            </div>
                            <button className="edit-link" onClick={() => onEdit(6)}>Edit</button>
                        </div>
                        <div className="card-body">
                            <div className="data-row">
                                <span className="label">Channels</span>
                                <span className="value">
                                    {[
                                        display.communication.smsEnabled && 'SMS',
                                        display.communication.pushEnabled && 'Push'
                                    ].filter(Boolean).join(', ') || 'None'}
                                </span>
                            </div>
                            {display.communication.smsEnabled && (
                                <div className="data-row">
                                    <span className="label">SMS Template</span>
                                    <span className="value text-xs">"{display.communication.smsTemplate}"</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                <div className="confirmation-area">
                    <label className="checkbox-container">
                        <input type="checkbox" defaultChecked />
                        <span className="check-text">I confirm that all configuration is correct and approved by the Finance/Compliance team.</span>
                    </label>
                </div>
            </div>

            <style jsx>{`
                .step-container { max-width: 1000px; margin: 0 auto; animation: slideIn 0.3s ease-out; padding-bottom: 40px; }
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.ds-notice {
margin-bottom: 32px;
}

.review-notice-content {
display: flex;
flex-wrap: wrap;
align-items: baseline;
gap: 4px 8px;
}

.review-notice-content strong {
font-size: 13px;
}

.review-notice-content span {
font-size: 12px;
}

.summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .summary-card { padding: 20px; border-radius: 12px; height: 100%; display: flex; flex-direction: column; background: var(--ds-surface-raised); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); }
                .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; }
                .header-left { display: flex; align-items: center; gap: 12px; }
                .edit-link { font-size: 11px; font-weight: 600; color: var(--color-betika-green); background: transparent; border: none; cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: all 0.2s; }
                .edit-link:hover { background: rgba(105, 153, 81, 0.1); text-decoration: underline; }
                
                .step-num { font-size: 10px; font-weight: 700; color: var(--color-bg-app); background: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; }
                .card-header h4 { margin: 0; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }

                .card-body { font-size: 13px; display: flex; flex-direction: column; gap: 12px; }
                .data-row { display: flex; justify-content: space-between; align-items: center; }
                .label { color: var(--color-text-muted); }
                .value { color: var(--color-text-primary); font-weight: 500; text-align: right; }
                .text-yellow { color: var(--color-betika-yellow); }
                .text-xs { font-size: 11px; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .tags { display: flex; gap: 4px; }
                .tag { font-size: 10px; background: var(--color-bg-input); padding: 2px 6px; border-radius: 4px; color: var(--color-text-secondary); }

                /* Rule Engine Preview */
                .rule-engine-preview { display: flex; flex-direction: column; gap: 12px; }
                .trigger-group { background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 8px; padding: 12px; }
                .trigger-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
                .type-label { font-size: 9px; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; }
                .event-id { font-size: 11px; font-weight: 700; color: var(--color-accent-cyan); background: rgba(6, 182, 212, 0.1); padding: 2px 6px; border-radius: 4px; }
                .rule-list { display: flex; flex-direction: column; gap: 4px; padding-left: 8px; border-left: 2px solid var(--color-border); }
                .rule-item { display: flex; align-items: center; gap: 6px; font-size: 11px; font-family: monospace; }
                .rule-op { color: var(--color-text-muted); font-weight: 700; font-size: 9px; }
                .rule-param { color: var(--color-accent-purple); font-weight: 600; }
                .rule-sign { color: var(--color-text-primary); font-weight: 800; }
                .rule-val { color: var(--color-betika-yellow); font-weight: 700; }
                .rule-connector { font-size: 9px; font-weight: 900; color: var(--color-betika-yellow); text-align: center; margin: 4px 0; letter-spacing: 1px; }

                /* Reward */
                .reward-highlight { display: flex; gap: 12px; align-items: center; font-size: 14px; font-weight: 700; color: var(--color-text-primary); background: var(--color-bg-input); padding: 12px; border-radius: 8px; justify-content: center; border: 1px solid var(--color-border); }
                .mt-4 { margin-top: 16px; }
                
                .banner-thumb-area { width: 100%; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border); background: var(--color-bg-input); }
                .banner-thumb { width: 100%; height: 100%; object-fit: cover; }

                .confirmation-area { display: flex; justify-content: center; margin-top: 16px; }
                .checkbox-container { display: flex; gap: 12px; align-items: center; cursor: pointer; }
                .check-text { font-size: 14px; color: var(--color-text-secondary); }
            `}</style>
        </div>
    );
}
