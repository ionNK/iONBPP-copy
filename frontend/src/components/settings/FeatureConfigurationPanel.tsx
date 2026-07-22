'use client';

import { useEffect, useMemo, useState } from 'react';
import {
 AlertTriangle,
 CheckCircle2,
 Eye,
 EyeOff,
 Layers3,
 LockKeyhole,
 RotateCcw,
 Route,
 Save,
 ToggleLeft,
 ToggleRight,
} from 'lucide-react';
import {
 FEATURE_CONFIGURATION_EVENT,
 FEATURE_DEFINITIONS,
 getFeatureConfiguration,
 getDefaultFeatureConfiguration,
 getDefaultFeatureGroupConfiguration,
 getFeatureGroupConfiguration,
 isFeatureEnabled,
 resetFeatureConfiguration,
 saveFeatureConfiguration,
 saveFeatureGroupConfiguration,
 type FeatureConfiguration,
 type FeatureDefinition,
 type FeatureGroup,
 type FeatureGroupConfiguration,
} from '@/lib/feature-config';
import { can, getRole, type Role } from '@/lib/permissions';

const FEATURE_GROUPS: FeatureGroup[] = [
 'Main',
 'Promotions',
 'Customers',
 'Insights',
 'Governance & Support',
];

interface FeatureConfigurationPanelProps {
 onSaved?: (message: string) => void;
}

export default function FeatureConfigurationPanel({
 onSaved,
}: FeatureConfigurationPanelProps) {
 const [configuration, setConfiguration] = useState<FeatureConfiguration>(
 getDefaultFeatureConfiguration,
 );
 const [groupConfiguration, setGroupConfiguration] =
 useState<FeatureGroupConfiguration>(getDefaultFeatureGroupConfiguration);
 const [role, setRole] = useState<Role>('super_admin');
 const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

 const canManageFeatures = role === 'super_admin' && can('feature_config.manage', role);

 useEffect(() => {
 const loadConfiguration = (event?: Event) => {
 const detail =
 event instanceof CustomEvent
 ? (event.detail as { groupConfiguration?: FeatureGroupConfiguration })
 : undefined;

 // Parent-area controls save immediately. Do not discard a user's unsaved
 // child-level visibility edits when the sidebar receives that update.
 if (detail?.groupConfiguration) {
 setGroupConfiguration(detail.groupConfiguration);
 return;
 }

 setConfiguration(getFeatureConfiguration());
 setGroupConfiguration(getFeatureGroupConfiguration());
 setRole(getRole());
 setHasUnsavedChanges(false);
 };

 loadConfiguration();
 window.addEventListener(FEATURE_CONFIGURATION_EVENT, loadConfiguration);
 window.addEventListener('admin-role-updated', loadConfiguration);

 return () => {
 window.removeEventListener(FEATURE_CONFIGURATION_EVENT, loadConfiguration);
 window.removeEventListener('admin-role-updated', loadConfiguration);
 };
 }, []);

 const groupedFeatures = useMemo(
 () =>
 FEATURE_GROUPS.map((group) => ({
 group,
 features: FEATURE_DEFINITIONS.filter((feature) => feature.group === group),
 })),
 [],
 );

 const enabledFeatureCount = FEATURE_DEFINITIONS.filter((feature) =>
 isFeatureEnabled(feature.id, configuration, groupConfiguration),
 ).length;
 const configurableFeatureCount = FEATURE_DEFINITIONS.filter(
 (feature) => !feature.protected,
 ).length;

 const updateFeature = (feature: FeatureDefinition, enabled: boolean) => {
 if (
 !canManageFeatures ||
 feature.protected ||
 !groupConfiguration[feature.group]
 ) {
 return;
 }

 setConfiguration((current) => ({ ...current, [feature.id]: enabled }));
 setHasUnsavedChanges(true);
 };

 const updateGroup = (group: FeatureGroup, enabled: boolean) => {
 if (!canManageFeatures || group === 'Main') return;

 const savedGroupConfiguration = saveFeatureGroupConfiguration({
 ...groupConfiguration,
 [group]: enabled,
 });
 setGroupConfiguration(savedGroupConfiguration);
 onSaved?.(
 `${group} has been ${enabled ? 'shown' : 'hidden'} in the main menu.`,
 );
 };

 const saveChanges = () => {
 const savedConfiguration = saveFeatureConfiguration(configuration);
 const savedGroupConfiguration = saveFeatureGroupConfiguration(groupConfiguration);
 setConfiguration(savedConfiguration);
 setGroupConfiguration(savedGroupConfiguration);
 setHasUnsavedChanges(false);
 onSaved?.('Feature visibility updated across the main menu.');
 };

 const resetChanges = () => {
 const resetConfiguration = resetFeatureConfiguration();
 setConfiguration(resetConfiguration);
 setGroupConfiguration(getDefaultFeatureGroupConfiguration());
 setHasUnsavedChanges(false);
 onSaved?.('Feature visibility restored to platform defaults.');
 };

 return (
 <section className="feature-config">
 <header className="feature-config__header">
 <div>
 <div className="feature-config__eyebrow">
 <Layers3 size={15} />
 Main menu controls
 </div>
 <h3>Feature Configuration</h3>
 <p>
 Control main menu areas and their features. Hiding or showing a main area
 takes effect immediately and applies to every feature beneath it.
 </p>
 </div>
 <div className="feature-config__summary ds-card" aria-label="Feature status">
 <strong>{enabledFeatureCount}</strong>
 <span>of {FEATURE_DEFINITIONS.length} features visible</span>
 </div>
 </header>

 {!canManageFeatures && (
      <div className="feature-config__notice ds-notice ds-notice--info" role="status">
 <span className="ds-notice__icon">
 <LockKeyhole size={17} />
 </span>
 <span>
 Feature visibility is read-only. Only a Super Admin can change the
 platform&apos;s main-menu configuration.
 </span>
 </div>
 )}

      <div className="feature-config__warning ds-notice ds-notice--warning">
 <span className="ds-notice__icon">
 <AlertTriangle size={17} />
 </span>
 <span>
 Dashboard and Settings remain available as protected recovery features.
 Other child preferences are preserved when a main area is hidden.
 </span>
 </div>

 <div className="feature-config__groups">
 {groupedFeatures.map(({ group, features }) => {
 const groupEnabled = groupConfiguration[group];
 const enabledCount = features.filter((feature) =>
 isFeatureEnabled(feature.id, configuration, groupConfiguration),
 ).length;
 const canToggleGroup = group !== 'Main';

 return (
 <section className="feature-group ds-card" key={group}>
 <div className="feature-group__header">
 <div>
 <h4>{group}</h4>
 <span>{enabledCount} of {features.length} visible</span>
 </div>
 {canToggleGroup && (
 <button
 type="button"
 className="feature-group__toggle ds-action-button ds-action-button--outline"
 onClick={() => updateGroup(group, !groupEnabled)}
 disabled={!canManageFeatures}
 aria-pressed={groupEnabled}
 >
 {groupEnabled ? <EyeOff size={15} /> : <Eye size={15} />}
 {groupEnabled ? 'Hide main area' : 'Show main area'}
 </button>
 )}
 </div>

 <div className="feature-group__list">
 {features.map((feature) => {
 const enabled = configuration[feature.id];
 const isLocked = Boolean(feature.protected);
 const isBlockedByParent = !groupEnabled && !isLocked;
 const effectivelyEnabled = enabled && !isBlockedByParent;

 return (
 <div
 className={`feature-row ${isBlockedByParent ? 'is-disabled-by-parent' : ''}`}
 key={feature.id}
 >
 <div className="feature-row__icon">
 <Route size={18} />
 </div>
 <div className="feature-row__content">
 <div className="feature-row__title">
 <strong>{feature.name}</strong>
 {isLocked && <span>Always on</span>}
 </div>
 <p>{feature.description}</p>
 <code>{feature.path}</code>
 </div>
 <button
 type="button"
 className={`feature-switch ds-visibility-toggle ${effectivelyEnabled ? 'is-enabled' : ''}`}
 onClick={() => updateFeature(feature, !enabled)}
 disabled={!canManageFeatures || isLocked || isBlockedByParent}
 aria-pressed={effectivelyEnabled}
 aria-label={`${effectivelyEnabled ? 'Disable' : 'Enable'} ${feature.name}`}
 title={
 isLocked
 ? `${feature.name} is protected`
 : isBlockedByParent
 ? `Enable ${group} before changing ${feature.name}`
 : `${effectivelyEnabled ? 'Disable' : 'Enable'} ${feature.name}`
 }
 >
 {effectivelyEnabled ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
 <span>{effectivelyEnabled ? 'Visible' : 'Hidden'}</span>
 </button>
 </div>
 );
 })}
 </div>
 </section>
 );
 })}
 </div>

 <footer className="feature-config__footer">
 <div>
 <p>{configurableFeatureCount} configurable menu features</p>
 {hasUnsavedChanges && <span>Unsaved feature visibility changes</span>}
 </div>
 <div className="feature-config__actions">
 <button
 type="button"
 className="feature-config__reset ds-action-button ds-action-button--outline"
 onClick={resetChanges}
 disabled={!canManageFeatures}
 >
 <RotateCcw size={15} />
 Restore defaults
 </button>
 <button
 type="button"
 className="feature-config__save ds-action-button ds-action-button--primary"
 onClick={saveChanges}
 disabled={!canManageFeatures || !hasUnsavedChanges}
 >
 {hasUnsavedChanges ? <Save size={15} /> : <CheckCircle2 size={15} />}
 {hasUnsavedChanges ? 'Save feature changes' : 'Changes saved'}
 </button>
 </div>
 </footer>

 </section>
 );
}