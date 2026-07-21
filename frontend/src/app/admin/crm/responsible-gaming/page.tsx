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
    <div className="page-container">
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
          <h2 className="section-title" style={{ margin: '0 0 16px 0' }}><Activity size={15} /> Risk Distribution</h2>
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
          <h2 className="section-title" style={{ margin: '0 0 16px 0' }}><TrendingUp size={15} /> Portfolio Risk · 8 wks</h2>
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
          <h2 className="section-title" style={{ margin: '0 0 16px 0' }}><Gauge size={15} /> Top Markers</h2>
          <div className="markers">
            {overview.topSignals.length === 0 && <p className="log-empty" style={{ padding: 12 }}>No markers detected.</p>}
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
              <h2 className="section-title" style={{ margin: 0 }}>Case Queue</h2>
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
            <h2 className="section-title" style={{ margin: '0 0 12px 0' }}><ClipboardList size={15} /> Audit Trail</h2>
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

      <style jsx>{STYLES}</style>
    </div>
  );
}

const STYLES = `
  .page-container { max-width: 1400px; margin: 0 auto; }
  .page-header { margin-bottom: 24px; }
  .page-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0; }
  .page-subtitle { font-size: 14px; color: var(--color-text-secondary); margin: 0; }
  .rg-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .kpi { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
  .kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--color-bg-input); }
  .kpi-label { font-size: 12px; color: var(--color-text-muted); margin: 0 0 2px 0; text-transform: uppercase; }
  .kpi-value { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  .overview { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .ov-card { padding: 20px; }
  .dist { display: flex; flex-direction: column; gap: 12px; }
  .dist-row { display: grid; grid-template-columns: 64px 1fr auto; align-items: center; gap: 10px; }
  .dist-label { font-size: 12px; font-weight: 700; }
  .dist-track { height: 8px; border-radius: 6px; background: var(--color-bg-input); overflow: hidden; }
  .dist-fill { display: block; height: 100%; border-radius: 6px; transition: width 0.4s ease; }
  .dist-val { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }
  .ov-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--color-border); }
  .ov-stats div { display: flex; flex-direction: column; align-items: center; }
  .ov-n { font-size: 20px; font-weight: 800; color: var(--color-text-primary); }
  .ov-c { font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); text-align: center; }
  .spark { display: flex; align-items: flex-end; gap: 8px; height: 130px; padding-top: 8px; }
  .spark-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 6px; }
  .spark-bar { width: 100%; max-width: 22px; border-radius: 5px 5px 0 0; background: linear-gradient(180deg, var(--color-betika-yellow, #F2D641), rgba(242,214,65,0.35)); min-height: 4px; transition: height 0.4s ease; }
  .spark-lab { font-size: 10px; color: var(--color-text-muted); }
  .markers { display: flex; flex-direction: column; gap: 8px; }
  .marker { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; background: var(--color-bg-input); }
  .mk-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .mk-dot.s-high { background: #f87171; } .mk-dot.s-medium { background: #fb923c; } .mk-dot.s-low { background: var(--color-text-muted); }
  .mk-label { flex: 1; font-size: 12px; color: var(--color-text-primary); }
  .mk-count { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); }
  .cols { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }

  .section-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 14px 0; }
  .count { font-size: 12px; font-weight: 500; color: var(--color-text-muted); background: var(--color-bg-input); padding: 3px 12px; border-radius: 20px; }
  .queue { padding: 8px; }
  .queue-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 14px; border-bottom: 1px solid var(--color-border); margin-bottom: 6px; }
  .case { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 10px; position: relative; transition: background 0.15s; }
  .case:hover { background: var(--color-bg-input); }
  .case.done { opacity: 0.5; }
  .tier-bar { position: absolute; left: 0; top: 12px; bottom: 12px; width: 3px; border-radius: 2px; }
  .avatar { flex-shrink: 0; width: 42px; height: 42px; border-radius: 50%; border: 1.5px solid; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; background: var(--color-bg-input); text-transform: uppercase; }
  .case-main { flex: 1; min-width: 0; }
  .case-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 7px; }
  .case-name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); text-decoration: none; }
  .case-name:hover { color: var(--color-betika-yellow, #F2D641); }
  .tier-pill { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; padding: 3px 9px; border-radius: 20px; }
  .resolved { font-size: 11px; font-weight: 600; color: #699951; }
  .signals { display: flex; flex-wrap: wrap; gap: 6px; }
  .sig { font-size: 11px; padding: 3px 9px; border-radius: 6px; border: 1px solid transparent; white-space: nowrap; }
  .s-high { color: #f87171; background: rgba(248,113,113,0.1); border-color: rgba(248,113,113,0.28); }
  .s-medium { color: #fb923c; background: rgba(251,146,60,0.1); border-color: rgba(251,146,60,0.28); }
  .s-low { color: var(--color-text-secondary); background: var(--color-bg-input); }
  .sig-more { font-size: 11px; padding: 3px 8px; border-radius: 6px; color: var(--color-text-muted); background: var(--color-bg-input); }
  .case-score { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; min-width: 54px; }
  .score-num { font-size: 22px; font-weight: 800; line-height: 1; }
  .score-cap { font-size: 10px; color: var(--color-text-muted); text-transform: uppercase; margin-top: 3px; }
  .review-btn { flex-shrink: 0; font-size: 13px; font-weight: 600; padding: 8px 20px; border-radius: 8px; border: none; background: var(--color-betika-yellow, #F2D641); color: #1a1a1a; cursor: pointer; }
  .review-btn:disabled { background: transparent; color: var(--color-text-muted); border: 1px solid var(--color-border); cursor: default; }
  .review-btn:not(:disabled):hover { filter: brightness(1.05); }
  .empty { text-align: center; color: var(--color-text-muted); font-style: italic; padding: 40px; }
  .log { padding: 16px; max-height: 640px; overflow-y: auto; }

  .log-empty { text-align: center; color: var(--color-text-muted); font-style: italic; padding: 24px; font-size: 13px; margin: 0; }
  .log-item { padding: 12px 14px; border-bottom: 1px solid var(--color-border); }
  .log-item:last-child { border-bottom: none; }
  .log-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .log-action { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
  .log-time { font-size: 11px; color: var(--color-text-muted); }
  .log-player { font-size: 12px; color: var(--color-text-secondary); margin: 0 0 2px 0; }
  .log-note { font-size: 12px; color: var(--color-text-secondary); font-style: italic; margin: 4px 0; }
  .log-op { font-size: 11px; color: var(--color-text-muted); margin: 0; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
  .modal { width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 24px; }
  .modal-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
  .modal-title { font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0; }
  .modal-sub { font-size: 12px; color: var(--color-text-muted); margin: 0; }
  .modal-close { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; }
  .modal-close:hover { color: var(--color-text-primary); }
  .modal-signals { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .msig { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 8px; border-left: 3px solid var(--color-border); background: var(--color-bg-input); }
  .msig.s-high { border-left-color: #f87171; }
  .msig.s-medium { border-left-color: #fb923c; }
  .msig strong { font-size: 13px; color: var(--color-text-primary); }
  .msig span { font-size: 12px; color: var(--color-text-secondary); }
  .field-label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 8px 0; }
  .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .act-opt { display: flex; flex-direction: column; gap: 2px; text-align: left; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: transparent; cursor: pointer; }
  .act-opt:hover { border-color: var(--color-text-muted); }
  .act-opt.sel { border-color: var(--color-betika-yellow, #F2D641); background: rgba(242,214,65,0.08); }
  .act-opt.tone-danger.sel { border-color: #f87171; background: rgba(248,113,113,0.08); }
  .act-opt.tone-warn.sel { border-color: #fb923c; background: rgba(251,146,60,0.08); }
  .act-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
  .act-title em { font-style: normal; font-size: 11px; color: var(--color-betika-yellow, #F2D641); }
  .act-desc { font-size: 11px; color: var(--color-text-muted); }
  .note-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-input); color: var(--color-text-primary); font-size: 13px; font-family: inherit; resize: vertical; margin-bottom: 20px; }
  .note-input:focus { outline: none; border-color: var(--color-betika-yellow, #F2D641); }
  .guards { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; padding: 14px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg-input); }
  .guard-hint { font-size: 11px; color: var(--color-text-muted); margin: 0; }
  .guard-row { display: flex; align-items: center; gap: 10px; }
  .guard-lab { flex-shrink: 0; width: 90px; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
  .guard-input { flex: 1; min-width: 0; padding: 8px 10px; border-radius: 7px; border: 1px solid var(--color-border); background: var(--color-bg-app); color: var(--color-text-primary); font-size: 13px; font-family: inherit; }
  .guard-input:focus { outline: none; border-color: var(--color-betika-yellow, #F2D641); }
  .guard-note { flex: 1; font-size: 11px; color: var(--color-text-muted); }
  .excl-toggle { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px; border-radius: 8px; border: 1px dashed var(--color-border); background: transparent; color: var(--color-text-secondary); font-size: 12px; font-weight: 600; cursor: pointer; }
  .excl-toggle:hover { border-color: #f87171; color: #f87171; }
  .excl-toggle.on { border-style: solid; border-color: #f87171; background: rgba(248,113,113,0.1); color: #f87171; }
  .modal-foot { display: flex; justify-content: flex-end; gap: 10px; }

  .btn-ghost { font-size: 13px; font-weight: 600; padding: 9px 18px; border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); cursor: pointer; }
  .btn-ghost:hover { border-color: var(--color-text-muted); }
  .btn-primary { font-size: 13px; font-weight: 600; padding: 9px 18px; border-radius: 8px; border: none; background: var(--color-betika-yellow, #F2D641); color: #1a1a1a; cursor: pointer; }
  .btn-primary:hover { filter: brightness(1.05); }
  @media (max-width: 1000px) { .cols { grid-template-columns: 1fr; } .rg-kpis { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .action-grid { grid-template-columns: 1fr; } }
`;

