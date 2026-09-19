'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ChevronDown, ChevronUp, FlaskConical, History, Plus, Trash2 } from 'lucide-react';
import T from '@/theme/tokens';
import { Badge, Checkbox, DateTimeField, DestructiveGhostButton, PrimaryButton, parseIsoDateTime, toIsoDateTime } from '@/components/ui';
import { EVENT_CATALOG, getCatalogEvent } from '@/data/event-catalog';
import type { EventId } from '@/data/event-catalog';
import { markTutorialProgress } from '@/data/manual';
import { CHANNELS, CHANNEL_LABELS, loadPromotions, PROMO_SEED } from '@/lib/promotions';
import type { Channel, Promo } from '@/lib/promotions';
import { loadSettings } from '@/lib/settings';
import { clearRuns, defaultEvent, fmtK, GAME_CODES, getPersona, isBetEvent, loadRuns, newEventId, PERSONAS, PICKER_FIELDS, PRESETS, recordRun, simulate } from '@/lib/simulator';
import type { CheckStatus, Scenario, ScenarioEvent, SimulationResult, SimulationRun, StageId } from '@/lib/simulator';
import './simulator.css';

const statusColor: Record<CheckStatus, string> = { PASS: T.success, FAIL: T.destructive, SKIPPED: T.draft };
/* Form control chrome from tokens; layout lives in simulator.css. */
const inputStyle: CSSProperties = { border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, background: T.white, color: T.textPrimary };
/* Deterministic default "now" so the same scenario always evaluates identically. */
const FIXED_DEFAULT = '2026-09-17T14:00';

function clonePreset(id: string): Scenario {
  const preset = PRESETS.find((item) => item.id === id) ?? PRESETS[0];
  return { promoId: preset.promoId, personaId: preset.personaId, fixedAt: FIXED_DEFAULT, channel: 'app', events: preset.events.map((event) => ({ ...event, id: newEventId(), params: { ...event.params } })) };
}

function Status({ value }: { value: CheckStatus }) {
  return <Badge color={statusColor[value]}>{value}</Badge>;
}

function Inspector({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="sim-inspector-section">
      <h3>{title}</h3>
      {rows.length ? rows.map(([key, value], index) => <div className="sim-kv" key={`${key}-${index}`}><span>{key}</span><b>{value}</b></div>) : <p className="sim-empty">Not configured</p>}
    </section>
  );
}

export default function SimulatorPage() {
  /* Stores are SSR-safe (seed / empty on the server), so lazy initialisers replace a hydration effect. */
  const [promos] = useState<Promo[]>(() => loadPromotions());
  const [scenario, setScenario] = useState<Scenario>(() => clonePreset('aviator-qualifying-day'));
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selected, setSelected] = useState<StageId>('trigger');
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [runs, setRuns] = useState<SimulationRun[]>(() => loadRuns());

  const activePromos = promos.filter((promo) => promo.status !== 'draft');
  const channelPromos = activePromos.filter((item) => item.channels.includes(scenario.channel));
const promo = channelPromos.find((item) => item.id === scenario.promoId) ?? channelPromos[0] ?? PROMO_SEED[0];
  const evaluation = result ?? simulate(promo, getPersona(scenario.personaId), scenario.events, scenario.fixedAt, loadSettings(), scenario.channel);
  const inspector = evaluation.stages.find((stage) => stage.id === selected) ?? evaluation.stages[0];
  const catalog = useMemo(() => EVENT_CATALOG.flatMap((category) => category.events), []);

  const updateEvent = (id: string, patch: Partial<ScenarioEvent>) => setScenario((current) => ({ ...current, events: current.events.map((event) => (event.id === id ? { ...event, ...patch } : event)) }));
  const updateParam = (id: string, name: string, value: string) => setScenario((current) => ({ ...current, events: current.events.map((event) => (event.id === id ? { ...event, params: { ...event.params, [name]: value } } : event)) }));
  const moveEvent = (index: number, delta: number) => setScenario((current) => { const events = [...current.events]; const target = index + delta; if (target < 0 || target >= events.length) return current; [events[index], events[target]] = [events[target], events[index]]; return { ...current, events }; });
  const loadPreset = (id: string) => { setScenario(clonePreset(id)); setResult(null); setSelected('trigger'); };
const setChannel = (channel: Channel) => {
const eligible = activePromos.filter((item) => item.channels.includes(channel));
setScenario((current) => {
const promoId = eligible.some((item) => item.id === current.promoId) ? current.promoId : eligible[0]?.id ?? current.promoId;
return { ...current, channel, promoId };
});
setResult(null);
};
  const restore = (item: SimulationRun) => { setScenario({ ...item.scenario, channel: item.scenario.channel ?? 'app', events: item.scenario.events.map((event) => ({ ...event, id: newEventId(), isLive: event.isLive === true, params: { ...event.params } })) }); setResult(null); setTab('new'); };
  const run = () => {
    const output = simulate(promo, getPersona(scenario.personaId), scenario.events, scenario.fixedAt, loadSettings(), scenario.channel);
    setResult(output);
    setSelected(output.failedAt ?? 'ledger');
    setRuns(recordRun({ promoId: promo.id, promoName: promo.name, personaId: scenario.personaId, outcome: output.outcome, failedAt: output.failedAt, scenario }));
    markTutorialProgress('simulation');
  };

  return (
    <main className="sim-page" style={{ background: T.offWhite, color: T.textPrimary }}>
      <header className="sim-header">
        <div><h1>Promotion simulator</h1><p style={{ color: T.textSecondary }}>Run a promotion’s configured rules against a deterministic player-event scenario.</p></div>
        <FlaskConical size={24} style={{ color: T.navy }} />
      </header>
      <nav className="sim-tabs" aria-label="Simulator views" style={{ borderBottom: `1px solid ${T.border}` }}>
        <button className={tab === 'new' ? 'sim-tab sim-tab--active' : 'sim-tab'} style={{ borderColor: tab === 'new' ? T.navy : 'transparent', color: T.textPrimary }} onClick={() => setTab('new')}>New simulation</button>
        <button className={tab === 'history' ? 'sim-tab sim-tab--active' : 'sim-tab'} style={{ borderColor: tab === 'history' ? T.navy : 'transparent', color: T.textPrimary }} onClick={() => setTab('history')}><History size={15} /> History ({runs.length})</button>
      </nav>
      {tab === 'history' ? (
        <section className="sim-card sim-history" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
          <div className="sim-section-head">
            <div><h2>Persisted runs</h2><p style={{ color: T.textSecondary }}>Stored in this browser; newest first, maximum 25.</p></div>
            {runs.length > 0 && <DestructiveGhostButton onClick={() => { if (window.confirm('Clear all simulator history?')) { clearRuns(); setRuns([]); } }}>Clear history</DestructiveGhostButton>}
          </div>
          {runs.length === 0 ? <p className="sim-empty" style={{ color: T.textSecondary }}>No simulations saved yet.</p> : (
            <div className="sim-run-list">
              {runs.map((item) => (
                <button key={item.id} className="sim-run" style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, background: T.white, color: T.textPrimary }} onClick={() => restore(item)}>
                  <Status value={item.outcome} />
                  <span className="sim-run__main"><strong>{item.promoName}</strong><small style={{ color: T.textSecondary }}>{getPersona(item.personaId).label} · {item.scenario.events.length} events · {new Date(item.createdAt).toLocaleString('en-GB')}</small></span>
                  <span style={{ color: T.textSecondary }}>{item.failedAt ? `Failed at ${item.failedAt}` : 'Completed'}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="sim-grid">
          <section className="sim-card sim-scenario" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
            <div className="sim-section-head"><div><h2>Scenario</h2><p style={{ color: T.textSecondary }}>Choose a preset or edit the event sequence.</p></div></div>
            <label className="sim-field">Preset<select style={inputStyle} value="" onChange={(e) => { if (e.target.value) loadPreset(e.target.value); }}><option value="">Load a preset…</option>{PRESETS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
            <label className="sim-field">Channel<select style={inputStyle} value={scenario.channel} onChange={(e) => { setChannel(e.target.value as Channel); }}>{CHANNELS.map((channel) => <option value={channel} key={channel}>{CHANNEL_LABELS[channel]}</option>)}</select></label>
<label className="sim-field">Promotion<select style={inputStyle} value={promo.id} onChange={(e) => { setScenario({ ...scenario, promoId: e.target.value }); setResult(null); }}>{channelPromos.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.name}</option>)}</select></label>
            <label className="sim-field">Persona<select style={inputStyle} value={scenario.personaId} onChange={(e) => { setScenario({ ...scenario, personaId: e.target.value }); setResult(null); }}>{PERSONAS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
            <div className="sim-field" role="group" aria-labelledby="sim-fixed-at-label">
<span id="sim-fixed-at-label">Fixed at</span>
<DateTimeField showTime timezoneLabel="Africa/Lusaka" ariaLabel="Fixed at" value={parseIsoDateTime(scenario.fixedAt)} onChange={(d) => { setScenario({ ...scenario, fixedAt: d ? toIsoDateTime(d) : FIXED_DEFAULT }); setResult(null); }} />
</div>
            <div className="sim-events-head">
              <h3>Event sequence ({scenario.events.length})</h3>
              <button type="button" className="sim-icon-button" aria-label="Add event" style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.textPrimary }} onClick={() => { setScenario({ ...scenario, events: [...scenario.events, defaultEvent('bet_settled')] }); setResult(null); }}><Plus size={16} /></button>
            </div>
            <div className="sim-events">
              {scenario.events.length === 0 && <p className="sim-empty" style={{ color: T.textSecondary }}>No events. Add one to evaluate the trigger stage.</p>}
              {scenario.events.map((event, index) => {
                const eventDef = getCatalogEvent(event.eventId);
                return (
                  <article className="sim-event" key={event.id} style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
                    <div className="sim-event-top">
                      <strong>#{index + 1}</strong>
                      <select style={inputStyle} aria-label="Event type" value={event.eventId} onChange={(e) => { updateEvent(event.id, { ...defaultEvent(e.target.value as EventId), id: event.id, offsetMinutes: event.offsetMinutes }); setResult(null); }}>{catalog.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
                      <button type="button" className="sim-icon-button" aria-label="Move event earlier" style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.textPrimary }} disabled={index === 0} onClick={() => { moveEvent(index, -1); setResult(null); }}><ChevronUp size={14} /></button>
                      <button type="button" className="sim-icon-button" aria-label="Move event later" style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.textPrimary }} disabled={index === scenario.events.length - 1} onClick={() => { moveEvent(index, 1); setResult(null); }}><ChevronDown size={14} /></button>
                      <button type="button" className="sim-icon-button" aria-label="Remove event" style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.destructive }} onClick={() => { setScenario((s) => ({ ...s, events: s.events.filter((item) => item.id !== event.id) })); setResult(null); }}><Trash2 size={14} /></button>
                    </div>
                    <div className="sim-event-fields">
                      <label className="sim-field">Minutes from fixed time<input style={inputStyle} type="number" value={event.offsetMinutes} onChange={(e) => { updateEvent(event.id, { offsetMinutes: Number(e.target.value) || 0 }); setResult(null); }} /></label>
                      <label className="sim-field">Provider<select style={inputStyle} value={event.gameCode} onChange={(e) => { updateEvent(event.id, { gameCode: e.target.value }); setResult(null); }}>{GAME_CODES.map((code) => <option key={code}>{code}</option>)}</select></label>
                {isBetEvent(event.eventId) && <div className="sim-field sim-field--checkbox"><Checkbox checked={event.isLive} label="Live bet" onChange={(checked) => { updateEvent(event.id, { isLive: checked }); setResult(null); }} /></div>}
                      {PICKER_FIELDS[event.eventId].map((name) => {
                        const param = eventDef?.params.find((item) => item.name === name);
                        const options = param?.type === 'boolean' ? ['Yes', 'No'] : param?.options;
                        return <label className="sim-field" key={name}>{name}{options ? <select style={inputStyle} value={event.params[name] ?? ''} onChange={(e) => { updateParam(event.id, name, e.target.value); setResult(null); }}>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input style={inputStyle} value={event.params[name] ?? ''} onChange={(e) => { updateParam(event.id, name, e.target.value); setResult(null); }} />}</label>;
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
            <PrimaryButton onClick={run}>Run simulation</PrimaryButton>
          </section>
          <section className="sim-card sim-pipeline" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
            <div className="sim-section-head">
              <div><h2>Pipeline evaluation</h2><p style={{ color: T.textSecondary }}>{result ? `Saved run · outcome ${result.outcome}${result.failedAt ? ` at ${result.failedAt}` : ''}` : 'Live preview · run to save to history'}</p></div>
              <Status value={evaluation.outcome} />
            </div>
            <div className="sim-stages">
              {evaluation.stages.map((stage) => (
                <div key={stage.id} role="button" tabIndex={0} aria-pressed={selected === stage.id} className={selected === stage.id ? 'sim-stage sim-stage--selected' : 'sim-stage'} style={{ border: `1px solid ${selected === stage.id ? T.navy : T.border}`, borderRadius: T.radiusSm, background: selected === stage.id ? T.offWhite : T.white }} onClick={() => setSelected(stage.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(stage.id); } }}>
                  <div className="sim-stage-head"><div><strong>{stage.title}</strong><small style={{ color: T.textSecondary }}>{stage.summary}</small></div><Status value={stage.status} /></div>
                  <div className="sim-checks">
                    {stage.checks.map((item) => (
                      <p key={item.label} className="sim-check">
                        <span className="sim-check__status" style={{ color: statusColor[item.status] }}>{item.status}</span>
                        <span className="sim-check__label">{item.label}</span>
                        <span className="sim-check__values" style={{ color: T.textSecondary }}>{item.status === 'SKIPPED' ? item.reason ?? 'Not configured' : <>actual <b style={{ color: T.textPrimary }}>{item.actual}</b> · required <b style={{ color: T.textPrimary }}>{item.required}</b></>}</span>
                      </p>
                    ))}
                  </div>
                  {stage.notes?.map((note) => <p className="sim-note" key={note} style={{ color: note.startsWith('Alert') ? T.destructive : T.success }}>{note}</p>)}
                  {stage.ledger && (
                    <div className="sim-ledger" style={{ background: T.offWhite, borderRadius: T.radiusSm }}>
                      {stage.ledger.lines.map((line) => <div className="sim-ledger__line" key={line.side}><span>{line.side} · {line.account}</span><b>{fmtK(line.amount)}</b></div>)}
                      <div className="sim-ledger__chips">{stage.ledger.chips.map((chip) => <span key={chip} style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusPill }}>{chip}</span>)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          <aside className="sim-card sim-inspector" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
            <div className="sim-section-head"><div><h2>Rule inspector</h2><p style={{ color: T.textSecondary }}>Selected stage: <strong>{inspector.title}</strong></p></div><Status value={inspector.status} /></div>
            <Inspector title="Configured rule fields" rows={inspector.config} />
            <Inspector title="Scenario inputs" rows={inspector.inputs} />
          </aside>
        </div>
      )}
    </main>
  );
}
