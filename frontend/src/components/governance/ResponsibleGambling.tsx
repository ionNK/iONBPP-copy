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

            <style jsx>{`
        .rg-container { color: #fff; }
        
        .tabs-nav-internal {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            background: rgba(255,255,255,0.03);
            padding: 4px;
            border-radius: 8px;
            width: fit-content;
        }
        .tabs-nav-internal button {
            background: transparent; border: none; color: var(--color-text-secondary); 
            padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; 
            display: flex; align-items: center; gap: 8px; border-radius: 6px; 
            transition: all 0.2s;
        }
        .tabs-nav-internal button.active { background: rgba(255,255,255,0.1); color: #fff; font-weight: 600; }
        .tabs-nav-internal button:hover { color: #fff; }

        .glass-panel { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; backdrop-filter: blur(10px); padding: 20px; }
        
        /* Dashboard */
        .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .kpi-card { display: flex; align-items: center; gap: 16px; padding: 24px; }
        .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); }
        .kpi-icon.red { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .kpi-icon.yellow { color: #facc15; background: rgba(250, 204, 21, 0.1); }
        .kpi-icon.green { color: #4ade80; background: rgba(74, 222, 128, 0.1); }
        .kpi-data { display: flex; flex-direction: column; }
        .kpi-data .value { font-size: 24px; font-weight: 700; }
        .kpi-data .label { font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; }

        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .chart-panel h3 { margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; color: var(--color-text-secondary); }
        .legend-item { font-size: 12px; color: var(--color-text-secondary); display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }

        /* Simulator */
        .simulator-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
        .control-group { margin-bottom: 24px; }
        .control-group label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
        .control-group input { width: 100%; -webkit-appearance: none; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; outline: none; }
        .control-group input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: var(--color-betika-yellow); border-radius: 50%; cursor: pointer; }
        .range-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--color-text-secondary); margin-top: 6px; }

        .result-card { background: rgba(0,0,0,0.3); border-radius: 16px; padding: 40px; text-align: center; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s; }
        .result-card.block { border-color: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.1); }
        .result-card.downgrade { border-color: #facc15; box-shadow: 0 0 30px rgba(250, 204, 21, 0.1); }
        .result-card.allow { border-color: #4ade80; box-shadow: 0 0 30px rgba(74, 222, 128, 0.1); }
        
        .score-circle { width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 24px auto; border: 4px solid currentColor; }
        .block .score-circle { color: #ef4444; }
        .downgrade .score-circle { color: #facc15; }
        .allow .score-circle { color: #4ade80; }
        
        .score-val { font-size: 42px; font-weight: 800; line-height: 1; }
        .score-label { font-size: 10px; text-transform: uppercase; opacity: 0.7; margin-top: 4px; }
        
        .action-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 16px; margin-bottom: 16px; }
        .block .action-badge { background: #ef4444; color: #fff; }
        .downgrade .action-badge { background: #facc15; color: #000; }
        .allow .action-badge { background: #4ade80; color: #000; }
        
        .outcome-text { color: var(--color-text-secondary); font-size: 14px; line-height: 1.5; max-width: 300px; margin: 0 auto; }

        /* Players Table */
        .panel-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .search-box { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; }
        .search-box input { background: transparent; border: none; color: #fff; outline: none; font-size: 13px; }
        .icon-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .rg-table { width: 100%; border-collapse: collapse; }
        .rg-table th { text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); border-bottom: 1px solid rgba(255,255,255,0.1); }
        .rg-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
        .font-mono { font-family: monospace; opacity: 0.8; }
        .text-red { color: #ef4444; font-weight: 600; }
        
        .score-pill { padding: 2px 8px; border-radius: 10px; font-weight: 700; font-size: 12px; }
        .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        
        .block.score-pill { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .downgrade.score-pill { color: #facc15; background: rgba(250, 204, 21, 0.1); }
        .allow.score-pill { color: #4ade80; background: rgba(74, 222, 128, 0.1); }
        
        .block.status-badge { background: #ef4444; color: #fff; }
        .downgrade.status-badge { background: #facc15; color: #000; }
        .allow.status-badge { background: #4ade80; color: #000; }

        /* Players Table Layout */
        .players-tab-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .player-table-panel { height: 600px; display: flex; flex-direction: column; }
        .rg-table tbody tr { cursor: pointer; transition: background 0.2s; }
        .rg-table tbody tr:hover { background: rgba(255,255,255,0.05); }
        .selected-row { background: rgba(242, 214, 65, 0.1) !important; border-left: 3px solid var(--color-betika-yellow); }
        
        /* Detail Panel */
        .detail-panel { border: 1px solid var(--color-betika-yellow); box-shadow: 0 0 20px rgba(242, 214, 65, 0.05); }
        .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .detail-header h3 { margin: 0; font-size: 16px; }
        .player-badge { background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-weight: 700; }
        
        .formula-box { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px dashed rgba(255,255,255,0.2); }
        .formula-box code { font-family: monospace; color: var(--color-betika-yellow); font-size: 14px; }
        
        .metrics-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .metric-item { background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; }
        .m-label { font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 4px; }
        .m-value { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .m-score { font-size: 12px; color: #4ade80; }
        .m-weight { font-size: 10px; opacity: 0.5; margin-top: 4px; }
        
        .total-calc { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
        .calc-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; }
        .calc-row strong { font-size: 18px; color: var(--color-betika-yellow); }

        /* Methodology Tab */
        .methodology-panel { max-width: 900px; margin: 0 auto; color: #e2e8f0; }
        .math-header { text-align: center; margin-bottom: 40px; }
        .math-header h2 { font-size: 20px; color: #fff; margin-bottom: 8px; }
        .math-header p { color: var(--color-text-secondary); max-width: 600px; margin: 0 auto; font-size: 14px; }

        .formula-display { background: rgba(0,0,0,0.3); padding: 24px; border-radius: 12px; margin-bottom: 40px; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
        .formula-display h3 { margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; color: var(--color-text-secondary); }
        
        .math-block { font-family: 'JetBrains Mono', monospace; font-size: 16px; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px; }
        .var { font-weight: 700; padding: 0 4px; }
        .w-40 { color: #f87171; }
        .w-30 { color: #fbbf24; }
        .w-15 { color: #60a5fa; }

        .legend { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
        .l-item { font-size: 12px; display: flex; align-items: center; gap: 8px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.w-40 { background: #f87171; }
        .dot.w-30 { background: #fbbf24; }
        .dot.w-15 { background: #60a5fa; }

        .logic-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 40px; }
        .logic-card { background: rgba(255,255,255,0.03); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .logic-card h4 { margin: 0 0 8px 0; color: #fff; font-size: 15px; }
        .logic-card p { margin: 0 0 16px 0; font-size: 13px; color: var(--color-text-secondary); }
        .logic-card ul { margin: 0; padding-left: 20px; font-size: 12px; }
        .logic-card li { margin-bottom: 6px; }

        .threshold-logic h3 { text-align: center; margin-bottom: 24px; font-size: 16px; }
        .decision-flow { display: flex; justify-content: center; align-items: center; gap: 16px; }
        .d-step { background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; text-align: center; width: 180px; border: 1px solid transparent; transition: transform 0.2s; }
        .d-step:hover { transform: translateY(-5px); }
        
        .d-step.safe { border-color: rgba(74, 222, 128, 0.3); }
        .d-step.warn { border-color: rgba(250, 204, 21, 0.3); }
        .d-step.danger { border-color: rgba(239, 68, 68, 0.3); }

        .d-step .range { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 4px; }
        .d-step .outcome { font-size: 16px; font-weight: 800; margin-bottom: 8px; }
        .d-step.safe .outcome { color: #4ade80; }
        .d-step.warn .outcome { color: #facc15; }
        .d-step.danger .outcome { color: #ef4444; }
        
        .d-step p { font-size: 11px; margin: 0; line-height: 1.4; opacity: 0.8; }
        .arrow { font-size: 20px; color: var(--color-text-secondary); opacity: 0.3; }
      `}</style>
        </div>
    );
}
