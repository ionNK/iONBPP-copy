'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, Gift, Calendar, LogIn, ArrowUpRight, ArrowDownLeft, Trophy,
  ShieldAlert, Mail, MessageSquare, Send, StickyNote, Zap,
} from 'lucide-react';
import {
  Player, ActivityType, PlayerNote, timeAgo, formatCurrency, LIFECYCLE_META,
  healthScore, healthBand, predictedValue, reachability, nextBestAction,
  similarPlayers, getPlayerNotes, addPlayerNote, abuseRisk, riskBand,
} from '@/data/players';

import { Overview, Timeline, Financials, Bonuses, Campaigns, Notes } from './PlayerTabs';

const ACTIVITY_ICON: Record<ActivityType, typeof Gift> = {
  login: LogIn, deposit: ArrowDownLeft, withdrawal: ArrowUpRight,
  bet: Activity, win: Trophy, bonus: Gift, session: Calendar,
};

type Tab = 'overview' | 'timeline' | 'financials' | 'bonuses' | 'campaigns' | 'notes';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'financials', label: 'Financials' },
  { key: 'bonuses', label: 'Bonuses & Offers' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'notes', label: 'Notes' },
];

export default function Player360({ player }: { player: Player }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => { setNotes(getPlayerNotes(player.id)); }, [player.id]);

  const logAction = (text: string) => setNotes(addPlayerNote(player.id, text, 'action'));
  const saveNote = () => {
    if (!draft.trim()) return;
    setNotes(addPlayerNote(player.id, draft.trim(), 'note'));
    setDraft('');
  };

  const health = healthScore(player);
  const hb = healthBand(health);
  const meta = LIFECYCLE_META[player.lifecycle];
  const channels = reachability(player);
  const nba = nextBestAction(player);
  const peers = similarPlayers(player);
  const abuse = abuseRisk(player);
  const abuseBand = riskBand(abuse);


  return (
    <div className="p360">
      {/* ===== HERO ===== */}
      <div className="hero glass-panel">
        <div className="avatar">{player.name.charAt(0)}</div>
        <div className="hero-meta">
          <h1>{player.name}</h1>
          <p className="sub"><Mail size={12} /> {player.email} · {player.phone}</p>
          <div className="badges">
            <span className="badge" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
            <span className="badge">{player.primaryProduct}</span>
            <span className="badge">{player.country} · {player.currency}</span>
            <span className="badge">KYC: {player.kycStatus}</span>
            {player.rgFlags.length > 0 && (
              <span className="badge rg"><ShieldAlert size={11} /> {player.rgFlags.length} RG flag{player.rgFlags.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="channels">
            {channels.map((c) => (
              <span key={c.key} className={`chan ${c.reachable ? 'on' : 'off'}`} title={c.detail}>
                {c.reachable ? '✓' : '✕'} {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat"><span>Lifetime Value</span><b className="ltv">{formatCurrency(player.ltv, player.currency)}</b></div>
          <div className="stat"><span>Predicted 12mo</span><b className="pred">{formatCurrency(predictedValue(player), player.currency)}</b></div>
          <div className="stat"><span>Health</span><b style={{ color: hb.color }}>{health} · {hb.label}</b></div>
        </div>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="actions">
        <button onClick={() => logAction('Targeted with a promotion')}><Zap size={14} /> Target with Promotion</button>
        <button onClick={() => logAction('Sent a message')}><Send size={14} /> Send Message</button>
        <button onClick={() => logAction('Granted a bonus')}><Gift size={14} /> Grant Bonus</button>
        <button className="danger" onClick={() => logAction('Flagged for RG review')}><ShieldAlert size={14} /> Flag for RG Review</button>
      </div>

      <div className="body">
        <div className="main">
          {/* ===== TABS ===== */}
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>

          <div className="tab-panel">
            {tab === 'overview' && <Overview player={player} nba={nba} onAction={logAction} />}
            {tab === 'timeline' && <Timeline player={player} />}
            {tab === 'financials' && <Financials player={player} />}
            {tab === 'bonuses' && <Bonuses player={player} />}
            {tab === 'campaigns' && <Campaigns player={player} />}
            {tab === 'notes' && <Notes notes={notes} draft={draft} setDraft={setDraft} onSave={saveNote} />}
          </div>
        </div>

        {/* ===== RIGHT RAIL ===== */}
        <aside className="rail">
          <div className="glass-panel rail-card">
            <h4>Intelligence</h4>
            <RailBar label="Health" value={health} color={hb.color} />
            <RailBar label="Churn risk" value={player.churnScore} color="#f87171" />
            <RailBar label="Promo propensity" value={player.promoPropensity} color="#699951" />
            <RailBar label="RG risk" value={player.rgRisk} color="#fb923c" />
            <RailBar label="Bonus-abuse risk" value={abuse} color={abuseBand.color} />
            {abuse >= 66 && (
              <p className="abuse-note"><ShieldAlert size={11} /> Elevated bonus-abuse signature — review offer eligibility.</p>
            )}
          </div>

          <div className="glass-panel rail-card">
            <h4>Segment peers · {meta.label}</h4>
            {peers.length === 0 ? <p className="muted">No peers in this segment.</p> : (
              <ul className="peers">
                {peers.map((p) => (
                  <li key={p.id}><Link href={`/admin/crm/${p.id}`}>{p.name}</Link><span>{formatCurrency(p.ltv, p.currency)}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="glass-panel rail-card">
            <h4>Recent operator actions</h4>
            {notes.filter((n) => n.kind === 'action').length === 0 ? <p className="muted">No actions yet.</p> : (
              <ul className="feed">
                {notes.filter((n) => n.kind === 'action').slice(0, 5).map((n) => (
                  <li key={n.id}><b>{n.text}</b><span>{timeAgo(n.createdAt)}</span></li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
 <style jsx>{`
 .p360 { display: flex; flex-direction: column; gap: 16px; }
 .hero { display: flex; gap: 20px; padding: 22px; align-items: flex-start; flex-wrap: wrap; }
 .avatar { width: 64px; height: 64px; border-radius: 16px; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; flex-shrink: 0; }
 .hero-meta { flex: 1; min-width: 240px; }
 .hero-meta h1 { font-size: 24px; }
 .sub { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-secondary); margin: 4px 0 10px; }
 .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
 .badge { font-size: 11px; padding: 3px 9px; border-radius: 20px; background: var(--color-bg-input); display: inline-flex; align-items: center; gap: 4px; }
 .badge.rg { color: #f87171; }
 .channels { display: flex; flex-wrap: wrap; gap: 6px; }
 .chan { font-size: 11px; padding: 2px 8px; border-radius: 6px; }
 .chan.on { color: #699951; background: rgba(105,153,81,.12); }
 .chan.off { color: var(--color-text-secondary); background: var(--color-bg-input); }
 .hero-stats { display: flex; gap: 22px; }
 .stat { display: flex; flex-direction: column; gap: 2px; }
 .stat span { font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .5px; }
 .stat b { font-size: 20px; }
 .stat .ltv { color: var(--color-primary); }
 .stat .pred { color: #38bdf8; }
 .actions { display: flex; flex-wrap: wrap; gap: 8px; }
 .actions button { display: inline-flex; align-items: center; gap: 6px; background: var(--color-bg-input); border: 1px solid var(--color-border); color: var(--color-text-primary); padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; }
 .actions button:hover { border-color: var(--color-primary); }
 .actions button.danger:hover { border-color: #f87171; color: #f87171; }
 .body { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }
 .main { min-width: 0; }
 .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 16px; overflow-x: auto; }
 .tabs button { background: none; border: none; color: var(--color-text-secondary); padding: 10px 14px; font-size: 14px; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; }
 .tabs button.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
 .rail { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 16px; }
 .rail-card { padding: 16px; }
        .rail-card h4 { font-size: 13px; margin-bottom: 12px; }
        .abuse-note { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #f87171; margin-top: 4px; line-height: 1.35; }

 .muted { font-size: 13px; color: var(--color-text-secondary); }
 .peers, .feed { display: flex; flex-direction: column; gap: 8px; }
 .peers li { display: flex; justify-content: space-between; font-size: 13px; }
 .peers a { color: var(--color-text-primary); }
 .peers a:hover { color: var(--color-primary); }
 .peers span { color: var(--color-text-secondary); }
 .feed li { display: flex; flex-direction: column; }
 .feed b { font-size: 13px; font-weight: 500; }
 .feed span { font-size: 11px; color: var(--color-text-secondary); }
 @media (max-width: 900px) { .body { grid-template-columns: 1fr; } .rail { position: static; } }
 `}</style>
 </div>
 );
}

function RailBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rail-bar">
      <div className="rb-head"><span>{label}</span><b style={{ color }}>{value}</b></div>
      <div className="rb-track"><span style={{ width: `${value}%`, background: color }} /></div>
      <style jsx>{`
        .rail-bar { margin-bottom: 12px; }
        .rb-head { display: flex; justify-content: space-between; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
        .rb-track { height: 5px; border-radius: 3px; background: var(--color-bg-input); overflow: hidden; }
        .rb-track span { display: block; height: 100%; }
      `}</style>
    </div>
  );
}

/* SUBCOMPONENTS_PLACEHOLDER */
