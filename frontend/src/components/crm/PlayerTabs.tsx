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
    <div className="ov">
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

      <style jsx>{`
        .ov { display: flex; flex-direction: column; gap: 16px; }
        .nba { padding: 18px; border-left: 3px solid var(--color-primary); }
        .nba .tag { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: var(--color-primary); }
        .nba h3 { margin: 6px 0; }
        .nba p { color: var(--color-text-secondary); font-size: 13px; margin-bottom: 12px; }
        .nba button { background: var(--color-primary); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
        .col { display: flex; flex-direction: column; gap: 16px; }
        .flags { padding: 16px; }
        .flags h4 { margin-bottom: 8px; color: #f87171; }
        .flags ul { padding-left: 18px; color: var(--color-text-secondary); font-size: 13px; }
        .feed { display: flex; flex-direction: column; gap: 10px; }
        .feed li { display: flex; gap: 10px; align-items: flex-start; }
        .feed .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .feed p { font-size: 13px; }
        .feed em { color: var(--color-text-secondary); font-style: normal; }
        .feed time { font-size: 11px; color: var(--color-text-secondary); }
        .empty { font-size: 13px; color: var(--color-text-secondary); }
        @media (max-width: 720px) { .cols { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel glass-panel">
      <h4>{title}</h4>
      {children}
      <style jsx>{`
        .panel { padding: 16px; }
        .panel h4 { font-size: 13px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }
      `}</style>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="field">
      <span>{k}</span><b>{v}</b>
      <style jsx>{`
        .field { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; font-size: 13px; }
        .field span { color: var(--color-text-secondary); }
        .field b { font-weight: 600; text-align: right; text-transform: capitalize; }
      `}</style>
    </div>
  );
}

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  login: '#38bdf8', deposit: '#699951', withdrawal: '#fb923c',
  bet: '#a855f7', win: '#F2D641', bonus: '#f472b6', session: '#94a3b8',
};

export function Timeline({ player }: { player: Player }) {
  return (
    <div className="tl">
      {player.timeline.map((e) => (
        <div key={e.id} className="row">
          <span className="dot" style={{ background: ACTIVITY_LABEL[e.type] }} />
          <div className="c">
            <p>{e.label}{e.amount ? ` · ${formatCurrency(e.amount, player.currency)}` : ''}</p>
            <span>{timeAgo(e.timestamp)}</span>
          </div>
        </div>
      ))}
      <style jsx>{`
        .tl { display: flex; flex-direction: column; }
        .row { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
        .dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .c p { font-size: 14px; }
        .c span { font-size: 12px; color: var(--color-text-secondary); }
      `}</style>
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
    <div className="fin glass-panel">
      <table>
        <tbody>
          {rows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
        </tbody>
      </table>
      <style jsx>{`
        .fin { padding: 8px 18px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 12px 0; border-bottom: 1px solid var(--color-border); font-size: 14px; }
        td:last-child { text-align: right; font-weight: 600; }
        tr:last-child td { border-bottom: none; }
      `}</style>
    </div>
  );
}

export function Bonuses({ player }: { player: Player }) {
  if (player.bonuses.length === 0) return <p className="muted">No bonuses on record.</p>;
  return (
    <div className="bn">
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
      <style jsx>{`
        .bn { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .card { padding: 14px; }
        .top { display: flex; justify-content: space-between; align-items: center; }
        .st { font-size: 11px; text-transform: capitalize; padding: 2px 8px; border-radius: 6px; background: var(--color-bg-input); }
        .st.active { color: #699951; }
        .st.expired, .st.forfeited { color: #f87171; }
        .val { font-size: 18px; font-weight: 700; margin: 8px 0; }
        .wag span { font-size: 11px; color: var(--color-text-secondary); }
        .wag .track { height: 5px; border-radius: 3px; background: var(--color-bg-input); overflow: hidden; margin-top: 4px; }
        .wag .track span { display: block; height: 100%; background: var(--color-primary); }
        .date { font-size: 11px; color: var(--color-text-secondary); display: block; margin-top: 8px; }
      `}</style>
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
    <div className="cmp glass-panel">
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
      <style jsx>{`
        .cmp { padding: 8px 18px 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 8px; text-align: left; font-size: 13px; border-bottom: 1px solid var(--color-border); }
        th { color: var(--color-text-secondary); font-weight: 500; }
        .note { font-size: 12px; color: var(--color-text-secondary); margin-top: 10px; }
      `}</style>
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
    <div className="nt">
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
      <style jsx>{`
        .nt { display: flex; flex-direction: column; gap: 14px; }
        .composer { padding: 14px; }
        textarea { width: 100%; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px; color: var(--color-text-primary); resize: vertical; }
        .composer button { margin-top: 10px; background: var(--color-primary); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .list { display: flex; flex-direction: column; gap: 10px; }
        .list li { padding: 12px 14px; }
        .h { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .h time { margin-left: auto; font-size: 11px; color: var(--color-text-secondary); }
        .k { font-size: 10px; text-transform: uppercase; padding: 1px 6px; border-radius: 5px; background: var(--color-bg-input); }
        .k.action { color: var(--color-primary); }
        .list p { font-size: 14px; }
      `}</style>
    </div>
  );
}

