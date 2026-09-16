export type UserRole = 'Super Admin' | 'Country Manager' | 'Gaming Team' | 'Finance' | 'Viewer';
export type UserStatus = 'Active' | 'Invited' | 'Deactivated';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  market: string;
  status: UserStatus;
  lastActive: string;
}

export const USER_SEED: AdminUser[] = [
  { id: 'user-001', name: 'Nana Sarpong', email: 'nana.sarpong@ionix.zm', role: 'Super Admin', market: 'Zambia', status: 'Active', lastActive: 'Now' },
  { id: 'user-002', name: 'Chanda Mwansa', email: 'chanda.mwansa@ionix.zm', role: 'Country Manager', market: 'Zambia', status: 'Active', lastActive: '18 min ago' },
  { id: 'user-003', name: 'Luyando Tembo', email: 'luyando.tembo@ionix.zm', role: 'Gaming Team', market: 'Zambia', status: 'Active', lastActive: '2 h ago' },
  { id: 'user-004', name: 'Mwamba Banda', email: 'mwamba.banda@ionix.zm', role: 'Finance', market: 'Zambia', status: 'Active', lastActive: 'Yesterday' },
  { id: 'user-005', name: 'Thandiwe Phiri', email: 'thandiwe.phiri@ionix.zm', role: 'Gaming Team', market: 'Zambia', status: 'Invited', lastActive: 'Invitation pending' },
  { id: 'user-006', name: 'Brian Mulenga', email: 'brian.mulenga@ionix.zm', role: 'Viewer', market: 'Zambia', status: 'Active', lastActive: '3 days ago' },
  { id: 'user-007', name: 'Natasha Zulu', email: 'natasha.zulu@ionix.zm', role: 'Finance', market: 'Zambia', status: 'Invited', lastActive: 'Invitation pending' },
  { id: 'user-008', name: 'Kelvin Nkonde', email: 'kelvin.nkonde@ionix.zm', role: 'Viewer', market: 'Zambia', status: 'Deactivated', lastActive: '14 Aug 2026' },
];

export const USER_ROLES: UserRole[] = ['Super Admin', 'Country Manager', 'Gaming Team', 'Finance', 'Viewer'];
