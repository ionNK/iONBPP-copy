import { getRole, getSession, isHigherOrEqualRole, isRole, ROLE_LABEL, type Role } from './permissions';
import { recordAudit } from './audit';

export type UserStatus = 'active' | 'suspended' | 'invited';

export interface ManagedUser {
 id: number;
 name: string;
 email: string;
 role: Role;
 status: UserStatus;
 password?: string;
 lastActivity: string;
}

const STORAGE_KEY = 'settings_users';

const SEED_USERS: ManagedUser[] = [
 { id: 1, name: 'Admin User', email: 'admin@betika.com', role: 'super_admin', status: 'active', password: '1234', lastActivity: new Date().toISOString() },
 { id: 2, name: 'Nana', email: 'nana@gmail.com', role: 'super_admin', status: 'active', password: '1234', lastActivity: new Date().toISOString() },
 { id: 3, name: 'Sarah K.', email: 'sarah.k@betika.com', role: 'ops_manager', status: 'active', password: 'demo1234', lastActivity: new Date(Date.now() - 86400000).toISOString() },
 { id: 4, name: 'David O.', email: 'david.o@betika.com', role: 'viewer', status: 'suspended', password: 'demo1234', lastActivity: new Date(Date.now() - 172800000).toISOString() },
];

function normalise(user: Partial<ManagedUser> & { id: number; name: string; email: string }): ManagedUser {
 const legacyRoles: Record<string, Role> = {
  'Super Admin': 'super_admin', Admin: 'super_admin', Editor: 'ops_manager',
  'CRM Manager': 'ops_manager', Analyst: 'viewer', Viewer: 'viewer',
  Approver: 'approver', 'Support Agent': 'support',
 };
 const role = isRole(user.role) ? user.role : legacyRoles[String(user.role)] ?? 'viewer';
 const legacyStatus = String(user.status ?? 'active').toLowerCase();
 return {
  id: user.id,
  name: user.name,
  email: user.email.toLowerCase(),
  role,
  status: legacyStatus === 'inactive' ? 'suspended' : legacyStatus === 'invited' ? 'invited' : 'active',
  password: user.password,
  lastActivity: user.lastActivity ?? new Date().toISOString(),
 };
}

export function getManagedUsers(): ManagedUser[] {
 if (typeof window === 'undefined') return SEED_USERS;
 try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
   localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
   return SEED_USERS;
  }
  const parsed = JSON.parse(stored) as Array<Partial<ManagedUser> & { id: number; name: string; email: string }>;
  return parsed.map(normalise);
 } catch {
  return SEED_USERS;
 }
}

export function saveManagedUsers(users: ManagedUser[]) {
 if (typeof window === 'undefined') return;
 localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
 window.dispatchEvent(new CustomEvent('managed-users-updated'));
}

function activeSuperAdmins(users: ManagedUser[]) {
 return users.filter(user => user.role === 'super_admin' && user.status === 'active');
}

function canManageTarget(target: ManagedUser) {
 const actor = getSession();
 if (!actor || actor.role !== 'super_admin') return false;
 if (actor.userId === target.id) return false;
 return !isHigherOrEqualRole(target.role, actor.role);
}

export function addManagedUser(input: Omit<ManagedUser, 'id' | 'lastActivity'>): ManagedUser {
 const users = getManagedUsers();
 if (users.some(user => user.email === input.email.trim().toLowerCase())) throw new Error('A user with this email already exists.');
 const user: ManagedUser = {
  ...input,
  id: Math.max(0, ...users.map(existing => existing.id)) + 1,
  email: input.email.trim().toLowerCase(),
  name: input.name.trim(),
  lastActivity: new Date().toISOString(),
 };
 saveManagedUsers([...users, user]);
 recordAudit({ action: 'create', targetId: `USER-${user.id}`, targetName: user.name, market: 'Platform', summary: `Created user ${user.name} (${ROLE_LABEL[user.role]})` });
 return user;
}

export function updateManagedUser(id: number, changes: Partial<Pick<ManagedUser, 'name' | 'email' | 'role' | 'status'>>) {
 const users = getManagedUsers();
 const target = users.find(user => user.id === id);
 if (!target) throw new Error('User was not found.');
 if (!canManageTarget(target)) throw new Error('You cannot modify your own, peer, or higher-privilege account.');
 if (changes.email && users.some(user => user.id !== id && user.email === changes.email!.trim().toLowerCase())) throw new Error('A user with this email already exists.');
 const next = { ...target, ...changes, name: changes.name?.trim() ?? target.name, email: changes.email?.trim().toLowerCase() ?? target.email };
 if (target.role === 'super_admin' && target.status === 'active' && (next.status !== 'active' || next.role !== 'super_admin') && activeSuperAdmins(users).length <= 1) {
  throw new Error('The final active Super Admin cannot be suspended or demoted.');
 }
 saveManagedUsers(users.map(user => user.id === id ? next : user));
 recordAudit({ action: 'edit', targetId: `USER-${id}`, targetName: next.name, market: 'Platform', summary: `Updated user ${next.name}` });
 return next;
}

export function deleteManagedUser(id: number) {
 const users = getManagedUsers();
 const target = users.find(user => user.id === id);
 if (!target) throw new Error('User was not found.');
 if (!canManageTarget(target)) throw new Error('You cannot delete your own, peer, or higher-privilege account.');
 if (target.role === 'super_admin' && target.status === 'active' && activeSuperAdmins(users).length <= 1) throw new Error('The final active Super Admin cannot be deleted.');
 saveManagedUsers(users.filter(user => user.id !== id));
 recordAudit({ action: 'edit', targetId: `USER-${id}`, targetName: target.name, market: 'Platform', summary: `Deleted user ${target.name}` });
}

export function authenticateManagedUser(email: string, password: string): ManagedUser | null {
 const user = getManagedUsers().find(candidate => candidate.email === email.trim().toLowerCase() && candidate.password === password);
 if (!user || user.status !== 'active') return null;
 const updated = { ...user, lastActivity: new Date().toISOString() };
 saveManagedUsers(getManagedUsers().map(candidate => candidate.id === user.id ? updated : candidate));
 return updated;
}