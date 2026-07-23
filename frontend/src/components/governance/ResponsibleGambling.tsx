'use client';

import { useState } from 'react';
import {
    Shield, AlertTriangle, CheckCircle, Activity,
    Search, Filter, TrendingUp, Users, AlertOctagon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// --- Types ---
interface RiskProfile {
    id: string;
    segment: string;
    lossRatio: number;
    depositBurst: number;
    sessionDuration: number;
    hoursSinceLoss: number;
    crgScore: number;
    action: 'ALLOW' | 'DOWNGRADE' | 'BLOCK';
}

// --- Mock Data ---
const RISK_DISTRIBUTION = [
    { name: 'Low Risk (Allow)', value: 85, color: '#4ade80' },
    { name: 'Moderate (Downgrade)', value: 11, color: '#facc15' },
    { name: 'High Risk (Block)', value: 4, color: '#ef4444' },
];

const SEGMENT_RISK = [
    { segment: 'Casual', low: 90, mod: 8, high: 2 },
    { segment: 'Core', low: 82, mod: 14, high: 4 },
    { segment: 'HighRoller', low: 75, mod: 18, high: 7 },
    { segment: 'VIP', low: 60, mod: 25, high: 15 },
];

const SAMPLE_PLAYERS: RiskProfile[] = [
    { id: 'P00921', segment: 'VIP', lossRatio: 0.72, depositBurst: 5, sessionDuration: 45, hoursSinceLoss: 2, crgScore: 88, action: 'BLOCK' },
    { id: 'P01442', segment: 'Core', lossRatio: 0.45, depositBurst: 3, sessionDuration: 35, hoursSinceLoss: 36, crgScore: 52, action: 'DOWNGRADE' },
    { id: 'P03310', segment: 'Casual', lossRatio: 0.12, depositBurst: 0, sessionDuration: 15, hoursSinceLoss: 120, crgScore: 12, action: 'ALLOW' },
    { id: 'P08821', segment: 'HighRoller', lossRatio: 0.55, depositBurst: 2, sessionDuration: 55, hoursSinceLoss: 18, crgScore: 48, action: 'DOWNGRADE' },
    { id: 'P09932', segment: 'VIP', lossRatio: 0.85, depositBurst: 8, sessionDuration: 120, hoursSinceLoss: 1, crgScore: 95, action: 'BLOCK' },
];

// --- CRG Logic ---
const calculateRisk = (loss: number, burst: number, duration: number, cooloff: number) => {
    // S-Scores
    const s_loss = loss >= 0.6 ? 100 : (loss >= 0.3 ? 50 : 0);
    const s_burst = burst >= 4 ? 100 : (burst >= 2 ? 50 : 0);
    const s_dur = duration >= 60 ? 100 : (duration >= 30 ? 50 : 0);
    const s_cool = cooloff < 24 ? 100 : (cooloff < 48 ? 50 : 0);

    // Weighted Score
    const score = (s_loss * 0.40) + (s_burst * 0.30) + (s_dur * 0.15) + (s_cool * 0.15);

    let action = 'ALLOW';
    if (score >= 60) action = 'BLOCK';
    else if (score >= 40) action = 'DOWNGRADE';

    return { score, action };
};

export default function ResponsibleGambling() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedPlayer, setSelectedPlayer] = useState<RiskProfile | null>(null);

    // Simulator State
    const [simLoss, setSimLoss] = useState(0.2);
    const [simBurst, setSimBurst] = useState(1);
    const [simDur, setSimDur] = useState(25);
    const [simCool, setSimCool] = useState(72);

    const simResult = calculateRisk(simLoss, simBurst, simDur, simCool);

    return (
        <div className="rg-container">
            {/* Header Removed - embedded in tab now */}

            {/* Navigation */}
            <div className="tabs-nav-internal">
                <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
                    <Activity size={16} /> Risk Dashboard
                </button>
                <button onClick={() => setActiveTab('simulator')} className={activeTab === 'simulator' ? 'active' : ''}>
                    <TrendingUp size={16} /> Risk Simulator
                </button>
                <button onClick={() => setActiveTab('players')} className={activeTab === 'players' ? 'active' : ''}>
                    <Users size={16} /> At-Risk Players
                </button>
                <button onClick={() => setActiveTab('methodology')} className={activeTab === 'methodology' ? 'active' : ''}>
                    <Shield size={16} /> Calculation Logic
                </button>
            </div>

            <div className="tab-content-internal">

                {/* --- DASHBOARD TAB --- */}
                {activeTab === 'dashboard' && (
                    <div className="dashboard-grid">
                        {/* KPIs */}
                        <div className="kpi-row">
                            <div className="glass-panel kpi-card">
                                <div className="kpi-icon red"><AlertOctagon size={24} /></div>
                                <div className="kpi-data">
                                    <span className="value">4.2%</span>
                                    <span className="label">Block Rate</span>
                                </div>
                            </div>
                            <div className="glass-panel kpi-card">
                                <div className="kpi-icon yellow"><AlertTriangle size={24} /></div>
                                <div className="kpi-data">
                                    <span className="value">11.5%</span>
                                    <span className="label">Downgrade Rate</span>
                                </div>
                            </div>
                            <div className="glass-panel kpi-card">
                                <div className="kpi-icon green"><CheckCircle size={24} /></div>
                                <div className="kpi-data">
                                    <span className="value">98.1%</span>
                                    <span className="label">Compliance Score</span>
                                </div>
                            </div>
                        </div>

                        <div className="charts-row">
                            {/* Distribution Pie */}
                            <div className="glass-panel chart-panel">
                                <h3>Risk Action Distribution</h3>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={RISK_DISTRIBUTION}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {RISK_DISTRIBUTION.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pie-legend">
                                        {RISK_DISTRIBUTION.map(d => (
                                            <div key={d.name} className="legend-item">
                                                <span className="dot" style={{ background: d.color }}></span>
                                                {d.name} ({d.value}%)
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Segment Stacked Bar */}
                            <div className="glass-panel chart-panel">
                                <h3>Risk by Player Segment</h3>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={SEGMENT_RISK} layout="vertical" margin={{ left: 20 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="segment" type="category" stroke="#94a3b8" width={80} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                                            <Bar dataKey="low" stackId="a" fill="#4ade80" radius={[0, 0, 0, 4]} />
                                            <Bar dataKey="mod" stackId="a" fill="#facc15" />
                                            <Bar dataKey="high" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SIMULATOR TAB --- */}
                {activeTab === 'simulator' && (
                    <div className="simulator-layout glass-panel">
                        <div className="sim-controls">
                            <h3>Risk Calculator</h3>
                            <p className="text-secondary mb-6">Adjust player metrics to test the CRG scoring logic.</p>

                            <div className="control-group">
                                <label>7-Day Loss Ratio: <strong>{(simLoss * 100).toFixed(0)}%</strong></label>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={simLoss} onChange={e => setSimLoss(parseFloat(e.target.value))}
                                />
                                <div className="range-labels"><span>0%</span><span>100%</span></div>
                            </div>

                            <div className="control-group">
                                <label>Deposit Burst (24h): <strong>{simBurst}</strong></label>
                                <input
                                    type="range" min="0" max="10" step="1"
                                    value={simBurst} onChange={e => setSimBurst(parseInt(e.target.value))}
                                />
                                <div className="range-labels"><span>0</span><span>10+</span></div>
                            </div>

                            <div className="control-group">
                                <label>Avg Session Duration: <strong>{simDur} min</strong></label>
                                <input
                                    type="range" min="0" max="120" step="5"
                                    value={simDur} onChange={e => setSimDur(parseInt(e.target.value))}
                                />
                                <div className="range-labels"><span>0m</span><span>120m+</span></div>
                            </div>

                            <div className="control-group">
                                <label>Hours Since Major Loss: <strong>{simCool} hr</strong></label>
                                <input
                                    type="range" min="0" max="168" step="1"
                                    value={simCool} onChange={e => setSimCool(parseInt(e.target.value))}
                                />
                                <div className="range-labels"><span>0h (Recent)</span><span>168h (1 Week)</span></div>
                            </div>
                        </div>

                        <div className="sim-result">
                            <div className={`result-card ${simResult.action.toLowerCase()}`}>
                                <div className="score-circle">
                                    <span className="score-val">{simResult.score.toFixed(0)}</span>
                                    <span className="score-label">CRG Score</span>
                                </div>
                                <div className="action-badge">
                                    {simResult.action === 'BLOCK' && <AlertOctagon size={20} />}
                                    {simResult.action === 'DOWNGRADE' && <AlertTriangle size={20} />}
                                    {simResult.action === 'ALLOW' && <CheckCircle size={20} />}
                                    {simResult.action}
                                </div>
                                <p className="outcome-text">
                                    {simResult.action === 'BLOCK' && "Player is HIGH RISK. All promotional offers must be suppressed to prevent harm."}
                                    {simResult.action === 'DOWNGRADE' && "Player is MODERATE RISK. Bonus capability limited to 50% and higher risk offers hidden."}
                                    {simResult.action === 'ALLOW' && "Player is LOW RISK. Standard promotional eligibility applies."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PLAYERS TAB --- */}
                {activeTab === 'players' && (
                    <div className="players-tab-layout">
                        <div className="glass-panel player-table-panel">
                            <div className="panel-header-row">
                                <h3>High Risk Queue</h3>
                                <div className="panel-actions">
                                    <div className="search-box">
                                        <Search size={14} />
                                        <input type="text" placeholder="Search Player ID..." />
                                    </div>
                                    <button className="icon-btn"><Filter size={16} /></button>
                                </div>
                            </div>

                            <table className="rg-table">
                                <thead>
                                    <tr>
                                        <th>Player ID</th>
                                        <th>Segment</th>
                                        <th>Loss Ratio</th>
                                        <th>CRG Score</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {SAMPLE_PLAYERS.map(p => (
                                        <tr
                                            key={p.id}
                                            onClick={() => setSelectedPlayer(p)}
                                            className={selectedPlayer?.id === p.id ? 'selected-row' : ''}
                                        >
                                            <td className="font-mono">{p.id}</td>
                                            <td>{p.segment}</td>
                                            <td className={p.lossRatio > 0.6 ? 'text-red' : ''}>{(p.lossRatio * 100).toFixed(0)}%</td>
                                            <td>
                                                <span className={`score-pill ${p.action.toLowerCase()}`}>{p.crgScore}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${p.action.toLowerCase()}`}>{p.action}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {selectedPlayer && (
                            <div className="glass-panel detail-panel">
                                <div className="detail-header">
                                    <h3>Risk Calculation Deep Dive</h3>
                                    <span className="player-badge">{selectedPlayer.id}</span>
                                </div>
                                <p className="text-secondary text-sm mb-4">Breakdown of the Composite Responsible Gambling Risk (CRG) score.</p>

                                <div className="formula-box">
                                    <code>S = 0.4(LR) + 0.3(DB) + 0.15(SD) + 0.15(CI)</code>
                                </div>

                                <div className="metrics-breakdown">
                                    <div className="metric-item">
                                        <div className="m-label">Loss Ratio (LR)</div>
                                        <div className="m-value">{(selectedPlayer.lossRatio * 100).toFixed(0)}%</div>
                                        <div className="m-score">Score: {selectedPlayer.lossRatio >= 0.6 ? 100 : (selectedPlayer.lossRatio >= 0.3 ? 50 : 0)}</div>
                                        <div className="m-weight">Weight: 40%</div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="m-label">Deposit Burst (DB)</div>
                                        <div className="m-value">{selectedPlayer.depositBurst}</div>
                                        <div className="m-score">Score: {selectedPlayer.depositBurst >= 4 ? 100 : (selectedPlayer.depositBurst >= 2 ? 50 : 0)}</div>
                                        <div className="m-weight">Weight: 30%</div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="m-label">Session Dur. (SD)</div>
                                        <div className="m-value">{selectedPlayer.sessionDuration}m</div>
                                        <div className="m-score">Score: {selectedPlayer.sessionDuration >= 60 ? 100 : (selectedPlayer.sessionDuration >= 30 ? 50 : 0)}</div>
                                        <div className="m-weight">Weight: 15%</div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="m-label">Cool-off (CI)</div>
                                        <div className="m-value">{selectedPlayer.hoursSinceLoss}h</div>
                                        <div className="m-score">Score: {selectedPlayer.hoursSinceLoss < 24 ? 100 : (selectedPlayer.hoursSinceLoss < 48 ? 50 : 0)}</div>
                                        <div className="m-weight">Weight: 15%</div>
                                    </div>
                                </div>

                                <div className="total-calc">
                                    <div className="calc-row">Total Weighted Score: <strong>{selectedPlayer.crgScore}</strong></div>
                                    <div className="calc-row">Threshold Action: <span className={`status-badge ${selectedPlayer.action.toLowerCase()}`}>{selectedPlayer.action}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- METHODOLOGY TAB --- */}
                {activeTab === 'methodology' && (
                    <div className="methodology-panel glass-panel">
                        <div className="math-header">
                            <h2>The CRG Algorithm Explained</h2>
                            <p>The Composite Responsible Gambling Risk (CRG) is a transparent, deterministic scoring system designed to identify at-risk behavior patterns.</p>
                        </div>

                        <div className="formula-display">
                            <h3>Core Formula</h3>
                            <div className="math-block">
                                Score (S) = <span className="var w-40">0.4(LR)</span> + <span className="var w-30">0.3(DB)</span> + <span className="var w-15">0.15(SD)</span> + <span className="var w-15">0.15(CI)</span>
                            </div>
                            <div className="legend">
                                <span className="l-item"><span className="dot w-40"></span> <strong>LR</strong>: Loss Ratio (7-Day)</span>
                                <span className="l-item"><span className="dot w-30"></span> <strong>DB</strong>: Deposit Burst (24h)</span>
                                <span className="l-item"><span className="dot w-15"></span> <strong>SD</strong>: Session Duration</span>
                                <span className="l-item"><span className="dot w-15"></span> <strong>CI</strong>: Cool-off Indicator</span>
                            </div>
                        </div>

                        <div className="logic-grid">
                            <div className="logic-card">
                                <h4>1. Loss Ratio (LR) - 40% Weight</h4>
                                <p>Measures net loss relative to deposits.</p>
                                <ul>
                                    <li><strong>&gt; 60%</strong> = 100 points (Severe)</li>
                                    <li><strong>30-60%</strong> = 50 points (Moderate)</li>
                                    <li><strong>&lt; 30%</strong> = 0 points (Safe)</li>
                                </ul>
                            </div>
                            <div className="logic-card">
                                <h4>2. Deposit Burst (DB) - 30% Weight</h4>
                                <p>Frequency of deposits in a short window.</p>
                                <ul>
                                    <li><strong>&ge; 4</strong> in 24h = 100 points</li>
                                    <li><strong>2-3</strong> in 24h = 50 points</li>
                                    <li><strong>&lt; 2</strong> = 0 points</li>
                                </ul>
                            </div>
                            <div className="logic-card">
                                <h4>3. Session Duration (SD) - 15% Weight</h4>
                                <p>Time spent active in a single session.</p>
                                <ul>
                                    <li><strong>&ge; 60m</strong> = 100 points</li>
                                    <li><strong>30-59m</strong> = 50 points</li>
                                    <li><strong>&lt; 30m</strong> = 0 points</li>
                                </ul>
                            </div>
                            <div className="logic-card">
                                <h4>4. Cool-off Indicator (CI) - 15% Weight</h4>
                                <p>Time elapsed since last significant loss.</p>
                                <ul>
                                    <li><strong>&lt; 24h</strong> = 100 points (Immediate)</li>
                                    <li><strong>24-48h</strong> = 50 points</li>
                                    <li><strong>&gt; 48h</strong> = 0 points</li>
                                </ul>
                            </div>
                        </div>

                        <div className="threshold-logic">
                            <h3>Decision Thresholds</h3>
                            <div className="decision-flow">
                                <div className="d-step safe">
                                    <div className="range">0 - 39</div>
                                    <div className="outcome">ALLOW</div>
                                    <p>Standard flows active.</p>
                                </div>
                                <div className="arrow">→</div>
                                <div className="d-step warn">
                                    <div className="range">40 - 59</div>
                                    <div className="outcome">DOWNGRADE</div>
                                    <p>Bonuses capped at 50%. High-risk offers hidden.</p>
                                </div>
                                <div className="arrow">→</div>
                                <div className="d-step danger">
                                    <div className="range">60 - 100</div>
                                    <div className="outcome">BLOCK</div>
                                    <p>All promotions suppressed. Manual review trigger.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
