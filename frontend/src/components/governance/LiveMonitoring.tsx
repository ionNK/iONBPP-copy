'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';
import OperationalControls, { type PromoState } from '@/components/governance/OperationalControls';

type Funnel = { entrants: number; qualified: number; awarded: number; used: number; expired: number; blocked: number; failures: number; };
type Promo = { id: string; name: string; market: string; state: PromoState; budgetCap: number; budgetUsed: number; funnel: Funnel; };

const SEED: Promo[] = [
  { id: 'PRM-2024-001', name: 'Ethiopia Acca Insurance', market: 'Ethiopia', state: 'active', budgetCap: 100000, budgetUsed: 42300, funnel: { entrants: 18420, qualified: 9210, awarded: 7180, used: 5120, expired: 1240, blocked: 340, failures: 62 } },
  { id: 'PRM-2024-002', name: 'Kenya Weekend Boost', market: 'Kenya', state: 'active', budgetCap: 50000, budgetUsed: 31200, funnel: { entrants: 9800, qualified: 5400, awarded: 4900, used: 4100, expired: 520, blocked: 180, failures: 24 } },
  { id: 'PRM-2024-003', name: 'Ghana Welcome Offer', market: 'Ghana', state: 'paused', budgetCap: 30000, budgetUsed: 8600, funnel: { entrants: 3200, qualified: 1400, awarded: 1100, used: 760, expired: 210, blocked: 90, failures: 8 } },
];

const METRICS: { key: keyof Funnel; label: string; color: string }[] = [
  { key: 'entrants', label: 'Entrants', color: '#38bdf8' },
  { key: 'qualified', label: 'Qualified', color: '#699951' },
  { key: 'awarded', label: 'Awarded', color: '#22c55e' },
  { key: 'used', label: 'Used', color: '#facc15' },
  { key: 'expired', label: 'Expired', color: '#fb923c' },
  { key: 'blocked', label: 'Blocked', color: '#f87171' },
  { key: 'failures', label: 'Failures', color: '#dc2626' },
];

export default function LiveMonitoring() {
  const [promos, setPromos] = useState<Promo[]>(SEED);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setPromos(prev => prev.map(p => p.state !== 'active' ? p : ({
        ...p,
        budgetUsed: Math.min(p.budgetCap, p.budgetUsed + Math.round(Math.random() * 200)),
        funnel: {
          entrants: p.funnel.entrants + Math.round(Math.random() * 25),
          qualified: p.funnel.qualified + Math.round(Math.random() * 14),
          awarded: p.funnel.awarded + Math.round(Math.random() * 10),
          used: p.funnel.used + Math.round(Math.random() * 8),
          expired: p.funnel.expired + Math.round(Math.random() * 3),
          blocked: p.funnel.blocked + Math.round(Math.random() * 2),
          failures: p.funnel.failures + (Math.random() > 0.7 ? 1 : 0),
        },
      })));
    }, 2500);
    return () => clearInterval(t);
  }, [live]);

  const setPromoState = (id: string, next: PromoState) =>
    setPromos(prev => prev.map(p => (p.id === id ? { ...p, state: next } : p)));

  return (
    <div className="mon animate-fade">
      <div className="head">
        <p className="sub">Real-time promotion funnel, outcomes and budget burn.</p>
        <button className={`livebtn ${live ? 'on' : ''}`} onClick={() => setLive(v => !v)}>
          <Radio size={14} /> {live ? 'Live' : 'Paused'}{live && <span className="dot" />}
        </button>
      </div>

      {promos.map(p => {
        const pct = Math.round((p.budgetUsed / p.budgetCap) * 100);
        return (
          <div key={p.id} className="card">
            <div className="card-head">
              <div>
                <Link href={`/admin/promotions/${p.id}`} className="name">{p.name}</Link>
                <span className="pid">{p.id}</span>
              </div>
              <span className={`state ${p.state}`}>{p.state}</span>
            </div>

            <div className="grid">
              {METRICS.map(m => (
                <div key={m.key} className="metric">
                  <span className="mlabel" style={{ color: m.color }}>{m.label}</span>
                  <b className="mval">{p.funnel[m.key].toLocaleString()}</b>
                </div>
              ))}
            </div>

            <div className="budget">
              <div className="brow"><span>Budget utilisation</span><b>{pct}% · {p.budgetUsed.toLocaleString()} / {p.budgetCap.toLocaleString()}</b></div>
              <div className="btrack"><div className="bfill" style={{ width: `${pct}%`, background: pct > 90 ? '#f87171' : pct > 70 ? '#facc15' : '#699951' }} /></div>
            </div>

            <div className="controls">
              <OperationalControls
                promotionId={p.id}
                promotionName={p.name}
                market={p.market}
                state={p.state}
                onStateChange={(next) => setPromoState(p.id, next)}
              />
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .mon { padding-bottom: 40px; }
        .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .sub { color: var(--color-text-muted); font-size: 13px; margin: 0; }
        .livebtn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-input); color: var(--color-text-muted); font-size: 13px; font-weight: 600; cursor: pointer; }
        .livebtn.on { color: var(--color-betika-green); border-color: var(--color-betika-green); }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-betika-green); animation: pulse 1.2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
        .card { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .name { font-size: 16px; font-weight: 700; color: var(--color-text-primary); text-decoration: none; }
        .name:hover { color: var(--color-primary); }
        .pid { font-family: monospace; font-size: 12px; color: var(--color-text-muted); margin-left: 10px; }
        .state { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
        .state.active { color: var(--color-betika-green); background: rgba(105,153,81,.2); }
        .state.paused { color: #d97706; background: rgba(250,204,21,.2); }
        .state.ended { color: var(--color-text-muted); background: var(--color-bg-hover); }
        .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 18px; }
        .metric { background: var(--color-bg-hover); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
        .mlabel { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
        .mval { font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
        .brow { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
        .brow span { color: var(--color-text-muted); }
        .brow b { color: var(--color-text-primary); }
        .btrack { height: 8px; border-radius: 4px; background: var(--color-bg-hover); overflow: hidden; }
        .bfill { height: 100%; border-radius: 4px; transition: width .5s; }
        .controls { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--color-border); }
        @media (max-width: 900px) { .grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </div>
  );
}
