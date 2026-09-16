export type DigestFrequency = 'Immediate' | 'Daily' | 'Weekly';
export type ApproverRole = 'Country Manager' | 'Finance' | 'Either';

export interface ProviderCode {
  id: string;
  code: string;
  name: string;
  vertical: string;
}

export interface Settings {
  market: 'Zambia';
  timezone: 'Africa/Lusaka' | 'UTC';
  dateFormat: 'DD MMM YYYY' | 'YYYY-MM-DD';
  alertThreshold: number;
  alertRecipients: string;
  digestFrequency: DigestFrequency;
  earlyWarning: boolean;
  automatedApprovalThreshold: boolean;
  thresholdAmount: number;
  secondApprover: boolean;
  approverRole: ApproverRole;
  providers: ProviderCode[];
}

export const PROVIDER_SEED: ProviderCode[] = [
  { id: 'provider-spr', code: 'SPR', name: 'Spribe', vertical: 'Crash' },
  { id: 'provider-sms', code: 'SMS', name: 'SmartSoft', vertical: 'Casino' },
  { id: 'provider-imn', code: 'IMN', name: 'iMoon', vertical: 'Crash' },
  { id: 'provider-sbk', code: 'SBK', name: 'Sportsbook', vertical: 'Sports' },
];

export const DEFAULT_SETTINGS: Settings = {
  market: 'Zambia',
  timezone: 'Africa/Lusaka',
  dateFormat: 'DD MMM YYYY',
  alertThreshold: 90,
  alertRecipients: 'gaming@ionix.zm, finance@ionix.zm',
  digestFrequency: 'Immediate',
  earlyWarning: false,
  automatedApprovalThreshold: true,
  thresholdAmount: 50000,
  secondApprover: false,
  approverRole: 'Either',
  providers: PROVIDER_SEED,
};

const STORAGE_KEY = 'settings.v1';

export function createDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS, providers: DEFAULT_SETTINGS.providers.map((provider) => ({ ...provider })) };
}

/** SSR-safe prototype store. Invalid or incomplete saved values fall back to defaults. */
export function loadSettings(): Settings {
  const defaults = createDefaultSettings();
  if (typeof window === 'undefined') return defaults;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
    const saved = parsed as Partial<Settings>;
    return {
      ...defaults,
      ...saved,
      providers: Array.isArray(saved.providers) ? saved.providers : defaults.providers,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* Prototype mock — storage failures are non-fatal. */
  }
}
