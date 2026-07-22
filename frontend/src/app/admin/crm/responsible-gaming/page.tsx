'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, ShieldCheck, Eye, AlertOctagon, ClipboardList, X, Ban, TrendingUp, Activity, Gauge } from 'lucide-react';
import { Player, getPlayers } from '@/data/players';
import {
  RgCase, RgActionKey, RG_ACTIONS, TIER_META, buildCases, buildOverview,
  Intervention, getInterventions, logIntervention, resolvedIds,
  PlayerSafeguards, LimitPeriod, getSafeguards, saveSafeguards,
} from '@/data/rg';
import { useCountry } from '@/context/CountryContext';


export default function ResponsibleGamingPage() {
 const { isInScope, selectedCountry } = useCountry();
  const [players, setPlayers] = useState<Player[]>([]);
  const [log, setLog] = useState<Intervention[]>([]);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<RgCase | null>(null);
  const [action, setAction] = useState<RgActionKey>('monitor');
  const [note, setNote] = useState('');
  const [guard, setGuard] = useState<PlayerSafeguards | null>(null);
  // Draft safeguard controls in the review modal.
  const [depAmt, setDepAmt] = useState('');
  const [depPer, setDepPer] = useState<LimitPeriod>('daily');
  const [coolDays, setCoolDays] = useState('');
  const [exclude, setExclude] = useState(false);

  useEffect(() => {
    setPlayers(getPlayers());
    setLog(getInterventions());
    setResolved(resolvedIds());
  }, []);

 const scoped = players.filter((p) => isInScope(p.country));
 const cases = buildCases(scoped);
 const overview = buildOverview(scoped);
  const critical = cases.filter((c) => c.tier === 'critical').length;
  const high = cases.filter((c) => c.tier === 'high').length;
  const monitor = cases.filter((c) => c.tier === 'monitor').length;
  const open = cases.filter((c) => !resolved.has(c.player.id));

  const openCase = (c: RgCase) => {
    setActive(c); setAction(c.recommended); setNote('');
    const g = getSafeguards(c.player.id) || null;
    setGuard(g);
    setDepAmt(g?.depositLimit ? String(g.depositLimit.amount) : '');
    setDepPer(g?.depositLimit?.period || 'daily');
    setCoolDays('');
    setExclude(!!g?.selfExcludedUntil);
  };
  const submit = () => {
    if (!active) return;
    // Persist any safeguard changes alongside the logged intervention.
    const patch: Partial<PlayerSafeguards> = {};
    if (depAmt) patch.depositLimit = { amount: Number(depAmt), period: depPer };
    if (coolDays) patch.coolOffUntil = new Date(Date.now() + Number(coolDays) * 864e5).toISOString();
    if (exclude) patch.selfExcludedUntil = 'permanent';
    if (Object.keys(patch).length) saveSafeguards(active.player.id, patch);
    const updated = logIntervention(active.player, action, note);
    setLog(updated);
    setResolved(new Set(updated.map((i) => i.playerId)));
    setActive(null);
  };


  return (
    <div className="responsible-gaming-page ds-page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Responsible Gaming</h1>
          <p className="page-subtitle">Triage at-risk players, log safer-gambling interventions, and keep an audit trail. · {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'All markets'}</p>
        </div>
      </div>

      <div className="rg-kpis">
        <div className="kpi glass-panel"><div className="kpi-icon" style={{ color: '#f87171' }}><AlertOctagon size={20} /></div><div><p className="kpi-label">Critical</p><p className="kpi-value">{critical}</p></div></div>
        <div className="kpi glass-panel"><div className="kpi-icon" style={{ color: '#fb923c' }}><ShieldAlert size={20} /></div><div><p className="kpi-label">High Risk</p><p className="kpi-value">{high}</p></div></div>
        <div className="kpi glass-panel"><div className="kpi-icon" style={{ color: '#eab308' }}><Eye size={20} /></div><div><p className="kpi-label">Monitoring</p><p className="kpi-value">{monitor}</p></div></div>
        <div className="kpi glass-panel"><div className="kpi-icon" style={{ color: '#699951' }}><ShieldCheck size={20} /></div><div><p className="kpi-label">Interventions Logged</p><p className="kpi-value">{log.length}</p></div></div>
      </div>

      <div className="overview">
        <div className="ov-card glass-panel">
          <h2 className="section-title section-title--overview"><Activity size={15} /> Risk Distribution</h2>
          <div className="dist">
            {(['critical', 'high', 'monitor', 'healthy'] as const).map((t) => {
              const val = overview[t];
              const pct = overview.total ? Math.round((val / overview.total) * 100) : 0;
              return (
                <div key={t} className="dist-row">
                  <span className="dist-label" style={{ color: TIER_META[t].color }}>{TIER_META[t].label}</span>
                  <div className="dist-track"><span className="dist-fill" style={{ width: `${pct}%`, background: TIER_META[t].color }} /></div>
                  <span className="dist-val">{val} · {pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="ov-stats">
            <div><span className="ov-n">{overview.selfExcluded}</span><span className="ov-c">Self-excluded</span></div>
            <div><span className="ov-n">{overview.activeLimits}</span><span className="ov-c">Active safeguards</span></div>
            <div><span className="ov-n">{overview.avgRisk}</span><span className="ov-c">Avg RG score</span></div>
          </div>
        </div>

        <div className="ov-card glass-panel">
          <h2 className="section-title section-title--overview"><TrendingUp size={15} /> Portfolio Risk · 8 wks</h2>
          <div className="spark">
            {overview.trend.map((p) => (
              <div key={p.label} className="spark-col" title={`${p.label}: ${p.value}`}>
                <span className="spark-bar" style={{ height: `${p.value}%` }} />
                <span className="spark-lab">{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ov-card glass-panel">
          <h2 className="section-title section-title--overview"><Gauge size={15} /> Top Markers</h2>
          <div className="markers">
            {overview.topSignals.length === 0 && <p className="log-empty log-empty--padded">No markers detected.</p>}
            {overview.topSignals.map((m) => (
              <div key={m.label} className="marker">
                <span className={`mk-dot s-${m.severity}`} />
                <span className="mk-label">{m.label}</span>
                <span className="mk-count">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cols">
        <div className="col-main">
          <div className="queue glass-panel">

            <div className="queue-head">
              <h2 className="section-title section-title--flush">Case Queue</h2>
              <span className="count">{open.length} open · {cases.length} total</span>
            </div>
            {cases.length === 0 && <div className="empty">No players currently flagged. All clear.</div>}
            {cases.map((c) => {
              const meta = TIER_META[c.tier];
              const done = resolved.has(c.player.id);
              const initials = c.player.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
              return (
                <div key={c.player.id} className={`case ${done ? 'done' : ''}`}>
                  <span className="tier-bar" style={{ background: meta.color }} />
                  <div className="avatar" style={{ color: meta.color, borderColor: meta.color }}>{initials}</div>
                  <div className="case-main">
                    <div className="case-head">
                      <Link href={`/admin/crm/${c.player.id}`} className="case-name">{c.player.name}</Link>
                      <span className="tier-pill" style={{ color: meta.color, background: `${meta.color}1a` }}>{meta.label}</span>
                      {done && <span className="resolved">✓ Actioned</span>}
                    </div>
                    <div className="signals">
                      {c.signals.slice(0, 4).map((s) => (
                        <span key={s.key} className={`sig s-${s.severity}`} title={s.detail}>{s.label}</span>
                      ))}
                      {c.signals.length > 4 && <span className="sig-more">+{c.signals.length - 4}</span>}
                    </div>
                  </div>
                  <div className="case-score">
                    <span className="score-num" style={{ color: meta.color }}>{c.player.rgRisk}</span>
                    <span className="score-cap">RG score</span>
                  </div>
                  <button className="review-btn" onClick={() => openCase(c)} disabled={done}>
                    {done ? 'Done' : 'Review'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-side">
          <div className="log glass-panel">
            <h2 className="section-title section-title--audit"><ClipboardList size={15} /> Audit Trail</h2>
            {log.length === 0 && <p className="log-empty">No interventions recorded yet.<br />Review a case to start the trail.</p>}
            {log.map((i) => (
              <div key={i.id} className="log-item">
                <div className="log-top"><span className="log-action">{i.actionLabel}</span><span className="log-time">{new Date(i.createdAt).toLocaleDateString()}</span></div>
                <p className="log-player">{i.playerName}</p>
                {i.note && <p className="log-note">“{i.note}”</p>}
                <p className="log-op">by {i.operator}</p>
              </div>
            ))}
          </div>
        </div>
      </div>


      {active && (
        <div className="modal-overlay" onClick={() => setActive(null)}>
          <div className="modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Review · {active.player.name}</h3>
                <p className="modal-sub">{active.player.id} · RG Risk {active.player.rgRisk} · {TIER_META[active.tier].label}</p>
              </div>
              <button className="modal-close" onClick={() => setActive(null)}><X size={18} /></button>
            </div>

            <div className="modal-signals">
              {active.signals.map((s) => (<div key={s.key} className={`msig s-${s.severity}`}><strong>{s.label}</strong><span>{s.detail}</span></div>))}
            </div>

            <label className="field-label">Intervention</label>
            <div className="action-grid">
              {(Object.keys(RG_ACTIONS) as RgActionKey[]).map((k) => (
                <button key={k} className={`act-opt tone-${RG_ACTIONS[k].tone} ${action === k ? 'sel' : ''}`} onClick={() => setAction(k)}>
                  <span className="act-title">{RG_ACTIONS[k].label}{k === active.recommended && <em> · suggested</em>}</span>
                  <span className="act-desc">{RG_ACTIONS[k].description}</span>
                </button>
              ))}
            </div>

              <label className="field-label">Safeguards</label>
              <div className="guards">
                {guard?.updatedAt && (
                  <p className="guard-hint">Existing safeguards last updated {new Date(guard.updatedAt).toLocaleDateString()}.</p>
                )}
                <div className="guard-row">
                  <span className="guard-lab">Deposit limit</span>
                  <input className="guard-input" type="number" min="0" placeholder="Amount" value={depAmt} onChange={(e) => setDepAmt(e.target.value)} />
                  <select className="guard-input" value={depPer} onChange={(e) => setDepPer(e.target.value as LimitPeriod)}>
                    <option value="daily">/ day</option>
                    <option value="weekly">/ week</option>
                    <option value="monthly">/ month</option>
                  </select>
                </div>
                <div className="guard-row">
                  <span className="guard-lab">Cool-off</span>
                  <input className="guard-input" type="number" min="0" placeholder="Days" value={coolDays} onChange={(e) => setCoolDays(e.target.value)} />
                  <span className="guard-note">Enforces a temporary block</span>
                </div>
                <button className={`excl-toggle ${exclude ? 'on' : ''}`} onClick={() => setExclude((v) => !v)}>
                  <Ban size={14} /> {exclude ? 'Self-exclusion will be applied' : 'Apply self-exclusion'}
                </button>
              </div>

              <label className="field-label">Case note</label>
              <textarea className="note-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context for the audit trail…" rows={3} />

              <div className="modal-foot">

              <button className="btn-ghost" onClick={() => setActive(null)}>Cancel</button>
              <button className="btn-primary" onClick={submit}>Log Intervention</button>
            </div>
          </div>
        </div>
      )}
</div>
);
}

