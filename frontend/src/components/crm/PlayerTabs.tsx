'use client';
import Link from 'next/link';
import { Player, PlayerNote, ActivityType, timeAgo, formatCurrency } from '@/data/players';

export function Overview({ player, nba, onAction }: {
  player: Player;
  nba: { title: string; reason: string; cta: string };
  onAction: (t: string) => void;
}) {
  const sessions = player.timeline.filter((e) => e.type === 'session' || e.type === 'login').slice(0, 4);
  const events = player.timeline.slice(0, 5);
  const messages = MOCK_CAMPAIGNS.slice(0, 3);
  const maskedPhone = player.phone.replace(/\d(?=\d{3})/g, '•');

  return (
    <div className="p-tabs ov">
      <div className="nba glass-panel">
        <span className="tag">Next Best Action</span>
        <h3>{nba.title}</h3>
        <p>{nba.reason}</p>
        <button onClick={() => onAction(nba.cta)}>{nba.cta}</button>
      </div>

      <div className="cols">
        {/* LEFT: profile attributes */}
        <div className="col">
          <Panel title="Basic Data">
            <Field k="User ID" v={player.id} />
            <Field k="Customer ID" v={player.id.replace('PL-', 'CX')} />
            <Field k="Email" v={player.email} />
            <Field k="Mobile Number" v={maskedPhone} />
            <Field k="Country" v={player.country} />
            <Field k="Currency" v={player.currency} />
            <Field k="Registered" v={new Date(player.registeredAt).toLocaleDateString()} />
            <Field k="KYC Status" v={player.kycStatus} />
          </Panel>

          <Panel title="Featured Attributes">
            <Field k="Lifecycle" v={player.lifecycle.replace('_', ' ')} />
            <Field k="Primary Product" v={player.primaryProduct} />
            <Field k="Lifetime Value" v={formatCurrency(player.ltv, player.currency)} />
            <Field k="ARPU" v={formatCurrency(player.arpu, player.currency)} />
            <Field k="Real Balance" v={formatCurrency(player.realBalance, player.currency)} />
            <Field k="Bonus Balance" v={formatCurrency(player.bonusBalance, player.currency)} />
            <Field k="Favourite Game" v={player.favouriteGame} />
            <Field k="Total Bets" v={player.totalBets.toLocaleString()} />
          </Panel>

          {player.rgFlags.length > 0 && (
            <div className="flags glass-panel">
              <h4>Responsible Gaming flags</h4>
              <ul>{player.rgFlags.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          )}
        </div>

        {/* RIGHT: activity feeds */}
        <div className="col">
          <Panel title="Latest Sessions">
            {sessions.length === 0 ? <p className="empty">No recent sessions.</p> : (
              <ul className="feed">
                {sessions.map((s) => (
                  <li key={s.id}><span className="dot" style={{ background: ACTIVITY_LABEL[s.type] }} /><div><p>{s.label}</p><time>{timeAgo(s.timestamp)}</time></div></li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Latest Events">
            {events.length === 0 ? <p className="empty">No events yet.</p> : (
              <ul className="feed">
                {events.map((e) => (
                  <li key={e.id}><span className="dot" style={{ background: ACTIVITY_LABEL[e.type] }} /><div><p>{e.label}{e.amount ? ` · ${formatCurrency(e.amount, player.currency)}` : ''}</p><time>{timeAgo(e.timestamp)}</time></div></li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Latest Messages">
            <ul className="feed">
              {messages.map((m) => (
                <li key={m.name}><span className="dot" style={{ background: m.engaged ? '#699951' : '#94a3b8' }} /><div><p>{m.name} · <em>{m.channel}</em></p><time>{m.status} · {m.date}</time></div></li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-tabs panel glass-panel">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="p-tabs field">
      <span>{k}</span><b>{v}</b>
    </div>
  );
}

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  login: '#38bdf8', deposit: '#699951', withdrawal: '#fb923c',
  bet: '#a855f7', win: '#F2D641', bonus: '#f472b6', session: '#94a3b8',
};

export function Timeline({ player }: { player: Player }) {
  return (
    <div className="p-tabs tl">
      {player.timeline.map((e) => (
        <div key={e.id} className="row">
          <span className="dot" style={{ background: ACTIVITY_LABEL[e.type] }} />
          <div className="c">
            <p>{e.label}{e.amount ? ` · ${formatCurrency(e.amount, player.currency)}` : ''}</p>
            <span>{timeAgo(e.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Financials({ player }: { player: Player }) {
  const rows = [
    ['Total deposits', formatCurrency(player.totalDeposits, player.currency)],
    ['Total withdrawals', formatCurrency(player.totalWithdrawals, player.currency)],
    ['Net position', formatCurrency(player.totalDeposits - player.totalWithdrawals, player.currency)],
    ['Deposit frequency', `${player.depositFrequency} / month`],
    ['Bonus cost ratio', `${Math.round(player.bonusCostRatio * 100)}%`],
    ['GGR', formatCurrency(player.ggr, player.currency)],
    ['NGR', formatCurrency(player.ngr, player.currency)],
    ['Lifetime value', formatCurrency(player.ltv, player.currency)],
  ];
  return (
    <div className="p-tabs fin glass-panel">
      <table>
        <tbody>
          {rows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function Bonuses({ player }: { player: Player }) {
  if (player.bonuses.length === 0) return <p className="muted">No bonuses on record.</p>;
  return (
    <div className="p-tabs bn">
      {player.bonuses.map((b) => (
        <div key={b.id} className="card glass-panel">
          <div className="top">
            <b>{b.name}</b>
            <span className={`st ${b.status}`}>{b.status}</span>
          </div>
          <p className="val">{formatCurrency(b.value, player.currency)}</p>
          {b.wageringRemaining != null && (
            <div className="wag">
              <span>Wagering remaining · {b.wageringRemaining}%</span>
              <div className="track"><span style={{ width: `${100 - b.wageringRemaining}%` }} /></div>
            </div>
          )}
          <span className="date">Granted {timeAgo(b.grantedAt)}</span>
        </div>
      ))}
    </div>
  );
}

const MOCK_CAMPAIGNS = [
  { name: 'Weekend Acca Boost', channel: 'Push', status: 'Delivered', engaged: true, date: '2026-01-05' },
  { name: 'Deposit Match 50%', channel: 'Email', status: 'Opened', engaged: true, date: '2025-12-28' },
  { name: 'Win-back Free Bet', channel: 'SMS', status: 'Sent', engaged: false, date: '2025-12-15' },
];

export function Campaigns({ player }: { player: Player }) {
  return (
    <div className="p-tabs cmp glass-panel">
      <table>
        <thead><tr><th>Campaign</th><th>Channel</th><th>Status</th><th>Engaged</th><th>Date</th></tr></thead>
        <tbody>
          {MOCK_CAMPAIGNS.map((c) => (
            <tr key={c.name}>
              <td>{c.name}</td><td>{c.channel}</td><td>{c.status}</td>
              <td>{c.engaged ? '✓' : '—'}</td><td>{c.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">Showing simulated campaign history for {player.name.split(' ')[0]}. Live data wires in Phase 4.</p>
    </div>
  );
}

export function Notes({ notes, draft, setDraft, onSave }: {
  notes: PlayerNote[];
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="p-tabs nt">
      <div className="composer glass-panel">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an operator note…" rows={3} />
        <button onClick={onSave}>Save note</button>
      </div>
      {notes.length === 0 ? <p className="muted">No notes yet.</p> : (
        <ul className="list">
          {notes.map((n) => (
            <li key={n.id} className="glass-panel">
              <div className="h"><b>{n.author}</b><span className={`k ${n.kind}`}>{n.kind}</span><time>{timeAgo(n.createdAt)}</time></div>
              <p>{n.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

