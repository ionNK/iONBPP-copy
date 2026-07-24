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
        <div className="step-container wizard-review">
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
        </div>
    );
}
