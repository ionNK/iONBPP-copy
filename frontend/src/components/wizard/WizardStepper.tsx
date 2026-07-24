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
    </div>
  );
}