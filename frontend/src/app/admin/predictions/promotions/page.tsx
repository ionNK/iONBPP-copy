'use client';

// Fix for Page Refresh Flash: Added loading.tsx to handle hydration state gracefully.


import { useState } from 'react';
import {
    Users, TrendingUp, AlertTriangle, Shield, CheckCircle,
    ChevronRight, Star, AlertOctagon, ArrowUpRight, BarChart2, Lightbulb, Activity
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Types ---
interface Recommendation {
    type: string;
    match_score: string;
    raw_score?: number;
    model_used?: string;
    risk_penalty?: string;
    risk_status: string;
    reason: string;
}

interface PlayerProfile {
    player_id: string;
    segment: string;
    churn_risk: string;
    ltv: string;
    crg_score: number;
    risk_action: string;
    recommendations: Recommendation[];
}

import RECOMMENDATIONS_DATA from '@/data/recommendations.json';

// --- Helper Components ---
const RiskBadge = ({ action, score }: { action: string, score: number }) => {
    let color = 'green';
    let icon = <CheckCircle size={14} />;

    if (action === 'BLOCK') {
        color = 'red';
        icon = <AlertOctagon size={14} />;
    } else if (action === 'DOWNGRADE') {
        color = 'yellow';
        icon = <AlertTriangle size={14} />;
    }

    return (
        <div className={`risk-badge ${action.toLowerCase()}`}>
            {icon}
            <span>{action} (CRG: {score})</span>
        </div>
    );
};

const SIMULATION_DATA = [
    { month: 'Jan', revenue: 120000, cost: 45000 },
    { month: 'Feb', revenue: 135000, cost: 48000 },
    { month: 'Mar', revenue: 128000, cost: 46000 },
    { month: 'Apr', revenue: 142000, cost: 52000 },
    { month: 'May', revenue: 155000, cost: 55000 },
    { month: 'Jun', revenue: 168000, cost: 58000 },
];

export default function PromotionsPredictionPage() {
    const [activeTab, setActiveTab] = useState('simulator');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>(RECOMMENDATIONS_DATA[0].player_id);
    const selectedPlayer = RECOMMENDATIONS_DATA.find(p => p.player_id === selectedPlayerId) as PlayerProfile;

    return (
        <div className="ds-predict-promotions promotions-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Promotion Intelligence</h1>
                    <p className="page-subtitle">Forecast campaign performance and get AI-driven player recommendations.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs-nav">
                <button
                    onClick={() => setActiveTab('simulator')}
                    className={activeTab === 'simulator' ? 'active' : ''}
                >
                    <BarChart2 size={18} /> Campaign Simulator
                </button>
                <button
                    onClick={() => setActiveTab('recommendations')}
                    className={activeTab === 'recommendations' ? 'active' : ''}
                >
                    <Users size={18} /> Player Predictions
                </button>
            </div>

            {/* --- CAMPAIGN SIMULATOR TAB --- */}
            {activeTab === 'simulator' && (
                <div className="simulator-view">
                    <div className="glass-panel">
                        <h3><Lightbulb size={18} /> Campaign Forecaster</h3>
                        <p className="text-secondary mb-4">Simulate the impact of a new promotion on revenue and engagement.</p>

                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={SIMULATION_DATA}>
                                    <XAxis dataKey="month" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--color-bg-panel)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            boxShadow: 'var(--shadow-md)'
                                        }}
                                        itemStyle={{ color: 'var(--color-text-primary)' }}
                                        labelStyle={{ color: 'var(--color-text-secondary)' }}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PLAYER RECOMMENDATIONS TAB --- */}
            {activeTab === 'recommendations' && (
                <div className="recommendations-layout">
                    {/* Sidebar: Player Queue */}
                    <div className="players-sidebar glass-panel">
                        <div className="sidebar-header">
                            <h3><Users size={18} /> Player Queue</h3>
                            <span className="count-badge">{RECOMMENDATIONS_DATA.length}</span>
                        </div>
                        <div className="player-list">
                            {RECOMMENDATIONS_DATA.map((player: PlayerProfile) => (
                                <button
                                    key={player.player_id}
                                    className={`player-item ${selectedPlayerId === player.player_id ? 'active' : ''}`}
                                    onClick={() => setSelectedPlayerId(player.player_id)}
                                >
                                    <div className="avatar">{player.player_id.substring(1, 3)}</div>
                                    <div className="info">
                                        <span className="pid">{player.player_id}</span>
                                        <span className="seg">{player.segment}</span>
                                    </div>
                                    {player.risk_action !== 'ALLOW' && (
                                        <div className={`mini-dot ${player.risk_action.toLowerCase()}`} title={player.risk_action}></div>
                                    )}
                                    <ChevronRight size={14} className="arrow" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="rec-content">
                        {/* Model Performance Snapshot */}
                        <div className="glass-panel model-perf-panel">
                            <div className="mp-header">
                                <div className="mp-title">
                                    <Activity size={16} className="text-yellow" />
                                    <span>Model Performance: <strong>HistGradientBoosting</strong></span>
                                </div>
                                <span className="mp-status">Production v2.1</span>
                            </div>
                            <div className="mp-grid">
                                <div className="mp-metric">
                                    <span className="label">Accuracy</span>
                                    <span className="value">89.4%</span>
                                    <span className="delta pos">+2.1%</span>
                                </div>
                                <div className="mp-metric">
                                    <span className="label">AUC-ROC</span>
                                    <span className="value">0.92</span>
                                    <span className="delta pos">+0.05</span>
                                </div>
                                <div className="mp-metric">
                                    <span className="label">Precision</span>
                                    <span className="value">0.87</span>
                                    <span className="delta pos">+1.4%</span>
                                </div>
                                <div className="mp-metric">
                                    <span className="label">Recall</span>
                                    <span className="value">0.85</span>
                                    <span className="delta neg">-0.2%</span>
                                </div>
                            </div>
                            <div className="mp-comparison">
                                <span className="label">Benchmark vs. Previous Best (RandomForest):</span>
                                <div className="comp-bar">
                            <div className="bar-segment current conf-bar-89" title="HistGradientBoosting (89%)"></div>
                            <div className="bar-segment prev conf-bar-82" title="RandomForest (82%)"></div>
                                </div>
                            </div>
                        </div>

                        {selectedPlayer && (
                            <>
                                {/* Header Profile */}
                                <div className="glass-panel profile-header">
                                    <div className="profile-left">
                                        <div className="big-avatar">{selectedPlayer.player_id.substring(1, 3)}</div>
                                        <div>
                                            <h1>{selectedPlayer.player_id}</h1>
                                            <div className="meta-tags">
                                                <span className="tag">{selectedPlayer.segment}</span>
                                                <span className="tag ltv">LTV: {selectedPlayer.ltv}</span>
                                                <span className="tag churn">Churn Risk: {selectedPlayer.churn_risk}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="profile-right">
                                        <div className="risk-indicator">
                                            <span className="label">Safety Status</span>
                                            <RiskBadge action={selectedPlayer.risk_action} score={selectedPlayer.crg_score} />
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations Grid */}
                                <h2 className="section-title"><Star size={18} /> Top AI Recommendations</h2>

                                {selectedPlayer.risk_action === 'BLOCK' ? (
                                    <div className="blocked-state glass-panel">
                                        <AlertOctagon size={48} className="text-red" />
                                        <h3>Promotions Blocked</h3>
                                        <p>This player is flagged as <strong>High Risk</strong> by the CRG Safety Layer.</p>
                                        <p>All promotional offers have been suppressed to comply with Responsible Gambling regulations.</p>
                                    </div>
                                ) : (
                                    <div className="rec-grid">
                                        {selectedPlayer.recommendations.map((rec, i) => (
                                            <div key={i} className="glass-panel rec-card">
                                                <div className="card-header">
                                                    <div className="rank">#{i + 1}</div>
                                                    <div className="match-score">
                                                        <TrendingUp size={14} /> {rec.match_score} Match
                                                    </div>
                                                </div>

                                                <h3>{rec.type}</h3>

                                                {/* Model Confidence & Details */}
                                                <div className="model-details">
                                                    <div className="m-detail-row">
                                                        <span className="label">Model:</span>
                                                        <span className="val">{rec.model_used || 'Hybrid Ensemble'}</span>
                                                    </div>
                                                    <div className="m-detail-row">
                                                        <span className="label">Confidence:</span>
                                                        <span className="val">{rec.raw_score ? (rec.raw_score * 100).toFixed(1) + '%' : 'N/A'}</span>
                                                    </div>
                                                    {rec.risk_penalty && rec.risk_penalty !== 'None' && (
                                                        <div className="m-detail-row penalty">
                                                            <span className="label">Risk Penalty:</span>
                                                            <span className="val">{rec.risk_penalty} Applied</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="reason-box">
                                                    <span className="label">Why this offer?</span>
                                                    <p>{rec.reason}</p>
                                                </div>

                                                {rec.risk_status && (
                                                    <div className="risk-mod-notice">
                                                        <Shield size={12} /> {rec.risk_status}
                                                    </div>
                                                )}

                                                <button className="btn-action">
                                                    Deploy Offer <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
