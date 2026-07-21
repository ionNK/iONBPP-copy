// Lightweight permission gating for governance-sensitive actions.
//
// The current signed-in role is stored in localStorage under `admin_role`
// (defaults to `super_admin` for demo). Swap for real auth/session later —
// the `can()` API stays the same.

export type Role = 'super_admin' | 'ops_manager' | 'approver' | 'support' | 'viewer';

export type Permission =
  | 'promotion.approve'
  | 'promotion.reject'
  | 'promotion.request_changes'
  | 'promotion.pause'
  | 'promotion.resume'
  | 'promotion.end'
  | 'promotion.emergency_stop'
  | 'promotion.edit'
  | 'customer.lookup'
  | 'audit.view';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'promotion.approve',
    'promotion.reject',
    'promotion.request_changes',
    'promotion.pause',
    'promotion.resume',
    'promotion.end',
    'promotion.emergency_stop',
    'promotion.edit',
    'customer.lookup',
    'audit.view',
  ],
  ops_manager: [
    'promotion.pause',
    'promotion.resume',
    'promotion.end',
    'promotion.emergency_stop',
    'promotion.edit',
    'customer.lookup',
    'audit.view',
  ],
  approver: [
    'promotion.approve',
    'promotion.reject',
    'promotion.request_changes',
    'audit.view',
  ],
  support: ['customer.lookup'],
  viewer: ['audit.view'],
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin',
  ops_manager: 'Operations Manager',
  approver: 'Approver',
  support: 'Support Agent',
  viewer: 'Viewer',
};

export function getRole(): Role {
  if (typeof window === 'undefined') return 'super_admin';
  const r = localStorage.getItem('admin_role') as Role | null;
  return r && r in ROLE_PERMISSIONS ? r : 'super_admin';
}

export function setRole(role: Role) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_role', role);
  window.dispatchEvent(new CustomEvent('admin-role-updated'));
}

export function can(permission: Permission, role: Role = getRole()): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
