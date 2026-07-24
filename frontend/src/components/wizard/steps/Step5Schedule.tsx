'use client';

import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  Repeat,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useWizardContext } from '@/context/WizardContext';

const RECURRENCE_OPTIONS = ['Daily', 'Weekly', 'Monthly'];
const WEEK_DAYS = [
  { key: 'monday', label: 'M' },
  { key: 'tuesday', label: 'T' },
  { key: 'wednesday', label: 'W' },
  { key: 'thursday', label: 'T' },
  { key: 'friday', label: 'F' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'S' },
];

export default function StepSchedule() {
  const { state, updateSchedule } = useWizardContext();
  const { startDate, endDate, isRecurring, recurrence, limits } = state.schedule;
  const [isFrequencyOpen, setIsFrequencyOpen] = useState(false);
  const frequencyRef = useRef<HTMLDivElement>(null);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const hasValidSchedule = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
  const durationInDays = hasValidSchedule
    ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  useEffect(() => {
    const closeFrequencyMenu = (event: MouseEvent) => {
      if (!frequencyRef.current?.contains(event.target as Node)) {
        setIsFrequencyOpen(false);
      }
    };

    document.addEventListener('mousedown', closeFrequencyMenu);
    return () => document.removeEventListener('mousedown', closeFrequencyMenu);
  }, []);

const toggleRecurring = () => updateSchedule({ isRecurring: !isRecurring });

const toggleActiveDay = (day: string) => {
const selectedDays = recurrence.days.includes(day)
? recurrence.days.filter((selectedDay) => selectedDay !== day)
: [...recurrence.days, day];

updateSchedule({ recurrence: { ...recurrence, days: selectedDays } });
};

return (
<div className="wizard-schedule step-container">
      <section className="ds-panel form-panel schedule-panel" aria-labelledby="schedule-title">
        <div className="schedule-heading">
          <div>
            <p className="eyebrow">Promotion availability</p>
            <h2 id="schedule-title" className="panel-title">Schedule &amp; Limits</h2>
            <p className="panel-subtitle">
              Set when the promotion is available and protect your campaign with usage controls.
            </p>
          </div>
        </div>

        <section className="form-section" aria-labelledby="duration-label">
          <div className="section-heading">
            <span className="section-icon"><Calendar size={16} aria-hidden="true" /></span>
            <div>
              <h3 id="duration-label" className="section-label">Campaign duration</h3>
              <p>Choose the start and end date for this promotion.</p>
            </div>
          </div>

          <div className="date-grid">
            <div className="input-group">
              <label htmlFor="promotion-start">Start date &amp; time</label>
              <input
                id="promotion-start"
                type="datetime-local"
                className="ds-control form-input"
                value={startDate}
                onChange={(event) => updateSchedule({ startDate: event.target.value })}
              />
            </div>

            <div className="date-connector" aria-hidden="true">→</div>

            <div className="input-group">
              <label htmlFor="promotion-end">End date &amp; time</label>
              <input
                id="promotion-end"
                type="datetime-local"
                className="ds-control form-input"
                value={endDate}
                onChange={(event) => updateSchedule({ endDate: event.target.value })}
              />
            </div>
          </div>

          <button
            type="button"
            className={`ds-choice recurring-toggle ${isRecurring ? 'is-selected' : ''}`}
            onClick={toggleRecurring}
            aria-pressed={isRecurring}
          >
            <span className="schedule-checkbox" aria-hidden="true">
              {isRecurring && <Check size={14} strokeWidth={3} />}
            </span>
            <span className="recurrence-copy">
              <span>Recurring promotion</span>
              <small>Repeat this promotion on a regular schedule.</small>
            </span>
            <Repeat size={18} className="recurrence-icon" aria-hidden="true" />
          </button>

          {isRecurring && (
            <div className="recurrence-options">
              <div className="input-group frequency-field" ref={frequencyRef}>
                <label id="recurrence-frequency-label">Repeat frequency</label>
                <button
                  type="button"
                  className={`ds-control frequency-trigger ${isFrequencyOpen ? 'open' : ''}`}
                  onClick={() => setIsFrequencyOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={isFrequencyOpen}
                  aria-labelledby="recurrence-frequency-label"
                >
                  <span>{recurrence.frequency}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {isFrequencyOpen && (
                  <div className="ds-dropdown-menu frequency-menu" role="listbox" aria-label="Repeat frequency">
                    {RECURRENCE_OPTIONS.map((option) => {
                      const isSelected = recurrence.frequency === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`ds-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            updateSchedule({ recurrence: { ...recurrence, frequency: option } });
                            setIsFrequencyOpen(false);
                          }}
                        >
                          <span>{option}</span>
                          {isSelected && <Check size={16} aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

<div className="weekday-field">
<span id="active-days-label" className="field-label">Active days</span>
<div className="days-selector" role="group" aria-labelledby="active-days-label">
{WEEK_DAYS.map((day) => {
const isActive = recurrence.days.includes(day.key);

return (
<button
key={day.key}
type="button"
className={`day-circle ds-choice ${isActive ? 'active' : ''}`}
onClick={() => toggleActiveDay(day.key)}
aria-pressed={isActive}
aria-label={day.key}
>
{day.label}
</button>
);
})}
</div>
</div>
            </div>
          )}
        </section>

        <div className="section-divider" />

        <section className="form-section usage-section" aria-labelledby="usage-label">
          <div className="section-heading">
            <span className="section-icon"><AlertCircle size={16} aria-hidden="true" /></span>
            <div>
              <h3 id="usage-label" className="section-label">Usage controls</h3>
              <p>Campaign limits automatically stop rewards when a cap is reached.</p>
            </div>
          </div>

          <div className="limits-grid">
            <div className="limit-card">
              <div className="limit-header">
                <span className="limit-icon claims"><Users size={17} aria-hidden="true" /></span>
                <span>Total claims limit</span>
              </div>
              <label className="sr-only" htmlFor="total-claims">Total claims limit</label>
              <div className="limit-input-wrapper ds-control">
                <input
                  id="total-claims"
                  type="number"
                  placeholder="Unlimited"
                  className="limit-input"
                  value={limits.totalClaims}
                  onChange={(event) => updateSchedule({ limits: { ...limits, totalClaims: event.target.value } })}
                />
                <span className="unit">Users</span>
              </div>
              <p className="limit-hint">Stop the campaign after this number of claims.</p>
            </div>

            <div className="limit-card">
              <div className="limit-header">
                <span className="limit-icon player"><Users size={17} aria-hidden="true" /></span>
                <span>Per player limit</span>
              </div>
              <label className="sr-only" htmlFor="per-player-claims">Per player claim limit</label>
              <div className="limit-input-wrapper ds-control">
                <input
                  id="per-player-claims"
                  type="number"
                  className="limit-input"
                  value={limits.perPlayer}
                  onChange={(event) => updateSchedule({ limits: { ...limits, perPlayer: event.target.value } })}
                />
                <span className="unit">Claims</span>
              </div>
              <p className="limit-hint">The maximum number of times one player can claim.</p>
            </div>

            <div className="limit-card">
              <div className="limit-header">
                <span className="limit-icon budget"><DollarSign size={17} aria-hidden="true" /></span>
                <span>Total budget cap</span>
              </div>
              <label className="sr-only" htmlFor="promotion-budget">Total budget cap</label>
              <div className="limit-input-wrapper ds-control">
                <span className="currency-prefix">€</span>
                <input
                  id="promotion-budget"
                  type="number"
                  placeholder="No limit"
                  className="limit-input"
                  value={limits.budget}
                  onChange={(event) => updateSchedule({ limits: { ...limits, budget: event.target.value } })}
                />
              </div>
              <p className="limit-hint">Stop issuing rewards when this budget is exhausted.</p>
            </div>
          </div>
        </section>

<div className={`schedule-summary ds-notice ${hasValidSchedule ? 'ds-hint' : 'ds-notice--warning'}`} role="status">
<span className="ds-notice__icon" aria-hidden="true">
{hasValidSchedule ? <Clock /> : <AlertCircle />}
</span>
<div className="summary-text">
            {hasValidSchedule ? (
              <>
                <p>This promotion will run for <strong>{durationInDays} {durationInDays === 1 ? 'day' : 'days'}</strong>.</p>
                <p className="sub">From {start.toLocaleString()} to {end.toLocaleString()}</p>
              </>
            ) : (
              <>
                <p><strong>End date must be after start date.</strong></p>
                <p className="sub">Update the campaign duration to continue.</p>
              </>
            )}
          </div>
        </div>
</section>
</div>
  );
}