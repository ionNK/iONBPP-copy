'use client';

import {
    Users, AlertTriangle, TrendingDown, ArrowRight, ShieldAlert,
    Mail, MessageSquare, Gift
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from 'recharts';

// --- Mock Data ---
const RISK_SEGMENTS = [
    { id: 1, name: 'High Rollers (Declining)', count: 245, risk: 'High', value: '€45k' },
    { id: 2, name: 'New Depositors (Inactive)', count: 1200, risk: 'Medium', value: '€12k' },
    { id: 3, name: 'Sports Bettors (Losers)', count: 850, risk: 'High', value: '€28k' },
    { id: 4, name: 'Casino Frequent (Churned)', count: 560, risk: 'Critical', value: '€32k' },
];

const CHURN_TREND = [
    { month: 'Jan', rate: 4.2 },
    { month: 'Feb', rate: 4.5 },
    { month: 'Mar', rate: 4.1 },
    { month: 'Apr', rate: 3.8 },
    { month: 'May', rate: 4.6 }, // Spike
    { month: 'Jun', rate: 4.3 },
];

const RISK_DISTRIBUTION = [
    { name: 'Low Risk', value: 65, color: '#4ade80' },
    { name: 'Medium Risk', value: 20, color: '#F2D641' },
    { name: 'High Risk', value: 15, color: '#f87171' },
];

export default function ChurnPredictionPage() {
    return (
        <div className="ds-predict-churn prediction-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Churn Prediction</h1>
                    <p className="page-subtitle">AI-driven identification of at-risk player segments.</p>
                </div>
            </div>

            {/* Top Stats */}
            <div className="stats-row">
                <div className="glass-panel stat-card">
                    <div className="stat-icon"><ShieldAlert size={24} color="#f87171" /></div>
                    <div className="stat-info">
                        <div className="stat-value">2,855</div>
                        <div className="stat-label">At-Risk Players</div>
                    </div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-icon"><TrendingDown size={24} color="#F2D641" /></div>
                    <div className="stat-info">
                        <div className="stat-value">4.3%</div>
                        <div className="stat-label">Predicted Churn Rate</div>
                    </div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-icon"><Users size={24} color="#60a5fa" /></div>
                    <div className="stat-info">
                        <div className="stat-value">€117k</div>
                        <div className="stat-label">Revenue at Risk</div>
                    </div>
                </div>
            </div>

            <div className="content-grid">
                {/* Main Risk Table */}
                <div className="glass-panel main-panel">
                    <div className="panel-header">
                        <h3>High Risk Segments</h3>
                    </div>
                    <table className="risk-table">
                        <thead>
                            <tr>
                                <th>Segment Name</th>
                                <th>Player Count</th>
                                <th>Est. Value</th>
                                <th>Risk Level</th>
                                <th className="text-right">Recommended Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RISK_SEGMENTS.map(seg => (
                                <tr key={seg.id}>
                                    <td className="font-medium">{seg.name}</td>
                                    <td>{seg.count}</td>
                                    <td>{seg.value}</td>
                                    <td>
                                        <span className={`risk-badge ${seg.risk.toLowerCase()}`}>
                                            {seg.risk}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="action-group">
                                            <button className="action-btn" title="Send Email"><Mail size={14} /></button>
                                            <button className="action-btn" title="Send SMS"><MessageSquare size={14} /></button>
                                            <button className="action-btn primary" title="Send Bonus">
                                                <Gift size={14} /> Send Offer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Sidebar Charts */}
                <div className="side-column">
                    {/* Risk Distribution */}
                    <div className="glass-panel chart-panel">
                        <h3>Risk Distribution</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={RISK_DISTRIBUTION}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {RISK_DISTRIBUTION.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--color-bg-panel)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            boxShadow: 'var(--shadow-md)'
                                        }}
                                        itemStyle={{ color: 'var(--color-text-primary)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="legend">
                                {RISK_DISTRIBUTION.map(d => (
                                    <div key={d.name} className="legend-item">
                                        <span className="dot" style={{ background: d.color }}></span>
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Churn Trend */}
                    <div className="glass-panel chart-panel">
                        <h3>6-Month Trend</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={CHURN_TREND}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--color-bg-input)', opacity: 0.4 }}
                                        contentStyle={{
                                            backgroundColor: 'var(--color-bg-panel)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            boxShadow: 'var(--shadow-md)'
                                        }}
                                        itemStyle={{ color: 'var(--color-text-primary)' }}
                                        labelStyle={{ color: 'var(--color-text-secondary)' }}
                                    />
                                    <Bar dataKey="rate" fill="var(--color-betika-yellow)" radius={[4, 4, 0, 0]} opacity={0.8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

    </div>
    );
}
