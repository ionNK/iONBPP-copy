'use client';

import {
    FlaskConical, TrendingUp, Users, CheckCircle2,
    AlertCircle, Play, Pause, BarChart2, Plus, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';
import { useCountry } from '@/context/CountryContext';

// --- Types ---
interface Experiment {
  id: string;
  name: string;
  market: string;
  status: 'running' | 'paused' | 'concluded';
  startDate: string;
  participants: number;
  uplift: number;
  significance: number;
  winner?: string;
  variants: Variant[];
}

interface Variant {
    name: string;
    color: string;
    conversion: number;
    traffic: number;
}

// --- Mock Data ---
const EXPERIMENTS: Experiment[] = [
    {
    id: 'EXP-2024-001',
    name: 'Welcome Offer: Deposit Match vs Risk-Free Bet',
    market: 'Kenya',
    status: 'running',
        startDate: 'Feb 1, 2024',
        participants: 12450,
        uplift: 15.4,
        significance: 98,
        variants: [
            { name: 'Control (100% Match)', color: '#94a3b8', conversion: 12.5, traffic: 50 },
            { name: 'Variant B (Risk-Free)', color: '#F2D641', conversion: 14.8, traffic: 50 }
        ]
    }, // High Uplift Winner
    {
    id: 'EXP-2024-002',
    name: 'Retention Push Notification Copy',
    market: 'Ghana',
    status: 'concluded',
        startDate: 'Jan 15, 2024',
        participants: 45000,
        uplift: 2.1,
        significance: 65,
        winner: 'Inconclusive',
        variants: [
            { name: 'Control (Generic)', color: '#94a3b8', conversion: 4.2, traffic: 50 },
            { name: 'Variant B (Personalized)', color: '#F2D641', conversion: 4.3, traffic: 50 }
        ]
    }, // Inconclusive
    {
    id: 'EXP-2024-003',
    name: 'Checkout Flow: Simplified UI',
    market: 'Ethiopia',
    status: 'paused',
        startDate: 'Feb 5, 2024',
        participants: 3200,
        uplift: -5.2,
        significance: 88,
        variants: [
            { name: 'Control (Standard)', color: '#94a3b8', conversion: 68.0, traffic: 50 },
            { name: 'Variant B (One-Click)', color: '#F2D641', conversion: 64.5, traffic: 50 }
        ]
    } // Negative Impact
];

const CHART_DATA = [
    { day: 'Day 1', Control: 12.0, VariantB: 12.2 },
    { day: 'Day 2', Control: 12.1, VariantB: 12.8 },
    { day: 'Day 3', Control: 11.9, VariantB: 13.5 },
    { day: 'Day 4', Control: 12.4, VariantB: 14.2 },
    { day: 'Day 5', Control: 12.2, VariantB: 14.6 },
    { day: 'Day 6', Control: 12.5, VariantB: 14.8 },
    { day: 'Day 7', Control: 12.3, VariantB: 15.1 },
];

export default function ExperimentsPage() {
  const { isInScope, selectedCountry } = useCountry();

  // Only surface experiments that belong to the operator's active market scope.
  const scopedExperiments = EXPERIMENTS.filter((exp) => isInScope(exp.market));

  // Derive KPIs from the scoped dataset so headline numbers respect the filter.
  const activeCount = scopedExperiments.filter((e) => e.status === 'running').length;
  const actionRequired = scopedExperiments.filter(
    (e) => e.status === 'paused' || e.uplift < 0,
  ).length;
  const totalParticipants = scopedExperiments.reduce((sum, e) => sum + e.participants, 0);
  const avgUplift = scopedExperiments.length
    ? scopedExperiments.reduce((sum, e) => sum + e.uplift, 0) / scopedExperiments.length
    : 0;

  const formatParticipants = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

  // Feature the first running experiment in scope (fallback to the first available).
  const heroExperiment =
    scopedExperiments.find((e) => e.status === 'running') ?? scopedExperiments[0] ?? null;

  return (
    <div className="experiments-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Experiments</h1>
          <p className="page-subtitle">
            A/B testing and multivariate analysis control center
            {selectedCountry ? ` · ${selectedCountry.name}` : ' · All Markets'}.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/admin/promotions/create?mode=experiment" className="btn btn-primary">
            <Plus size={16} /> Create Experiment
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-row">
        <div className="glass-panel kpi-card">
          <div className="kpi-icon"><FlaskConical size={20} color="#F2D641" /></div>
          <div className="kpi-content">
            <span className="kpi-value">{activeCount}</span>
            <span className="kpi-label">Active Experiments</span>
          </div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-icon"><TrendingUp size={20} color="#4ade80" /></div>
          <div className="kpi-content">
            <span className="kpi-value text-green">
              {avgUplift > 0 ? '+' : ''}{avgUplift.toFixed(1)}%
            </span>
            <span className="kpi-label">Avg. Uplift</span>
          </div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-icon"><Users size={20} color="#60a5fa" /></div>
          <div className="kpi-content">
            <span className="kpi-value">{formatParticipants(totalParticipants)}</span>
            <span className="kpi-label">Total Participants</span>
          </div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-icon"><CheckCircle2 size={20} color="#f87171" /></div>
          <div className="kpi-content">
            <span className="kpi-value">{actionRequired}</span>
            <span className="kpi-label">Action Required</span>
          </div>
        </div>
      </div>

      {/* Active Experiment Detail (Hero) */}
      {heroExperiment && (
      <div className="hero-section">
        <div className="glass-panel hero-card">
          <div className="card-header">
            <div className="flex justify-between w-full items-start">
              <div>
                <span className={`status-badge ${heroExperiment.status}`}><Play size={10} fill="currentColor" /> {heroExperiment.status.toUpperCase()}</span>
                <h2 className="experiment-title">{heroExperiment.name}</h2>
                <p className="experiment-meta">Started {heroExperiment.startDate} • {heroExperiment.participants.toLocaleString()} Participants • {heroExperiment.significance}% Confidence</p>
              </div>
              <div className="uplift-badge">
                <ArrowUpRight size={20} />
                <span className="uplift-val">{heroExperiment.uplift > 0 ? '+' : ''}{heroExperiment.uplift}%</span>
                <span className="uplift-label">Uplift</span>
              </div>
            </div>
          </div>

          <div className="chart-area">

                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={CHART_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVarB" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F2D641" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F2D641" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorControl" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--color-text-primary)' }}
                                    labelStyle={{ color: 'var(--color-text-secondary)' }}
                                />
                                <Legend iconType="circle" />
                                <Area type="monotone" dataKey="VariantB" stroke="#F2D641" strokeWidth={3} fillOpacity={1} fill="url(#colorVarB)" name="Variant B (Risk-Free)" />
                                <Area type="monotone" dataKey="Control" stroke="var(--color-text-muted)" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorControl)" name="Control (Match)" />
          </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}

      {/* Experiments List */}

            <div className="glass-panel list-panel">
                <div className="panel-header">
                    <h3 className="panel-title">All Experiments</h3>
                </div>
                <table className="exp-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Experiment Name</th>
                            <th>Date Started</th>
                            <th>Performance</th>
                            <th>Significance</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
            <tbody>
              {scopedExperiments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-secondary" style={{ textAlign: 'center', padding: '40px' }}>
                    No experiments found for this market.
                  </td>
                </tr>
              )}
              {scopedExperiments.map(exp => (
                            <tr key={exp.id} className="hover-row">
                                <td>
                                    <span className={`status-dot ${exp.status}`}></span>
                                </td>
                                <td>
                                    <div className="exp-name">{exp.name}</div>
                                    <div className="exp-id">{exp.id}</div>
                                </td>
                                <td className="text-secondary">{exp.startDate}</td>
                                <td>
                                    <div className="bar-stack">
                                        {exp.variants.map((v, i) => (
                                            <div key={i} className="bar-segment" style={{ width: `${v.traffic}%`, background: v.color }} title={`${v.name}: ${v.conversion}%`} />
                                        ))}
                                    </div>
                                    <div className="uplift-text" style={{ color: exp.uplift > 0 ? '#4ade80' : '#f87171' }}>
                                        {exp.uplift > 0 ? '+' : ''}{exp.uplift}% Uplift
                                    </div>
                                </td>
                                <td>
                                    <div className="sig-meter">
                                        <div className="sig-fill" style={{ width: `${exp.significance}%`, background: exp.significance > 95 ? '#4ade80' : '#facc15' }} />
                                    </div>
                                    <span className="sig-label">{exp.significance}% Conf.</span>
                                </td>
                                <td className="text-right">
                                    <button className="btn-sm btn-outline">View Details</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .experiments-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 24px;
                    color: var(--color-text-primary);
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 32px;
                }
                .page-title { font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: var(--color-text-primary); }
                .page-subtitle { color: var(--color-text-secondary); margin: 0; font-size: 14px; }
                
                .btn {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 10px 20px; border-radius: 8px;
                    font-size: 14px; font-weight: 600; cursor: pointer;
                    transition: all 0.2s; border: none; text-decoration: none;
                }
                .btn-primary { background: var(--color-betika-yellow); color: #000; }
                .btn-primary:hover { box-shadow: 0 0 15px rgba(242, 214, 65, 0.4); }

                /* KPI Cards */
                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
 .glass-panel {
 background: var(--color-bg-elevated);
 border: 1px solid var(--color-border);
 border-radius: 12px;
 backdrop-filter: blur(10px);
 }
                .kpi-card { padding: 20px; display: flex; align-items: center; gap: 16px; }
                .kpi-icon {
                    width: 48px; height: 48px; border-radius: 12px;
                    background: var(--color-bg-input);
                    display: flex; align-items: center; justify-content: center;
                    border: 1px solid var(--color-border);
                }
                .kpi-content { display: flex; flex-direction: column; }
                .kpi-value { font-size: 24px; font-weight: 700; line-height: 1.2; color: var(--color-text-primary); }
                .kpi-label { font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
                .text-green { color: #4ade80; }

                /* Hero Section */
                .hero-section { margin-bottom: 32px; }
                .hero-card { padding: 32px; }
                .card-header { margin-bottom: 24px; }
                
                .status-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 4px 10px; border-radius: 20px;
                    font-size: 11px; font-weight: 700; text-transform: uppercase;
                    margin-bottom: 12px;
                }
                .status-badge.running { background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
                
                .experiment-title { font-size: 24px; font-weight: 700; margin: 0 0 6px 0; color: var(--color-text-primary); }
                .experiment-meta { color: var(--color-text-secondary); font-size: 14px; }
                
                .uplift-badge {
                    background: rgba(242, 214, 65, 0.1);
                    border: 1px solid rgba(242, 214, 65, 0.3);
                    padding: 12px 20px; border-radius: 12px;
                    display: flex; flex-direction: column; align-items: center;
                    color: var(--color-betika-yellow);
                }
                .uplift-val { font-size: 20px; font-weight: 700; line-height: 1.2; }
                .uplift-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }

                .chart-area { margin-top: 20px; }

                /* Table */
                .list-panel { overflow: hidden; }
                .panel-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
                .panel-title { margin: 0; font-size: 18px; font-weight: 600; }
                
                .exp-table { width: 100%; border-collapse: collapse; }
                .exp-table th {
                    text-align: left; padding: 16px 24px;
                    font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary);
                    font-weight: 600; background: var(--color-bg-input);
                }
 .exp-table td { padding: 16px 24px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
 .hover-row:hover td { background: var(--color-bg-hover); }
                
                .status-dot { width: 8px; height: 8px; border-radius: 50%; display: block; }
                .status-dot.running { background: #4ade80; box-shadow: 0 0 8px rgba(74, 222, 128, 0.5); }
                .status-dot.paused { background: #facc15; }
                .status-dot.concluded { background: #94a3b8; }
                
                .exp-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; color: var(--color-text-primary); }
                .exp-id { font-size: 11px; font-family: monospace; color: var(--color-text-muted); }
                
                .text-secondary { color: var(--color-text-secondary); font-size: 13px; }
                
                .bar-stack { display: flex; height: 6px; width: 100px; border-radius: 3px; overflow: hidden; background: var(--color-bg-input); margin-bottom: 6px; }
                .bar-segment { height: 100%; }
                
                .uplift-text { font-size: 12px; font-weight: 600; }
                
                .sig-meter { width: 80px; height: 4px; background: var(--color-bg-input); border-radius: 2px; margin-bottom: 4px; overflow: hidden; }
                .sig-fill { height: 100%; }
                .sig-label { font-size: 11px; color: var(--color-text-secondary); }
                
                .btn-sm { font-size: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
                .btn-outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-primary); }
                .btn-outline:hover { background: var(--color-bg-input); border-color: var(--color-text-muted); }
                .text-right { text-align: right; }
            `}</style>
        </div>
    );
}
