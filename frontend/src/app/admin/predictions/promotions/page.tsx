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
        <div className="promotions-container">
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
                                    <div className="bar-segment current" style={{ width: '89%' }} title="HistGradientBoosting (89%)"></div>
                                    <div className="bar-segment prev" style={{ width: '82%' }} title="RandomForest (82%)"></div>
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

            <style jsx>{`
            .promotions-container { max-width: 1400px; margin: 0 auto; padding: 24px; color: var(--color-text-primary); }
            .page-header { margin-bottom: 24px; }
            .page-title { font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: var(--color-text-primary); }
            .page-subtitle { color: var(--color-text-secondary); margin: 0; font-size: 14px; }
            
            .text-secondary { color: var(--color-text-secondary); }
            .mb-4 { margin-bottom: 16px; }

            .tabs-nav { display: flex; gap: 24px; border-bottom: 1px solid var(--color-border); margin-bottom: 24px; }
            .tabs-nav button {
                background: transparent; border: none; color: var(--color-text-secondary); padding: 12px 4px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid transparent; transition: all 0.2s;
            }
            .tabs-nav button.active { color: var(--color-betika-yellow); border-bottom-color: var(--color-betika-yellow); }
            .tabs-nav button:hover { color: var(--color-text-primary); }

            .recommendations-layout {
                display: grid; grid-template-columns: 280px 1fr; gap: 24px;
                height: calc(100vh - 200px); 
            }

            /* Sidebar */
            .players-sidebar { display: flex; flex-direction: column; overflow: hidden; height: 100%; border: 1px solid var(--color-border); }
            .sidebar-header { padding: 16px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: var(--color-bg-sidebar); }
            .sidebar-header h3 { margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px; color: var(--color-text-primary); }
            .count-badge { background: var(--color-bg-input); color: var(--color-text-secondary); padding: 2px 8px; border-radius: 10px; font-size: 11px; border: 1px solid var(--color-border); }
            
            .player-list { overflow-y: auto; flex: 1; padding: 8px; background: var(--color-bg-panel); }
            .player-item {
                display: flex; align-items: center; gap: 12px; width: 100%;
                padding: 10px; border: 1px solid transparent; background: transparent;
                border-radius: 8px; cursor: pointer; transition: all 0.2s;
                color: var(--color-text-primary); text-align: left;
            }
            .player-item:hover { background: var(--color-bg-input); }
            .player-item.active { background: var(--color-bg-input-focus); border-color: var(--color-border); box-shadow: var(--shadow-sm); }
            
            .avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
            .info { flex: 1; display: flex; flex-direction: column; }
            .pid { font-size: 13px; font-weight: 600; }
            .seg { font-size: 11px; color: var(--color-text-muted); }
            .arrow { opacity: 0; transition: 0.2s; color: var(--color-text-muted); }
            .player-item.active .arrow { opacity: 1; color: var(--color-betika-yellow); }
            
            .mini-dot { width: 8px; height: 8px; border-radius: 50%; }
            .mini-dot.block { background: #ef4444; }
            .mini-dot.downgrade { background: #ca8a04; }

            /* Main Content */
            .rec-content { overflow-y: auto; padding-right: 8px; }
            .profile-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; margin-bottom: 32px; border: 1px solid var(--color-border); }
            .profile-left { display: flex; gap: 24px; align-items: center; }
            .big-avatar { width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #fff; box-shadow: var(--shadow-lg); }
            .profile-left h1 { margin: 0 0 8px 0; font-size: 24px; color: var(--color-text-primary); }
            .meta-tags { display: flex; gap: 8px; }
            .tag { font-size: 11px; background: var(--color-bg-input); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--color-border); color: var(--color-text-secondary); }
            .tag.ltv { color: #22c55e; border-color: rgba(34, 197, 94, 0.2); }
            .tag.churn { color: #ca8a04; border-color: rgba(202, 138, 4, 0.2); }

            .risk-indicator { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
            .risk-indicator .label { font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); }
            .risk-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; }
            .risk-badge.allow { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
            .risk-badge.downgrade { background: rgba(202, 138, 4, 0.1); color: #ca8a04; border: 1px solid rgba(202, 138, 4, 0.2); }
            .risk-badge.block { background: rgba(220, 38, 38, 0.1); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.2); }

            .section-title { font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: var(--color-betika-yellow); font-weight: 700; }

            .rec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
            .rec-card { padding: 24px; display: flex; flex-direction: column; position: relative; transition: all 0.2s; border: 1px solid var(--color-border); background: var(--color-bg-panel); box-shadow: var(--shadow-sm); }
            .rec-card:hover { transform: translateY(-4px); border-color: var(--color-betika-yellow); box-shadow: var(--shadow-md); }
            
            .card-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
            .rank { width: 24px; height: 24px; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }
            .match-score { font-size: 12px; color: #22c55e; font-weight: 700; display: flex; align-items: center; gap: 4px; }
            
            .rec-card h3 { margin: 0 0 16px 0; font-size: 18px; color: var(--color-text-primary); }
            
            .reason-box { background: var(--color-bg-sidebar); padding: 12px; border-radius: 6px; margin-bottom: 16px; flex: 1; border: 1px solid var(--color-border); }
            .reason-box .label { font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); display: block; margin-bottom: 4px; }
            .reason-box p { margin: 0; font-size: 13px; line-height: 1.4; color: var(--color-text-secondary); }
            
            .risk-mod-notice { font-size: 11px; color: #ca8a04; display: flex; align-items: center; gap: 6px; margin-bottom: 16px; background: rgba(202, 138, 4, 0.05); padding: 6px; border-radius: 4px; border: 1px solid rgba(202, 138, 4, 0.1); }
            
            .btn-action { background: var(--color-betika-yellow); border: none; color: #000; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: all 0.2s; }
            .btn-action:hover { opacity: 0.9; box-shadow: var(--shadow-md); }
            .text-yellow { color: var(--color-betika-yellow); }

            /* Model Performance Panel */
            .model-perf-panel { margin-bottom: 24px; padding: 16px; border: 1px solid var(--color-border); background: var(--color-bg-sidebar); }
            .mp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .mp-title { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-primary); }
            .mp-status { font-size: 10px; background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(34, 197, 94, 0.2); font-weight: 600; }
            
            .mp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
            .mp-metric { display: flex; flex-direction: column; }
            .mp-metric .label { font-size: 10px; color: var(--color-text-muted); text-transform: uppercase; }
            .mp-metric .value { font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
            .mp-metric .delta { font-size: 10px; font-weight: 600; }
            .mp-metric .delta.pos { color: #22c55e; }
            .mp-metric .delta.neg { color: #dc2626; }
            
            .mp-comparison { display: flex; flex-direction: column; gap: 6px; }
            .mp-comparison .label { font-size: 10px; color: var(--color-text-muted); }
            .comp-bar { width: 100%; height: 6px; background: var(--color-border); border-radius: 3px; position: relative; overflow: hidden; }
            .bar-segment { height: 100%; position: absolute; top: 0; left: 0; border-radius: 3px; }
            .bar-segment.current { background: var(--color-betika-yellow); z-index: 2; opacity: 1; }
            .bar-segment.prev { background: var(--color-text-muted); z-index: 1; opacity: 0.3; }

            .model-details { margin-bottom: 12px; font-size: 11px; }
            .m-detail-row { display: flex; justify-content: space-between; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid var(--color-border); }
            .m-detail-row:last-child { border-bottom: none; }
            .m-detail-row .label { color: var(--color-text-muted); }
            .m-detail-row .val { color: var(--color-text-primary); font-weight: 600; }
            .m-detail-row.penalty .val { color: #ca8a04; }

            .blocked-state { text-align: center; padding: 60px; display: flex; flex-direction: column; align-items: center; gap: 16px; border: 1px solid var(--color-border); }
            .text-red { color: #dc2626; }
            .blocked-state h3 { font-size: 24px; margin: 0; color: var(--color-text-primary); }
            .blocked-state p { max-width: 400px; color: var(--color-text-secondary); line-height: 1.5; margin: 0; }

            .glass-panel { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 12px; box-shadow: var(--shadow-sm); }
        `}</style>
        </div>
    );
}
