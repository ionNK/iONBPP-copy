export type FeatureGroup =
  | 'Main'
  | 'Promotions'
  | 'Customers'
  | 'Insights'
  | 'Governance & Support';

export type FeatureId =
  | 'dashboard'
  | 'promotions'
  | 'manual-award'
  | 'experiments'
  | 'crm-overview'
  | 'player-360'
  | 'segments'
  | 'intelligence'
  | 'responsible-gaming'
  | 'crm-analytics'
  | 'reports'
  | 'churn-prediction'
  | 'promo-prediction'
  | 'compliance'
  | 'audit-trail'
  | 'customer-lookup'
  | 'settings';

export interface FeatureDefinition {
  id: FeatureId;
  name: string;
  description: string;
  group: FeatureGroup;
  path: string;
  protected?: boolean;
  defaultEnabled: boolean;
}

export type FeatureConfiguration = Record<FeatureId, boolean>;
export type FeatureGroupConfiguration = Record<FeatureGroup, boolean>;

export const FEATURE_CONFIGURATION_STORAGE_KEY = 'platform_feature_configuration';
export const FEATURE_GROUP_CONFIGURATION_STORAGE_KEY = 'platform_feature_group_configuration';
export const FEATURE_CONFIGURATION_EVENT = 'feature-configuration-updated';

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Platform overview and primary landing page.',
    group: 'Main',
    path: '/admin',
    protected: true,
    defaultEnabled: true,
  },
  {
    id: 'promotions',
    name: 'All Promotions',
    description: 'Create, review, and operate promotion campaigns.',
    group: 'Promotions',
    path: '/admin/promotions',
    defaultEnabled: true,
  },
  {
    id: 'manual-award',
    name: 'Manual Award',
    description: 'Issue approved rewards directly to customers.',
    group: 'Promotions',
    path: '/admin/manual-award',
    defaultEnabled: true,
  },
  {
    id: 'experiments',
    name: 'Experiments',
    description: 'Configure and monitor controlled promotion experiments.',
    group: 'Promotions',
    path: '/admin/experiments',
    defaultEnabled: true,
  },
  {
    id: 'crm-overview',
    name: 'Overview',
    description: 'Access the customer relationship management overview.',
    group: 'Customers',
    path: '/admin/crm',
    defaultEnabled: true,
  },
  {
    id: 'player-360',
    name: 'Player 360',
    description: 'Review individual customer profiles and activity.',
    group: 'Customers',
    path: '/admin/crm/players',
    defaultEnabled: true,
  },
  {
    id: 'segments',
    name: 'Segments',
    description: 'Build and manage customer audience segments.',
    group: 'Customers',
    path: '/admin/crm/segments',
    defaultEnabled: true,
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    description: 'Explore customer intelligence and recommendations.',
    group: 'Customers',
    path: '/admin/crm/intelligence',
    defaultEnabled: true,
  },
  {
    id: 'responsible-gaming',
    name: 'Responsible Gaming',
    description: 'Monitor responsible-gaming signals and interventions.',
    group: 'Customers',
    path: '/admin/crm/responsible-gaming',
    defaultEnabled: true,
  },
  {
    id: 'crm-analytics',
    name: 'CRM Analytics',
    description: 'Analyze customer and engagement performance.',
    group: 'Insights',
    path: '/admin/crm/analytics',
    defaultEnabled: true,
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'View operational and financial reports.',
    group: 'Insights',
    path: '/admin/reports',
    defaultEnabled: true,
  },
  {
    id: 'churn-prediction',
    name: 'Churn Prediction',
    description: 'Review predicted customer churn risk.',
    group: 'Insights',
    path: '/admin/predictions/churn',
    defaultEnabled: true,
  },
  {
    id: 'promo-prediction',
    name: 'Promo Prediction',
    description: 'Review promotion performance predictions.',
    group: 'Insights',
    path: '/admin/predictions/promotions',
    defaultEnabled: true,
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'Access governance approvals and compliance controls.',
    group: 'Governance & Support',
    path: '/admin/governance',
    defaultEnabled: true,
  },
  {
    id: 'audit-trail',
    name: 'Audit Trail',
    description: 'Review security and operational audit events.',
    group: 'Governance & Support',
    path: '/admin/promotions/audit',
    defaultEnabled: true,
  },
  {
    id: 'customer-lookup',
    name: 'Customer Lookup',
    description: 'Search for customer promotion and reward records.',
    group: 'Governance & Support',
    path: '/admin/promotions/customer-lookup',
    defaultEnabled: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Manage platform configuration and feature visibility.',
    group: 'Governance & Support',
    path: '/admin/settings',
    protected: true,
    defaultEnabled: true,
  },
];

const FEATURE_IDS = new Set(FEATURE_DEFINITIONS.map((feature) => feature.id));
const FEATURE_GROUPS: FeatureGroup[] = [
 'Main',
 'Promotions',
 'Customers',
 'Insights',
 'Governance & Support',
];

export function getDefaultFeatureConfiguration(): FeatureConfiguration {
  return Object.fromEntries(
    FEATURE_DEFINITIONS.map((feature) => [feature.id, feature.defaultEnabled]),
  ) as FeatureConfiguration;
}

export function getDefaultFeatureGroupConfiguration(): FeatureGroupConfiguration {
 return Object.fromEntries(
 FEATURE_GROUPS.map((group) => [group, true]),
 ) as FeatureGroupConfiguration;
}

export function getFeatureGroupConfiguration(): FeatureGroupConfiguration {
 const defaults = getDefaultFeatureGroupConfiguration();
 if (typeof window === 'undefined') return defaults;

 try {
 const stored = JSON.parse(
 localStorage.getItem(FEATURE_GROUP_CONFIGURATION_STORAGE_KEY) ?? '{}',
 ) as Partial<Record<FeatureGroup, unknown>>;

 for (const group of FEATURE_GROUPS) {
 if (group !== 'Main' && typeof stored[group] === 'boolean') {
 defaults[group] = stored[group] as boolean;
 }
 }
 } catch {
 // Invalid legacy values are ignored in favor of safe defaults.
 }

 return defaults;
}

export function getFeatureConfiguration(): FeatureConfiguration {
  const defaults = getDefaultFeatureConfiguration();
  if (typeof window === 'undefined') return defaults;

  try {
    const stored = JSON.parse(
      localStorage.getItem(FEATURE_CONFIGURATION_STORAGE_KEY) ?? '{}',
    ) as Partial<Record<FeatureId, unknown>>;

    for (const feature of FEATURE_DEFINITIONS) {
      if (feature.protected) {
        defaults[feature.id] = true;
      } else if (
        FEATURE_IDS.has(feature.id) &&
        typeof stored[feature.id] === 'boolean'
      ) {
        defaults[feature.id] = stored[feature.id] as boolean;
      }
    }
  } catch {
    // Invalid legacy values are ignored in favor of safe defaults.
  }

  return defaults;
}

export function saveFeatureConfiguration(
  configuration: FeatureConfiguration,
): FeatureConfiguration {
  const normalized = getDefaultFeatureConfiguration();

  for (const feature of FEATURE_DEFINITIONS) {
    normalized[feature.id] = feature.protected
      ? true
      : configuration[feature.id] !== false;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      FEATURE_CONFIGURATION_STORAGE_KEY,
      JSON.stringify(normalized),
    );
    window.dispatchEvent(
      new CustomEvent(FEATURE_CONFIGURATION_EVENT, {
        detail: { configuration: normalized },
      }),
    );
  }

  return normalized;
}

export function saveFeatureGroupConfiguration(
 configuration: FeatureGroupConfiguration,
): FeatureGroupConfiguration {
 const normalized = getDefaultFeatureGroupConfiguration();

 for (const group of FEATURE_GROUPS) {
 normalized[group] = group === 'Main' ? true : configuration[group] !== false;
 }

 if (typeof window !== 'undefined') {
 localStorage.setItem(
 FEATURE_GROUP_CONFIGURATION_STORAGE_KEY,
 JSON.stringify(normalized),
 );
 window.dispatchEvent(
 new CustomEvent(FEATURE_CONFIGURATION_EVENT, {
 detail: { groupConfiguration: normalized },
 }),
 );
 }

 return normalized;
}

export function resetFeatureConfiguration(): FeatureConfiguration {
 const defaults = getDefaultFeatureConfiguration();
 const groupDefaults = getDefaultFeatureGroupConfiguration();

 if (typeof window !== 'undefined') {
 localStorage.removeItem(FEATURE_CONFIGURATION_STORAGE_KEY);
 localStorage.removeItem(FEATURE_GROUP_CONFIGURATION_STORAGE_KEY);
 window.dispatchEvent(
 new CustomEvent(FEATURE_CONFIGURATION_EVENT, {
 detail: { configuration: defaults, groupConfiguration: groupDefaults },
 }),
 );
 }

 return defaults;
}

export function isFeatureGroupEnabled(
 group: FeatureGroup,
 groupConfiguration: FeatureGroupConfiguration = getFeatureGroupConfiguration(),
): boolean {
 return group === 'Main' || groupConfiguration[group] !== false;
}

export function isFeatureEnabled(
 featureId: FeatureId,
 configuration: FeatureConfiguration = getFeatureConfiguration(),
 groupConfiguration: FeatureGroupConfiguration = getFeatureGroupConfiguration(),
): boolean {
 const feature = FEATURE_DEFINITIONS.find((item) => item.id === featureId);
 return (
 configuration[featureId] !== false &&
 (!feature ||
 feature.protected ||
 isFeatureGroupEnabled(feature.group, groupConfiguration))
 );
}

export function getFeatureForPath(pathname: string): FeatureDefinition | undefined {
  if (pathname === '/admin') {
    return FEATURE_DEFINITIONS.find((feature) => feature.id === 'dashboard');
  }

  return FEATURE_DEFINITIONS
    .filter(
      (feature) =>
        feature.path !== '/admin' &&
        (pathname === feature.path || pathname.startsWith(`${feature.path}/`)),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function isConfiguredRouteEnabled(
 pathname: string,
 configuration: FeatureConfiguration = getFeatureConfiguration(),
 groupConfiguration: FeatureGroupConfiguration = getFeatureGroupConfiguration(),
): boolean {
 const feature = getFeatureForPath(pathname);
 return feature
 ? isFeatureEnabled(feature.id, configuration, groupConfiguration)
 : true;
}
