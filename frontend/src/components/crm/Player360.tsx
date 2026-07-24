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
 </div>
 );
}

function RailBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rail-bar">
 <div className="rb-head"><span>{label}</span><b style={{ color }}>{value}</b></div>
 <div className="rb-track"><span style={{ width: `${value}%`, background: color }} /></div>
    </div>
  );
}

/* SUBCOMPONENTS_PLACEHOLDER */
