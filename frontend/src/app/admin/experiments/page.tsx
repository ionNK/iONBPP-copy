'use client';

import {
 AlertCircle,
 ArrowDownRight,
 ArrowUpRight,
 FlaskConical,
 Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Link from 'next/link';
import { useCountry } from '@/context/CountryContext';

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
      { name: 'Variant B (Risk-Free)', color: '#F2D641', conversion: 14.8, traffic: 50 },
    ],
  },
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
      { name: 'Variant B (Personalized)', color: '#F2D641', conversion: 4.3, traffic: 50 },
    ],
  },
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
      { name: 'Variant B (One-Click)', color: '#F2D641', conversion: 64.5, traffic: 50 },
    ],
  },
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

function StatusBadge({ status }: { status: Experiment['status'] }) {
  const label = status === 'running' ? 'Running' : status === 'paused' ? 'Paused' : 'Concluded';

  return (
    <span className={`ds-status ds-status--${status}`}>
      <span className="status-indicator" />
      {label}
    </span>
  );
}

export default function ExperimentsPage() {
  const { isInScope, selectedCountry } = useCountry();

  const scopedExperiments = EXPERIMENTS.filter((experiment) => isInScope(experiment.market));
  const activeCount = scopedExperiments.filter((experiment) => experiment.status === 'running').length;
  const actionRequired = scopedExperiments.filter(
    (experiment) => experiment.status === 'paused' || experiment.uplift < 0,
  ).length;
  const totalParticipants = scopedExperiments.reduce(
    (sum, experiment) => sum + experiment.participants,
    0,
  );
  const avgUplift = scopedExperiments.length
    ? scopedExperiments.reduce((sum, experiment) => sum + experiment.uplift, 0) /
      scopedExperiments.length
    : 0;
  const heroExperiment =
    scopedExperiments.find((experiment) => experiment.status === 'running') ??
    scopedExperiments[0] ??
    null;

  const formatParticipants = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}`;

  return (
<div className="experiments-page ds-page-shell">
<header className="ds-page-header">
<div>
<h1 className="ds-page-header__title">Experiments</h1>
<p className="ds-page-header__subtitle">
            Test, validate, and scale campaign decisions
            {selectedCountry ? ` · ${selectedCountry.name}` : ' · All markets'}.
          </p>
        </div>
        <div className="ds-page-header__actions">
          <Link href="/admin/promotions/create?mode=experiment" className="btn btn-primary">
            <Plus size={18} />
            Create experiment
          </Link>
        </div>
      </header>

      <section className="metric-strip" aria-label="Experiment overview">
        <div className="metric-item">
          <div className="metric-icon metric-icon--accent">
            <FlaskConical size={18} />
          </div>
          <div>
            <div className="metric-value">{activeCount}</div>
            <div className="metric-label">Active experiments</div>
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-icon metric-icon--success">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className={`metric-value ${avgUplift < 0 ? 'text-danger' : 'text-success'}`}>
              {avgUplift > 0 ? '+' : ''}
              {avgUplift.toFixed(1)}%
            </div>
            <div className="metric-label">Average uplift</div>
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-icon metric-icon--neutral">
            <Users size={18} />
          </div>
          <div>
            <div className="metric-value">{formatParticipants(totalParticipants)}</div>
            <div className="metric-label">Participants</div>
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-icon metric-icon--warning">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="metric-value">{actionRequired}</div>
            <div className="metric-label">Need attention</div>
          </div>
        </div>
      </section>

      {heroExperiment && (
        <section className="featured-panel ds-panel">
          <div className="featured-summary">
            <div className="section-eyebrow">
              <FlaskConical size={14} />
              Featured experiment
            </div>
            <div className="featured-heading">
              <div>
                <div className="featured-status-row">
                  <StatusBadge status={heroExperiment.status} />
                  <span className="market-tag">{heroExperiment.market}</span>
                </div>
                <h2>{heroExperiment.name}</h2>
                <p>
                  Started {heroExperiment.startDate}
                  <span>•</span>
                  {heroExperiment.participants.toLocaleString()} participants
                  <span>•</span>
                  {heroExperiment.significance}% confidence
                </p>
              </div>
              <div className={`uplift-summary ${heroExperiment.uplift < 0 ? 'is-negative' : ''}`}>
                {heroExperiment.uplift < 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                <strong>
                  {heroExperiment.uplift > 0 ? '+' : ''}
                  {heroExperiment.uplift}%
                </strong>
                <span>Observed uplift</span>
              </div>
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-header">
              <span>Conversion trend</span>
              <div className="chart-legend">
                <span><i className="legend-dot legend-dot--control" />Control</span>
                <span><i className="legend-dot legend-dot--variant" />Variant B</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={212} minWidth={0}>
              <AreaChart data={CHART_DATA} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="variant-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2D641" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F2D641" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="control-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--ds-surface-raised, var(--color-bg-panel))',
                    border: '1px solid var(--ds-border, var(--color-border))',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                  }}
                  labelStyle={{ color: 'var(--color-text-secondary)' }}
                />
                <Area
                  type="monotone"
                  dataKey="Control"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#control-fill)"
                  name="Control"
                />
                <Area
                  type="monotone"
                  dataKey="VariantB"
                  stroke="#F2D641"
                  strokeWidth={2.5}
                  fill="url(#variant-fill)"
                  name="Variant B"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

<section className="ds-panel ds-table-panel">
<div className="ds-panel-header">
<div>
<h2 className="ds-panel-header__title">All experiments</h2>
<p className="ds-panel-header__subtitle">{scopedExperiments.length} in the current market scope</p>
</div>
</div>

<div className="ds-table-scroll">
<table className="ds-table">
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Status</th>
                <th>Started</th>
                <th>Performance</th>
                <th>Confidence</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {scopedExperiments.length === 0 ? (
                <tr>
                  <td colSpan={6}>
<div className="ds-empty-state">
<AlertCircle size={30} />
<p className="ds-empty-state__title">No experiments found</p>
<p className="ds-empty-state__description">There are no experiments in this market scope yet.</p>
</div>
                  </td>
                </tr>
              ) : (
                scopedExperiments.map((experiment) => (
                  <tr key={experiment.id}>
                    <td>
                      <div className="cell-primary">
                        <span className="cell-title">{experiment.name}</span>
                        <span className="cell-subtitle">
                          {experiment.id} <span>·</span> {experiment.market}
                        </span>
                      </div>
                    </td>
                    <td><StatusBadge status={experiment.status} /></td>
                    <td className="text-secondary text-sm">{experiment.startDate}</td>
                    <td>
                      <div className="traffic-bar" aria-label="Traffic allocation">
                        {experiment.variants.map((variant) => (
                          <span
                            key={variant.name}
                            style={{ width: `${variant.traffic}%`, background: variant.color }}
                            title={`${variant.name}: ${variant.conversion}% conversion`}
                          />
                        ))}
                      </div>
                      <span className={`uplift-text ${experiment.uplift < 0 ? 'text-danger' : 'text-success'}`}>
                        {experiment.uplift > 0 ? '+' : ''}
                        {experiment.uplift}% uplift
                      </span>
                    </td>
                    <td>
                      <div className="confidence-value">{experiment.significance}%</div>
                      <div className="confidence-meter">
                        <span
                          className={experiment.significance >= 95 ? 'is-high' : ''}
                          style={{ width: `${experiment.significance}%` }}
                        />
                      </div>
                    </td>
                    <td className="action-cell">
                      <button className="btn btn-secondary btn-sm">View details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}