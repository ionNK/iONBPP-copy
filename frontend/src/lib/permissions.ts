// Central role-based access-control registry.
//
// Permission identifiers are stable application contracts. New feature permissions
// must be registered here and enforced by the feature UI (and by backend guards
// when server-side authentication is introduced).

export type Role = 'super_admin' | 'ops_manager' | 'approver' | 'support' | 'viewer';

export type PermissionRisk = 'low' | 'medium' | 'high';

export const PERMISSION_DEFINITIONS = {
 'user.view': { label: 'View users', group: 'User Management', risk: 'low', description: 'View user accounts and their status.' },
 'user.create': { label: 'Create users', group: 'User Management', risk: 'high', description: 'Invite and create user accounts.' },
 'user.edit': { label: 'Edit users', group: 'User Management', risk: 'high', description: 'Edit user details and role assignments.' },
 'user.suspend': { label: 'Suspend users', group: 'User Management', risk: 'high', description: 'Suspend and reactivate user access.' },
 'user.delete': { label: 'Delete users', group: 'User Management', risk: 'high', description: 'Permanently remove eligible user accounts.' },
 'role.view': { label: 'View roles', group: 'Role Management', risk: 'low', description: 'View role definitions and access rights.' },
 'role.assign': { label: 'Assign roles', group: 'Role Management', risk: 'high', description: 'Assign an existing role to a user.' },
 'role.manage': { label: 'Manage role permissions', group: 'Role Management', risk: 'high', description: 'Grant or revoke registered permissions.' },

 'promotion.view': { label: 'View promotions', group: 'Promotions', risk: 'low', description: 'View promotion records.' },
 'promotion.create': { label: 'Create promotions', group: 'Promotions', risk: 'medium', description: 'Create new promotions.' },
 'promotion.edit': { label: 'Edit promotions', group: 'Promotions', risk: 'medium', description: 'Edit promotion configurations.' },
 'promotion.submit': { label: 'Submit promotions', group: 'Promotions', risk: 'medium', description: 'Submit promotions for approval.' },
 'promotion.approve': { label: 'Approve promotions', group: 'Promotions', risk: 'high', description: 'Approve promotions for activation.' },
 'promotion.reject': { label: 'Reject promotions', group: 'Promotions', risk: 'high', description: 'Reject submitted promotions.' },
 'promotion.request_changes': { label: 'Request changes', group: 'Promotions', risk: 'medium', description: 'Return promotions for changes.' },
 'promotion.pause': { label: 'Pause promotions', group: 'Promotions', risk: 'high', description: 'Pause active promotions.' },
 'promotion.resume': { label: 'Resume promotions', group: 'Promotions', risk: 'high', description: 'Resume paused promotions.' },
 'promotion.end': { label: 'End promotions', group: 'Promotions', risk: 'high', description: 'End active promotions.' },
 'promotion.emergency_stop': { label: 'Emergency stop', group: 'Promotions', risk: 'high', description: 'Immediately stop promotion activity.' },
 'promotion.export': { label: 'Export promotion configuration', group: 'Promotions', risk: 'medium', description: 'Export or duplicate promotion configuration.' },

 'crm.view': { label: 'View CRM', group: 'CRM & Customers', risk: 'low', description: 'Access CRM dashboards.' },
 'customer.lookup': { label: 'Look up customers', group: 'CRM & Customers', risk: 'medium', description: 'Search for customer records.' },
 'customer.sensitive_view': { label: 'View sensitive customer data', group: 'CRM & Customers', risk: 'high', description: 'View sensitive customer attributes.' },
 'segment.manage': { label: 'Manage segments', group: 'CRM & Customers', risk: 'medium', description: 'Create and change customer segments.' },
 'customer.export': { label: 'Export customer data', group: 'CRM & Customers', risk: 'high', description: 'Export customer information.' },

 'report.operational_view': { label: 'View operational reports', group: 'Reports & Analytics', risk: 'low', description: 'View operational reporting.' },
 'report.financial_view': { label: 'View financial reports', group: 'Reports & Analytics', risk: 'medium', description: 'View financial reporting.' },
 'analytics.view': { label: 'View analytics', group: 'Reports & Analytics', risk: 'low', description: 'View analytics dashboards.' },
 'report.export': { label: 'Export reports', group: 'Reports & Analytics', risk: 'medium', description: 'Export report data.' },
 'prediction.view': { label: 'View predictive insights', group: 'Reports & Analytics', risk: 'low', description: 'View predictive insights.' },

 'governance.queue_view': { label: 'View approval queue', group: 'Governance & Audit', risk: 'low', description: 'View pending governance decisions.' },
 'governance.approve': { label: 'Approve governance actions', group: 'Governance & Audit', risk: 'high', description: 'Approve governed actions.' },
 'audit.view': { label: 'View audit trail', group: 'Governance & Audit', risk: 'medium', description: 'View security and operational audit events.' },
 'audit.export': { label: 'Export audit trail', group: 'Governance & Audit', risk: 'high', description: 'Export audit event data.' },
 'controls.manage': { label: 'Manage operational controls', group: 'Governance & Audit', risk: 'high', description: 'Operate platform safety controls.' },

 'settings.view': { label: 'View settings', group: 'System Settings', risk: 'low', description: 'View system configuration.' },
 'settings.edit': { label: 'Edit settings', group: 'System Settings', risk: 'high', description: 'Change general system settings.' },
 'country.manage': { label: 'Manage countries and limits', group: 'System Settings', risk: 'high', description: 'Change country configuration and limits.' },
 'integration.manage': { label: 'Manage integrations', group: 'System Settings', risk: 'high', description: 'Configure external integrations.' },
 'feature_config.manage': { label: 'Manage feature visibility', group: 'System Settings', risk: 'high', description: 'Show or hide configurable platform features in the main menu.' },
 'notification.manage': { label: 'Manage notification rules', group: 'System Settings', risk: 'medium', description: 'Change notification preferences and rules.' },
 'simulator.run': { label: 'Run event simulator', group: 'System Settings', risk: 'medium', description: 'Run simulated platform events.' },
 'system_health.view': { label: 'View system health', group: 'System Settings', risk: 'low', description: 'View service health information.' },

 'support.view': { label: 'View support center', group: 'Support & Documentation', risk: 'low', description: 'Access support tools.' },
 'support.manage': { label: 'Manage support configuration', group: 'Support & Documentation', risk: 'high', description: 'Configure support services.' },
 'documentation.view': { label: 'View user documentation', group: 'Support & Documentation', risk: 'low', description: 'Read user documentation.' },
 'documentation.technical_view': { label: 'View technical documentation', group: 'Support & Documentation', risk: 'medium', description: 'Read technical documentation.' },
} as const satisfies Record<string, { label: string; group: string; risk: PermissionRisk; description: string }>;

export type Permission = keyof typeof PERMISSION_DEFINITIONS;

export interface RoleDefinition {
 id: Role;
 label: string;
 description: string;
 level: number;
}

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
 super_admin: { id: 'super_admin', label: 'Super Admin', description: 'Full platform, access, governance, and configuration ownership.', level: 100 },
 ops_manager: { id: 'ops_manager', label: 'Operations Manager', description: 'Creates and operates promotions, CRM, reports, and operational controls.', level: 70 },
 approver: { id: 'approver', label: 'Approver', description: 'Independently reviews promotions and governance decisions.', level: 50 },
 support: { id: 'support', label: 'Support Agent', description: 'Supports customers with limited customer-record access.', level: 30 },
 viewer: { id: 'viewer', label: 'Viewer', description: 'Read-only access to approved dashboards, reports, and documentation.', level: 10 },
};

export const ROLE_LABEL: Record<Role, string> = Object.fromEntries(
 Object.values(ROLE_DEFINITIONS).map(role => [role.id, role.label]),
) as Record<Role, string>;

const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
 super_admin: Object.keys(PERMISSION_DEFINITIONS) as Permission[],
 ops_manager: [
 'role.view', 'promotion.view', 'promotion.create', 'promotion.edit', 'promotion.submit',
 'promotion.pause', 'promotion.resume', 'promotion.end', 'promotion.emergency_stop', 'promotion.export',
 'crm.view', 'customer.lookup', 'customer.sensitive_view', 'segment.manage', 'customer.export',
 'report.operational_view', 'report.financial_view', 'analytics.view', 'report.export', 'prediction.view',
 'governance.queue_view', 'audit.view', 'audit.export', 'controls.manage', 'settings.view',
 'notification.manage', 'simulator.run', 'system_health.view', 'support.view',
 'documentation.view', 'documentation.technical_view',
 ],
 approver: [
 'role.view', 'promotion.view', 'promotion.approve', 'promotion.reject', 'promotion.request_changes',
 'promotion.export', 'report.operational_view', 'analytics.view', 'prediction.view',
 'governance.queue_view', 'governance.approve', 'audit.view', 'settings.view',
 'system_health.view', 'support.view', 'documentation.view',
 ],
 support: [
 'role.view', 'crm.view', 'customer.lookup', 'customer.sensitive_view',
 'support.view', 'documentation.view',
 ],
 viewer: [
 'role.view', 'promotion.view', 'report.operational_view', 'analytics.view',
 'prediction.view', 'audit.view', 'system_health.view', 'support.view', 'documentation.view',
 ],
};

const ROLE_OVERRIDES_KEY = 'rbac_role_permissions';
const SESSION_KEY = 'admin_session';

export interface AdminSession {
 userId: number;
 name: string;
 email: string;
 role: Role;
 status: 'active' | 'suspended' | 'invited';
}

export function isRole(value: unknown): value is Role {
 return typeof value === 'string' && value in ROLE_DEFINITIONS;
}

export function getRole(): Role {
 if (typeof window === 'undefined') return 'super_admin';
 const session = getSession();
 if (session) return session.role;
 const storedRole = localStorage.getItem('admin_role');
 return isRole(storedRole) ? storedRole : 'super_admin';
}

export function setRole(role: Role) {
 if (typeof window === 'undefined') return;
 localStorage.setItem('admin_role', role);
 const session = getSession();
 if (session) localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, role }));
 window.dispatchEvent(new CustomEvent('admin-role-updated'));
}

export function getSession(): AdminSession | null {
 if (typeof window === 'undefined') return null;
 try {
 const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as AdminSession | null;
 return value && isRole(value.role) ? value : null;
 } catch {
 return null;
 }
}

export function setSession(session: AdminSession) {
 if (typeof window === 'undefined') return;
 localStorage.setItem(SESSION_KEY, JSON.stringify(session));
 localStorage.setItem('admin_role', session.role);
 window.dispatchEvent(new CustomEvent('admin-role-updated'));
}

export function clearSession() {
 if (typeof window === 'undefined') return;
 localStorage.removeItem(SESSION_KEY);
 localStorage.removeItem('admin_role');
 window.dispatchEvent(new CustomEvent('admin-role-updated'));
}

export function getRolePermissions(role: Role): Permission[] {
 if (role === 'super_admin') return [...DEFAULT_ROLE_PERMISSIONS.super_admin];
 if (typeof window === 'undefined') return [...DEFAULT_ROLE_PERMISSIONS[role]];
 try {
 const overrides = JSON.parse(localStorage.getItem(ROLE_OVERRIDES_KEY) ?? '{}') as Partial<Record<Role, Permission[]>>;
 const candidate = overrides[role];
 if (!Array.isArray(candidate)) return [...DEFAULT_ROLE_PERMISSIONS[role]];
 return candidate.filter((permission): permission is Permission => permission in PERMISSION_DEFINITIONS);
 } catch {
 return [...DEFAULT_ROLE_PERMISSIONS[role]];
 }
}

export function setRolePermissions(role: Role, permissions: Permission[]) {
 if (typeof window === 'undefined' || role === 'super_admin') return;
 let overrides: Partial<Record<Role, Permission[]>> = {};
 try {
 overrides = JSON.parse(localStorage.getItem(ROLE_OVERRIDES_KEY) ?? '{}') as Partial<Record<Role, Permission[]>>;
 } catch {
 // Invalid legacy data is replaced with a valid permission map.
 }
 overrides[role] = [...new Set(permissions)].filter(permission => permission in PERMISSION_DEFINITIONS);
 localStorage.setItem(ROLE_OVERRIDES_KEY, JSON.stringify(overrides));
 window.dispatchEvent(new CustomEvent('role-permissions-updated', { detail: { role } }));
}

export function can(permission: Permission, role: Role = getRole()): boolean {
 return getRolePermissions(role).includes(permission);
}

export function getPermissionDefinition(permission: Permission) {
 return PERMISSION_DEFINITIONS[permission];
}

export function isHigherOrEqualRole(subject: Role, target: Role): boolean {
 return ROLE_DEFINITIONS[subject].level >= ROLE_DEFINITIONS[target].level;
}

export function getPermissionGroups(): Array<{ name: string; permissions: Permission[] }> {
 const groups = new Map<string, Permission[]>();
 for (const permission of Object.keys(PERMISSION_DEFINITIONS) as Permission[]) {
 const group = PERMISSION_DEFINITIONS[permission].group;
 groups.set(group, [...(groups.get(group) ?? []), permission]);
 }
 return Array.from(groups, ([name, permissions]) => ({ name, permissions }));
}