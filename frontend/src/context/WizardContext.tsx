'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// --- Types ---

export interface Rule {
    id: number;
    param: string;
    operator: string;
    value: string;
    type: string;
}

export interface Trigger {
    id: string;
    eventId: string;
    rules: Rule[];
}

export interface TierRule {
    id: number;
    dimensionKey: string; // 'week' | 'selections' | 'stake'
    dimensionValue: string;
    segment: string;
    percentage: string;
    cap: string;
}

export interface WizardState {
    basics: {
        name: string;
        description: string;
        type: string;
    };
  eligibility: {
    markets: string[];
    primaryMarket: string; // most recently selected market — drives derived currency
    channels: string[]; // platforms
    segment: string;
    customSegments: string[];
    triggers: Trigger[];
  };

    rewards: {
        type: string; // 'cashback', 'bonus', 'spins', 'physical'
        calcType: string; // 'simple', 'tiered'
        matrixDimension: string; // 'week', 'selections'
        tiers: TierRule[];
    simpleConfig: {
      percentage: string;
      cap: string;
    };
    wagering: number;
    creditTiming: string;
    // Free bet / token reward configuration (e.g. Aviator Welcome Offer)
    freebet: {
      unitValue: string;   // value of a single free bet (e.g. 2)
      currency: string;    // ZMW, KES, etc.
      targetGame: string;  // game the free rounds/spins apply to (e.g. Aviator)
      countPerAward: string; // free bets granted per qualifying day (e.g. 5)
      maxTotalCap: string;   // max total free bets across the whole offer (e.g. 25)
      expiryHours: string;   // hours until credited free bets expire (e.g. 24)
      creditByTime: string;  // local time free bets are credited by (e.g. 14:00)
      stakeReturned: boolean; // whether the free bet stake is returned on a win
    };

    // Qualifying-bet criteria for activity-based offers
    qualifyingBet: {
      enabled: boolean;
      game: string;           // Applicable game (e.g. Aviator)
      minStake: string;       // minimum real-money stake (e.g. 2)
      minMultiplier: string;  // minimum cashout multiplier / odds (e.g. 2.00)
      countPerDay: string;    // qualifying bets required per day (e.g. 10)
      countLosingBets: boolean; // do losing bets count as qualifying?
    };
    // Multi-day / repeatable offer window
    multiDay: {
      enabled: boolean;
      windowDays: string;     // number of days offer runs (e.g. 5)
      startFromRegistration: boolean; // day 1 = registration day
      nonConsecutive: boolean; // qualify on any subset of days
      newCustomersOnly: boolean;
    };
  };

    schedule: {
        startDate: string;
        endDate: string;
        isRecurring: boolean;
        recurrence: {
            frequency: string;
            days: string[];
        };
        limits: {
            totalClaims: string;
            perPlayer: string;
            budget: string;
        };
    };
    display: {
        activeTab: string; // 'display' | 'communication'
        title: string;
        teaser: string;
        bannerImage: string;
        termsAndConditions: string;
        badges: string[]; // ['NEW', 'HOT']
        communication: {
            smsEnabled: boolean;
            pushEnabled: boolean;
            smsTemplate: string;
        };
        fullContent?: string;
        fullContentFile?: string;
    };
}

const defaultState: WizardState = {
    basics: {
        name: '',
        description: '',
        type: ''
    },
  eligibility: {
    // Country codes are uppercase to match the backend /countries API
    // and the <option> values rendered in Step 2 Scope. Keeping these in
    // sync ensures the dropdown shows a real selection on load and that
    // Step 4 derives the correct currency from primaryMarket.
    markets: ['KE'],
    primaryMarket: 'KE',
    channels: ['desktop'],

        segment: '',
        customSegments: [],
        triggers: []
    },
    rewards: {
        type: 'cashback',
        calcType: 'tiered',
        matrixDimension: 'week',
        tiers: [
            { id: 1, dimensionKey: 'week', dimensionValue: 'Week 1', segment: 'All Segments', percentage: '10', cap: '100' },
        ],
    simpleConfig: { percentage: '100', cap: '500' },
    wagering: 35,
    creditTiming: 'instant',
      freebet: {
        unitValue: '2',
        currency: 'KES',
        targetGame: 'Aviator',
        countPerAward: '5',
      maxTotalCap: '25',
      expiryHours: '24',
      creditByTime: '14:00',
      stakeReturned: false,
    },
    qualifyingBet: {
      enabled: false,
      game: 'Aviator',
      minStake: '2',
      minMultiplier: '2.00',
      countPerDay: '10',
      countLosingBets: true,
    },
    multiDay: {
      enabled: false,
      windowDays: '5',
      startFromRegistration: true,
      nonConsecutive: true,
      newCustomersOnly: true,
    },
  },

    schedule: {
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        isRecurring: false,
        recurrence: { frequency: 'Weekly', days: [] },
        limits: { totalClaims: '', perPlayer: '1', budget: '' }
    },
    display: {
        activeTab: 'display',
        title: '',
        teaser: '',
        bannerImage: '',
        termsAndConditions: '',
        badges: ['NEW'],
        communication: {
            smsEnabled: true,
            pushEnabled: false,
            smsTemplate: "Hi {{player_name}}, you have qualified for our promotion! Check your account for details."
        }
    }
};

export type FieldErrors = Record<string, string>;

interface WizardContextType {
  state: WizardState;
  updateBasics: (data: Partial<WizardState['basics']>) => void;
  updateEligibility: (data: Partial<WizardState['eligibility']>) => void;
  updateRewards: (data: Partial<WizardState['rewards']>) => void;
  updateSchedule: (data: Partial<WizardState['schedule']>) => void;
  updateDisplay: (data: Partial<WizardState['display']>) => void;
  resetWizard: () => void;
  loadPromotion: (promotion: WizardState) => void;
  fieldErrors: FieldErrors;
  setFieldErrors: (errors: FieldErrors) => void;
  clearFieldError: (field: string) => void;
}


const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultState);
  const [fieldErrors, setFieldErrorsState] = useState<FieldErrors>({});

  const setFieldErrors = (errors: FieldErrors) => setFieldErrorsState(errors);
  const clearFieldError = (field: string) =>
    setFieldErrorsState(prev => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });


    const updateBasics = (data: Partial<WizardState['basics']>) => {
        setState(prev => ({ ...prev, basics: { ...prev.basics, ...data } }));
    };

    const updateEligibility = (data: Partial<WizardState['eligibility']>) => {
        setState(prev => ({ ...prev, eligibility: { ...prev.eligibility, ...data } }));
    };

    const updateRewards = (data: Partial<WizardState['rewards']>) => {
        setState(prev => ({ ...prev, rewards: { ...prev.rewards, ...data } }));
    };

    const updateSchedule = (data: Partial<WizardState['schedule']>) => {
        setState(prev => ({ ...prev, schedule: { ...prev.schedule, ...data } }));
    };

    const updateDisplay = (data: Partial<WizardState['display']>) => {
        setState(prev => ({ ...prev, display: { ...prev.display, ...data } }));
    };

    const resetWizard = () => setState(defaultState);

    const loadPromotion = (promotion: WizardState) => setState(promotion);

    return (
        <WizardContext.Provider value={{ state, updateBasics, updateEligibility, updateRewards, updateSchedule, updateDisplay, resetWizard, loadPromotion, fieldErrors, setFieldErrors, clearFieldError }}>

            {children}
        </WizardContext.Provider>
    );
}

export function useWizardContext() {
    const context = useContext(WizardContext);
    if (context === undefined) {
        throw new Error('useWizardContext must be used within a WizardProvider');
    }
    return context;
}
