'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle, AlertTriangle, Check, ChevronDown, KeyRound, MoreVertical,
  Plus, Search, Shield, Trash2, UserRoundCog, UsersRound, X,
} from 'lucide-react';
import {
  can, getPermissionGroups, getRole, getRolePermissions, getSession,
  PERMISSION_DEFINITIONS, ROLE_DEFINITIONS, setRolePermissions,
  type Permission, type Role,
} from '@/lib/permissions';
import {
  addManagedUser, deleteManagedUser, getManagedUsers, updateManagedUser,
  type ManagedUser, type UserStatus,
} from '@/lib/user-management';
import { recordAudit } from '@/lib/audit';

const ROLES = Object.values(ROLE_DEFINITIONS);

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function formatActivity(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No activity' : date.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState<ManagedUser[]>(() => getManagedUsers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [matrixRole, setMatrixRole] = useState<Role>('ops_manager');
  const [activeMenuId, setActiveMenuId] = useState<ManagedUser['id'] | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', role: 'viewer' as Role, password: '', status: 'active' as UserStatus,
  });

 const refresh = () => setUsers(getManagedUsers());

  const notify = (text: string, error = false) => {
    setMessage({ text, error });
    window.setTimeout(() => setMessage(null), 3500);
  };

  const filtered = useMemo(() => users.filter(user => {
    const term = search.trim().toLowerCase();
    return (!term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
      && (roleFilter === 'all' || user.role === roleFilter)
      && (statusFilter === 'all' || user.status === statusFilter);
  }), [users, search, roleFilter, statusFilter]);

  const counts = {
    all: users.length,
    active: users.filter(user => user.status === 'active').length,
    invited: users.filter(user => user.status === 'invited').length,
    suspended: users.filter(user => user.status === 'suspended').length,
  };

  const run = (operation: () => void, success: string) => {
    try {
      operation();
      refresh();
      setActiveMenuId(null);
      notify(success);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The action could not be completed.', true);
    }
  };

  const createUser = () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 4) {
      return notify('Enter a name, email, and temporary password of at least four characters.', true);
    }
    run(() => {
      addManagedUser({ ...form, password: form.password });
      setForm({ name: '', email: '', role: 'viewer', password: '', status: 'active' });
      setShowForm(false);
    }, 'User account created successfully.');
  };

  const togglePermission = (permission: Permission) => {
    if (!can('role.manage') || matrixRole === 'super_admin') return;
    const current = getRolePermissions(matrixRole);
    const enabled = current.includes(permission);
    setRolePermissions(matrixRole, enabled ? current.filter(item => item !== permission) : [...current, permission]);
    recordAudit({
      action: 'edit',
      targetId: `ROLE-${matrixRole}`,
      targetName: ROLE_DEFINITIONS[matrixRole].label,
      market: 'Platform',
      summary: `${enabled ? 'Revoked' : 'Granted'} ${permission} for ${ROLE_DEFINITIONS[matrixRole].label}`,
    });
    setMatrixRole(role => role);
    notify('Role permissions updated.');
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  if (!can('user.view')) {
    return (
      <div className="rbac-denied">
        <Shield size={36} />
        <h3>Access restricted</h3>
        <p>You do not have permission to view or manage platform users.</p>
      </div>
    );
  }

  return (
    <div className="users-workspace">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Platform administration</p>
          <h2>Users &amp; roles</h2>
          <p className="workspace-subtitle">Manage team access, account status, and operational capabilities.</p>
        </div>
        {can('user.create') && (
          <button className="invite-btn ds-action-button ds-action-button--primary" type="button" onClick={() => setShowForm(value => !value)}>
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? 'Cancel' : 'Invite user'}
          </button>
        )}
      </div>

 {message && (
 <div className={`ds-notice ${message.error ? 'ds-notice--danger' : 'ds-notice--success'}`}>
 <span className="ds-notice__icon">
 {message.error ? <AlertTriangle size={16} /> : <Check size={16} />}
 </span>
 <span>{message.text}</span>
 </div>
 )}

      {showForm && (
        <section className="invite-panel glass-panel ds-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">New account</span>
              <h3>Invite a team member</h3>
              <p>Create an account and assign its initial access level.</p>
            </div>
          </div>
          <div className="invite-grid">
 <label><span>Full name</span><input className="ds-control" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Mary Wanjiku" /></label>
 <label><span>Work email</span><input className="ds-control" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="name@betika.com" /></label>
 <label><span>Role</span><select className="ds-select" value={form.role} onChange={event => setForm({ ...form, role: event.target.value as Role })}>{ROLES.map(role => <option value={role.id} key={role.id}>{role.label}</option>)}</select></label>
 <label><span>Temporary password</span><input className="ds-control" type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="Minimum 4 characters" /></label>
            <button className="create-btn ds-action-button ds-action-button--primary" type="button" onClick={createUser}><Plus size={16} /> Create account</button>
          </div>
        </section>
      )}

      <div className="filter-top">
        <div className="filter-group">
          <div className="tabs" aria-label="User status filters">
            {([
              ['all', 'All', counts.all],
              ['active', 'Active', counts.active],
              ['invited', 'Invited', counts.invited],
              ['suspended', 'Suspended', counts.suspended],
            ] as const).map(([status, label, count]) => (
              <button key={status} className={`tab ${statusFilter === status ? 'active' : ''}`} onClick={() => setStatusFilter(status)}>
                {label}<span className="tab-count">{count}</span>
              </button>
            ))}
          </div>
          {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button className="clear-filters ds-action-button ds-action-button--outline ds-action-button--surface" type="button" onClick={clearFilters}><X size={14} /> Clear all</button>
          )}
        </div>
      </div>

      <div className="toolbar glass-panel ds-panel">
        <div className="search-group">
          <Search size={18} className="search-icon" />
          <input aria-label="Search users" className="search-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or email..." />
          {search && <button className="clear-search ds-action-button" type="button" onClick={() => setSearch('')} title="Clear search" aria-label="Clear search"><X size={14} /></button>}
        </div>
        <div className="toolbar-controls">
          <label className="select-control">
            <span>Role</span>
            <select className="ds-select" aria-label="Filter by role" value={roleFilter} onChange={event => setRoleFilter(event.target.value as Role | 'all')}>
              <option value="all">All roles</option>
              {ROLES.map(role => <option value={role.id} key={role.id}>{role.label}</option>)}
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
      </div>

      <section className="grid-container glass-panel ds-panel">
        <div className="table-titlebar">
          <div><UsersRound size={18} /><span>Team directory</span></div>
          <span>{filtered.length} {filtered.length === 1 ? 'user' : 'users'}</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last activity</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5}>
                  <div className="empty-state">
                    <AlertCircle size={32} />
                    <p className="empty-title">No users found</p>
                    <p className="empty-sub">{search ? `No users match “${search.trim()}”.` : 'There are no users matching these filters.'}</p>
                    <button className="btn-sm ds-action-button ds-action-button--outline ds-action-button--surface" type="button" onClick={clearFilters}>Clear filters</button>
                  </div>
                </td></tr>
              )}
              {filtered.map(user => {
                const self = getSession()?.userId === user.id;
                const manageable = getRole() === 'super_admin' && !self && user.role !== 'super_admin';
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar">{initials(user.name)}</span>
                        <div className="cell-primary"><strong className="cell-title">{user.name}</strong><span className="cell-subtitle">{user.email}</span></div>
                      </div>
                    </td>
                    <td><span className="type-badge">{ROLE_DEFINITIONS[user.role].label}</span></td>
                    <td><span className={`user-status ${user.status}`}><i />{user.status}</span></td>
                    <td className="text-secondary text-sm">{formatActivity(user.lastActivity)}</td>
                    <td className="relative action-cell">
                      {self ? <span className="self-label">You</span> : manageable ? (
                        <>
                          <button className="btn-icon ds-action-button" type="button" onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)} title={`Actions for ${user.name}`} aria-label={`Actions for ${user.name}`}><MoreVertical size={17} /></button>
                          {activeMenuId === user.id && (
                            <div className="action-menu ds-dropdown-menu">
                              {can('user.suspend') && <button className="menu-item ds-dropdown-item" onClick={() => run(() => updateManagedUser(user.id, { status: user.status === 'suspended' ? 'active' : 'suspended' }), `User ${user.status === 'suspended' ? 'reactivated' : 'suspended'}.`)}><KeyRound size={14} />{user.status === 'suspended' ? 'Reactivate user' : 'Suspend user'}</button>}
                              {can('role.assign') && <label className="role-action"><span>Change role</span><select className="ds-select" value={user.role} onChange={event => run(() => updateManagedUser(user.id, { role: event.target.value as Role }), 'Role updated.')}><option value="ops_manager">Operations Manager</option><option value="approver">Approver</option><option value="support">Support Agent</option><option value="viewer">Viewer</option></select></label>}
                              {can('user.delete') && <><div className="menu-divider" /><button className="menu-item ds-dropdown-item danger" onClick={() => confirm(`Delete ${user.name}?`) && run(() => deleteManagedUser(user.id), 'User deleted.')}><Trash2 size={14} />Delete user</button></>}
                            </div>
                          )}
                        </>
                      ) : <span className="locked-label">Protected</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid-footer"><span className="page-info">Showing {filtered.length} of {users.length} users</span></div>
      </section>

      {can('role.view') && (
        <section className="permissions-card glass-panel ds-panel">
          <div className="permissions-heading">
            <div className="permissions-title">
              <span className="heading-icon"><UserRoundCog size={19} /></span>
              <div><span className="section-kicker">Access configuration</span><h3>Role permissions</h3><p>Define which operational actions each role can perform.</p></div>
            </div>
            <label className="role-picker"><span>Editing role</span><select className="ds-select" value={matrixRole} onChange={event => setMatrixRole(event.target.value as Role)}>{ROLES.map(role => <option value={role.id} key={role.id}>{role.label}</option>)}</select><ChevronDown size={14} /></label>
          </div>
          <div className="role-summary">
            <div><strong>{ROLE_DEFINITIONS[matrixRole].label}</strong><span>{ROLE_DEFINITIONS[matrixRole].description}</span></div>
            <b>{getRolePermissions(matrixRole).length} permissions</b>
          </div>
          {matrixRole === 'super_admin' && <div className="protected-note"><Shield size={15} />Super Admin is protected and always receives every registered permission.</div>}
          <div className="permission-groups">
            {getPermissionGroups().map(group => (
              <div className="permission-group" key={group.name}>
                <div className="permission-group-head"><h4>{group.name}</h4><span>{group.permissions.filter(permission => getRolePermissions(matrixRole).includes(permission)).length}/{group.permissions.length}</span></div>
                {group.permissions.map(permission => {
                  const definition = PERMISSION_DEFINITIONS[permission];
                  const enabled = getRolePermissions(matrixRole).includes(permission);
                  return (
                    <label className={`permission-row ${enabled ? 'enabled' : ''}`} key={permission}>
                      <input type="checkbox" checked={enabled} disabled={!can('role.manage') || matrixRole === 'super_admin'} onChange={() => togglePermission(permission)} />
                      <span className="permission-copy"><strong>{definition.label}</strong><small>{definition.description}</small></span>
                      <em className={`risk-${definition.risk}`}>{definition.risk}</em>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}