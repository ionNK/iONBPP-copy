'use client';

import { Check } from 'lucide-react';

const steps = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Scope' },
  { id: 3, label: 'Qualification' },
  { id: 4, label: 'Rewards' },
  { id: 5, label: 'Schedule' },
  { id: 6, label: 'Display' },
  { id: 7, label: 'Review' },
];

export default function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="stepper-container" aria-label="Promotion creation progress">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <div
            key={step.id}
            className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="step-circle" aria-hidden="true">
              {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id}
            </div>
            <span className="step-label">{step.label}</span>
            {index < steps.length - 1 && <div className="step-line" />}
          </div>
        );
      })}

      <style jsx>{`
        .stepper-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          min-width: 0;
          margin-bottom: 28px;
        }

        .step-item {
          display: flex;
          align-items: center;
          position: relative;
          min-width: 0;
          flex: 1 1 0;
        }

        .step-item:last-child {
          flex: 0 0 auto;
        }

        .step-circle {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          border: 1px solid var(--ds-border);
          border-radius: 50%;
          background: var(--ds-surface-raised);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          font-size: 11px;
          font-weight: 500;
          line-height: 1;
          transition:
            background-color var(--ds-transition),
            border-color var(--ds-transition),
            color var(--ds-transition);
          z-index: 1;
        }

        .step-label {
          margin-left: 10px;
          overflow: hidden;
          color: var(--color-text-muted);
          font-size: 14px;
          font-weight: 400;
          line-height: 28px;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color var(--ds-transition);
        }

        .step-line {
          height: 1px;
          min-width: 12px;
          flex: 1 1 auto;
          margin: 0 12px;
          background: var(--ds-border);
          transition: background-color var(--ds-transition);
        }

        .step-item.active .step-circle {
          border-color: var(--ds-accent);
          background: var(--ds-accent);
          color: #001528;
        }

        .step-item.active .step-label {
          color: var(--color-text-primary);
          font-weight: 500;
        }

        .step-item.completed .step-circle {
          border-color: var(--ds-success);
          background: var(--ds-success);
          color: #fff;
        }

        .step-item.completed .step-label {
          color: var(--color-text-secondary);
        }

        .step-item.completed .step-line {
          background: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 1180px) {
          .step-label {
            margin-left: 7px;
            font-size: 12px;
          }

          .step-line {
            margin-right: 8px;
            margin-left: 8px;
          }
        }

        @media (max-width: 800px) {
          .stepper-container {
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .step-item {
            min-width: max-content;
            flex: 0 0 auto;
          }

          .step-line {
            width: 24px;
            min-width: 24px;
            flex: 0 0 24px;
            margin: 0 10px;
          }

          .step-label {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}