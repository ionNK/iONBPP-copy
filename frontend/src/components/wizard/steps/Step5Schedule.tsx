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
    <div className="step-container">
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

      <style jsx>{`
.step-container {
max-width: 900px;
          margin: 0 auto;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-panel {
          padding: 32px;
        }

        .schedule-heading {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
        }

        .eyebrow {
          margin: 0 0 6px;
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .panel-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .panel-subtitle {
          max-width: 570px;
          margin: 8px 0 0;
          color: var(--color-text-secondary);
          font-size: 14px;
          line-height: 1.5;
        }

        .form-section {
          margin: 0;
        }

        .section-heading {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-icon {
          display: inline-flex;
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          color: var(--color-betika-yellow);
          background: var(--color-bg-input);
        }

        .section-label {
          margin: 0;
          color: var(--color-text-primary);
          font-size: 14px;
          font-weight: 700;
        }

        .section-heading p {
          margin: 4px 0 0;
          color: var(--color-text-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .date-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: end;
          gap: 14px;
          margin-bottom: 20px;
        }

        .input-group {
          min-width: 0;
        }

        .input-group label,
        .field-label {
          display: block;
          margin: 0 0 8px;
          color: var(--color-text-secondary);
          font-size: 12px;
          font-weight: 600;
        }

        .form-input {
          width: 100%;
          min-height: 48px;
          padding: 0 12px;
          color: var(--color-text-primary);
          font-family: inherit;
          color-scheme: dark;
        }

        .date-connector {
          padding-bottom: 14px;
          color: var(--color-text-muted);
          font-size: 20px;
        }

        .recurring-toggle {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--color-border);
          border-radius: 14px;
          color: var(--color-text-primary);
          text-align: left;
          cursor: pointer;
          background: var(--color-bg-card);
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .recurring-toggle:hover,
        .recurring-toggle.is-selected {
          border-color: var(--color-betika-yellow);
          background: var(--color-bg-input);
        }

        .schedule-checkbox {
          display: inline-flex;
          width: 20px;
          height: 20px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: #171717;
          background: transparent;
        }

        .is-selected .schedule-checkbox {
          border-color: var(--color-betika-yellow);
          background: var(--color-betika-yellow);
        }

        .recurrence-copy {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 3px;
          font-size: 14px;
          font-weight: 600;
        }

        .recurrence-copy small {
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 400;
        }

        .recurrence-icon {
          color: var(--color-text-muted);
        }

        .recurrence-options {
          display: grid;
          grid-template-columns: minmax(180px, 0.7fr) minmax(0, 1fr);
          gap: 20px;
          margin-top: 12px;
          padding: 16px;
          border: 1px solid var(--color-border);
          border-radius: 14px;
          background: var(--color-bg-card);
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-3px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .frequency-field {
          position: relative;
        }

        .frequency-trigger {
          display: flex;
          width: 100%;
          min-height: 48px;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          color: var(--color-text-primary);
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .frequency-trigger.open svg {
          transform: rotate(180deg);
        }

        .frequency-trigger svg {
          color: var(--color-text-muted);
          transition: transform 0.2s ease;
        }

        .frequency-menu {
          position: absolute;
          z-index: 10;
          top: calc(100% + 6px);
          right: 0;
          left: 0;
        }

        .frequency-menu :global(.ds-dropdown-item) {
          width: 100%;
        }

        .weekday-field {
          min-width: 0;
        }

        .days-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

.day-circle {
display: inline-flex;
width: 32px;
height: 32px;
align-items: center;
justify-content: center;
border-radius: 50%;
color: var(--color-text-muted);
font-size: 12px;
font-weight: 700;
background: var(--color-bg-input);
cursor: pointer;
}

.day-circle.active {
border-color: var(--ds-accent);
color: #171717;
background: var(--ds-accent);
}

.day-circle:focus-visible {
outline: 2px solid var(--ds-accent);
outline-offset: 2px;
}

        .section-divider {
          height: 1px;
          margin: 32px 0;
          background: var(--color-border);
        }

        .limits-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .limit-card {
          min-width: 0;
          padding: 16px;
          border: 1px solid var(--color-border);
          border-radius: 14px;
          background: var(--color-bg-card);
        }

        .limit-header {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 26px;
          margin-bottom: 14px;
          color: var(--color-text-primary);
          font-size: 13px;
          font-weight: 700;
        }

        .limit-icon {
          display: inline-flex;
          width: 26px;
          height: 26px;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
        }

        .limit-icon.claims {
          color: var(--color-accent-cyan);
          background: color-mix(in srgb, var(--color-accent-cyan) 14%, transparent);
        }

        .limit-icon.player {
          color: var(--color-accent-purple);
          background: color-mix(in srgb, var(--color-accent-purple) 14%, transparent);
        }

        .limit-icon.budget {
          color: var(--color-betika-yellow);
          background: color-mix(in srgb, var(--color-betika-yellow) 14%, transparent);
        }

        .limit-input-wrapper {
          display: flex;
          min-height: 48px;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border-radius: 8px;
        }

        .limit-input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          color: var(--color-text-primary);
          font: inherit;
          font-size: 16px;
          font-weight: 700;
          background: transparent;
        }

        .limit-input::placeholder {
          color: var(--color-text-muted);
          font-weight: 400;
        }

        .unit,
        .currency-prefix {
          flex: 0 0 auto;
          color: var(--color-text-muted);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .currency-prefix {
          color: var(--color-text-secondary);
          font-size: 16px;
          letter-spacing: normal;
          text-transform: none;
        }

        .limit-hint {
          min-height: 34px;
          margin: 10px 0 0;
          color: var(--color-text-muted);
          font-size: 12px;
          line-height: 1.4;
        }

.schedule-summary {
margin-top: 32px;
}

.summary-text p {
margin: 0;
color: inherit;
font-size: 14px;
line-height: 1.45;
}

.summary-text .sub {
margin-top: 4px;
font-size: 12px;
opacity: 0.82;
}

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 760px) {
          .form-panel {
            padding: 24px 20px;
          }

          .date-grid,
          .recurrence-options,
          .limits-grid {
            grid-template-columns: 1fr;
          }

          .date-connector {
            display: none;
          }

          .limit-hint {
            min-height: 0;
          }
        }
      `}</style>
    </div>
  );
}