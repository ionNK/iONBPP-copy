'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileText, DollarSign, Search, Filter, Shield, Activity, ChevronRight, MoreHorizontal, Download, History, Lock, MessageSquareWarning } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import ResponsibleGambling from '@/components/governance/ResponsibleGambling';
import { useCountry } from '@/context/CountryContext';
import ActionModal from '@/components/governance/ActionModal';
import { recordAudit } from '@/lib/audit';
import { can } from '@/lib/permissions';

type Tab = 'overview' | 'approvals' | 'budgets' | 'audits' | 'compliance';

const APPROVALS_DATA = [
 { id: 'REQ-1024', name: 'Kenya Mega Jackpot Boost', requestor: 'Sarah K.', market: 'Kenya', amount: '€12,500', urgency: 'High', status: 'Pending L2', created: '2 mins ago' },
 { id: 'REQ-1023', name: 'Ghana Welcome Offer', requestor: 'David O.', market: 'Ghana', amount: '€3,200', urgency: 'Medium', status: 'Pending L1', created: '1 hour ago' },
 { id: 'REQ-1021', name: 'Ethiopia Retention', requestor: 'Mesfin T.', market: 'Ethiopia', amount: '€800', urgency: 'Low', status: 'Pending L1', created: '4 hours ago' },
];
const AUDIT_LOGS = [
 { id: 1, user: 'Admin User', action: 'Approved Promotion', target: 'TZ-2023-005', time: '10 mins ago', type: 'success' },
 { id: 2, user: 'Sarah K.', action: 'Modified Budget Cap', target: 'Kenya Market', time: '2 hours ago', type: 'warning' },
 { id: 3, user: 'System', action: 'Auto-Rejected Request', target: 'REQ-0099 (Over Budget)', time: '5 hours ago', type: 'error' },
 { id: 4, user: 'David O.', action: 'Created Promotion', target: 'GH-2024-001', time: '1 day ago', type: 'info' },
];
const BUDGET_DATA = [
 { market: 'Kenya', cap: 50000, used: 32000, percent: 64, color: '#699951' },
 { market: 'Ghana', cap: 30000, used: 12500, percent: 41, color: '#F2D641' },
 { market: 'Ethiopia', cap: 20000, used: 18500, percent: 92, color: '#ef4444' },
 { market: 'Tanzania', cap: 25000, used: 8000, percent: 32, color: '#06b6d4' },
];
const COMPLIANCE_DATA = [
 { name: 'Compliant', value: 85, color: '#699951' },
 { name: 'Warnings', value: 10, color: '#F2D641' },
 { name: 'Violations', value: 5, color: '#ef4444' },
];

function StatusBadge({ status }: { status: string }) {
 let mode = 'default';
 if (status.includes('High') || status.includes('L2')) mode = 'high';
 else if (status.includes('Medium')) mode = 'medium';
 else if (status.includes('Low')) mode = 'low';
 return <span className={`status-badge ${mode}`}>{status}</span>;
}

export default function GovernancePage() {
 const { isInScope, selectedCountry } = useCountry();
 const scopedBudgets = BUDGET_DATA.filter(b => isInScope(b.market));
 const [activeTab, setActiveTab] = useState<Tab>('overview');
 const [approvals, setApprovals] = useState(APPROVALS_DATA.filter(a => isInScope(a.market)));
 const [auditLogs, setAuditLogs] = useState(AUDIT_LOGS);
 type ReviewAction = 'approve' | 'reject' | 'request_changes';
 const [review, setReview] = useState<{ id: string; action: ReviewAction } | null>(null);
 const canApprove = can('promotion.approve');
 const activeItem = review ? approvals.find(a => a.id === review.id) ?? null : null;
 const REVIEW_META: Record<ReviewAction, { title: string; description: string; confirmLabel: string; danger: boolean; logType: string; verb: string }> = {
 approve: { title: 'Approve Request', description: 'Approving moves this promotion forward for launch. Add an optional note for the record.', confirmLabel: 'Approve', danger: false, logType: 'success', verb: 'Approved' },
 reject: { title: 'Reject Request', description: 'Rejecting removes the request from the queue. A reason is required for the audit trail.', confirmLabel: 'Reject', danger: true, logType: 'error', verb: 'Rejected' },
 request_changes: { title: 'Request Changes', description: 'Send this request back to the requestor with feedback. It stays in the queue until resubmitted.', confirmLabel: 'Send Request', danger: false, logType: 'warning', verb: 'Requested changes on' },
 };
 const confirmReview = (reason: string) => {
 if (!review || !activeItem) return;
 const meta = REVIEW_META[review.action];
 if (review.action !== 'request_changes') setApprovals(prev => prev.filter(a => a.id !== activeItem.id));
 setAuditLogs(prev => [{ id: Date.now(), user: 'You (Admin)', action: `${meta.verb} ${activeItem.name}`, target: activeItem.id, time: 'Just now', type: meta.logType }, ...prev]);
 recordAudit({ action: review.action, targetId: activeItem.id, targetName: activeItem.name, market: activeItem.market, reason });
 setReview(null);
 };

 return <div className="governance-page governance-container ds-page-shell">
 <div className="page-header"><div><h1 className="page-title">Governance Console</h1><p className="page-subtitle">Manage approvals, compliance, and audit trails{selectedCountry ? ` · ${selectedCountry.name}` : ' · All Markets'}.</p></div><div className="header-actions"><button className="btn btn-secondary"><Download size={16} /> Export Reports</button><button className="btn btn-primary"><Lock size={16} /> Update Policies</button></div></div>
 <div className="tabs-nav">{[{ id: 'overview', label: 'Overview', icon: Activity }, { id: 'approvals', label: 'Approvals Queue', icon: CheckCircle2, count: approvals.length }, { id: 'budgets', label: 'Budget Controls', icon: DollarSign }, { id: 'compliance', label: 'Compliance', icon: Shield }, { id: 'audits', label: 'Audit Logs', icon: History }].map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}><tab.icon size={18} />{tab.label}{tab.count && <span className="count-badge">{tab.count}</span>}{activeTab === tab.id && <span className="active-line" />}</button>)}</div>
 <div className="tab-content">
 {activeTab === 'overview' && <div className="overview-grid"><div className="kpi-row">
 <div className="glass-panel kpi-card"><div className="kpi-header"><div className="icon-box blue"><FileText size={20} /></div><span className="badge">Target: 24h</span></div><div className="kpi-value">4.2 hrs</div><div className="kpi-label">Avg. Approval Time</div></div>
 <div className="glass-panel kpi-card"><div className="kpi-header"><div className="icon-box green"><Activity size={20} /></div><span className="badge success">+2.4%</span></div><div className="kpi-value">98.5%</div><div className="kpi-label">Compliance Score</div></div>
 <div className="glass-panel kpi-card"><div className="kpi-header"><div className="icon-box red"><AlertTriangle size={20} /></div><span className="badge warning">High Risk</span></div><div className="kpi-value">3</div><div className="kpi-label">Pending L2 Approvals</div></div>
 <div className="glass-panel kpi-card"><div className="kpi-header"><div className="icon-box yellow"><DollarSign size={20} /></div><span className="badge">Monthly</span></div><div className="kpi-value">62%</div><div className="kpi-label">Budget Utilization</div></div>
 </div><div className="charts-row"><div className="glass-panel chart-card full-width"><h3 className="card-title">Budget vs Spend by Market</h3><div className="chart-container"><ResponsiveContainer width="100%" height="100%"><BarChart data={scopedBudgets} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}><XAxis type="number" hide /><YAxis dataKey="market" type="category" stroke="var(--color-text-secondary)" width={80} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', borderRadius: '8px' }} itemStyle={{ color: 'var(--color-text-primary)' }} labelStyle={{ color: 'var(--color-text-secondary)' }} cursor={{ fill: 'transparent' }} /><Bar dataKey="cap" fill="var(--color-bg-input)" barSize={20} radius={[0, 4, 4, 0]} stackId="a" /><Bar dataKey="used" fill="var(--color-betika-yellow)" barSize={20} radius={[0, 4, 4, 0]} stackId="a" /></BarChart></ResponsiveContainer></div></div><div className="glass-panel chart-card"><h3 className="card-title">Compliance Health</h3><div className="chart-container pie-wrapper"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={COMPLIANCE_DATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{COMPLIANCE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', borderRadius: '8px' }} itemStyle={{ color: 'var(--color-text-primary)' }} /></PieChart></ResponsiveContainer><div className="pie-center"><span className="rating">A+</span><span className="rating-label">Rating</span></div></div></div></div></div>}
 {activeTab === 'approvals' && <div className="glass-panel table-panel"><div className="panel-header"><h3 className="panel-title"><AlertTriangle size={18} color="#F2D641" />Pending Approvals</h3><div className="panel-actions"><button className="icon-btn"><Filter size={16} /></button><button className="icon-btn"><Search size={16} /></button></div></div>{approvals.length === 0 ? <div className="empty-state"><CheckCircle2 size={48} color="#4ade80" className="empty-state-icon" /><p>All caught up! No pending approvals.</p></div> : <div className="table-responsive"><table className="data-table"><thead><tr><th>Request ID</th><th>Promotion Name</th><th>Requestor</th><th>Market</th><th>Cost Est.</th><th>Urgency</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{approvals.map((item) => <tr key={item.id}><td className="font-mono text-muted">{item.id}</td><td className="font-medium text-primary">{item.name}</td><td className="text-secondary">{item.requestor}</td><td><span className="tag">{item.market}</span></td><td className="text-primary font-mono">{item.amount}</td><td><StatusBadge status={item.urgency} /></td><td><span className="status-text">{item.status}</span></td><td><div className="action-buttons"><button className="action-btn approve" title={canApprove ? 'Approve' : 'You do not have approval permission'} disabled={!canApprove} onClick={() => setReview({ id: item.id, action: 'approve' })}><CheckCircle2 size={18} /></button><button className="action-btn changes" title="Request Changes" onClick={() => setReview({ id: item.id, action: 'request_changes' })}><MessageSquareWarning size={18} /></button><button className="action-btn reject" title={canApprove ? 'Reject' : 'You do not have approval permission'} disabled={!canApprove} onClick={() => setReview({ id: item.id, action: 'reject' })}><XCircle size={18} /></button></div></td></tr>)}</tbody></table></div>}</div>}
 {activeTab === 'budgets' && <div className="budgets-grid">{scopedBudgets.map((b) => <div key={b.market} className="glass-panel budget-card"><div className="card-header"><div><h3 className="card-title">{b.market} Market</h3><p className="card-subtitle">Monthly Budget Cap</p></div><button className="icon-btn ghost"><MoreHorizontal size={20} /></button></div><div className="budget-stats"><span className="stat-item">Spent: <span className="mono">€{b.used.toLocaleString()}</span></span><span className="stat-item">Cap: <span className="mono">€{b.cap.toLocaleString()}</span></span></div><div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${b.percent}%`, backgroundColor: b.color }} /></div><div className="budget-footer"><span className={`utilization ${b.percent > 90 ? 'critical' : ''}`}>{b.percent}% Utilized</span><button className="text-link">Adjust Cap</button></div></div>)}{scopedBudgets.length === 0 && <div className="empty-state empty-state--padded"><p>No budgets available for the selected scope.</p></div>}</div>}
 {activeTab === 'compliance' && <ResponsibleGambling />}
 {activeTab === 'audits' && <div className="glass-panel table-panel"><div className="panel-header"><div className="search-bar"><input type="text" placeholder="Search logs..." /></div><button className="btn btn-secondary btn-sm"><Filter size={14} /> Filter Activity</button></div><div className="log-list">{auditLogs.map((log) => <div key={log.id} className="log-item group"><div className="log-content"><div className={`status-dot ${log.type}`} /><div><p className="log-text"><span className="user">{log.user}</span> {log.action} <span className="target">{log.target}</span></p><p className="log-time"><Clock size={10} /> {log.time}</p></div></div><button className="icon-btn ghost hidden group-hover:block"><ChevronRight size={16} /></button></div>)}</div><div className="panel-footer"><button className="text-link muted">View All History</button></div></div>}
 </div>
 {review && activeItem && <ActionModal title={REVIEW_META[review.action].title} description={`${activeItem.id} · ${activeItem.name} — ${REVIEW_META[review.action].description}`} confirmLabel={REVIEW_META[review.action].confirmLabel} danger={REVIEW_META[review.action].danger} reasonRequired={review.action !== 'approve'} onConfirm={confirmReview} onCancel={() => setReview(null)} />}
 </div>;
}
