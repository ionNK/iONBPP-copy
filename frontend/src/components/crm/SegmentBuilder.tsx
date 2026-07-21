'use client';
import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, Users, Crown, AlertTriangle, Gift, Sparkles, Moon, PenLine } from 'lucide-react';
import { getPlayers } from '@/data/players';
import {
  Segment, Rule, fieldDef, operatorLabel,
  operatorArity, DATE_UNITS, DateUnit,
  newRule, segmentMembers, saveSegment, SEGMENT_TEMPLATES, SegmentTemplate,
} from '@/data/segments';

import styles from './SegmentBuilder.module.css';
import FieldPicker from './FieldPicker';

const TPL_ICONS = {
  crown: Crown, alert: AlertTriangle, gift: Gift, sparkles: Sparkles, moon: Moon, blank: PenLine,
} as const;

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`;
}

export default function SegmentBuilder({
  initial, onClose, onSaved,
}: { initial: Segment; onClose: () => void; onSaved: () => void }) {
  const isEditing = initial.rules.length > 0 || !!initial.name;
  // Show the template gallery only for a brand-new segment.
  const [phase, setPhase] = useState<'template' | 'edit'>(isEditing ? 'edit' : 'template');
  const [seg, setSeg] = useState<Segment>(initial);

  const players = useMemo(() => getPlayers(), []);
  const members = useMemo(() => segmentMembers(seg, players), [seg, players]);
  const avgLtv = members.length ? members.reduce((s, p) => s + (p.ltv || 0), 0) / members.length : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const applyTemplate = (t: SegmentTemplate) => {
    const built = t.build();
    setSeg((s) => ({ ...s, ...built, rules: built.rules.length ? built.rules : [newRule()] }));
    setPhase('edit');
  };

  const set = (patch: Partial<Segment>) => setSeg((s) => ({ ...s, ...patch }));
  const setRule = (id: string, patch: Partial<Rule>) =>
    setSeg((s) => ({ ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const addRule = () => setSeg((s) => ({ ...s, rules: [...s.rules, newRule()] }));
  const removeRule = (id: string) => setSeg((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }));

  const onFieldChange = (id: string, field: string) => {
    const def = fieldDef(field);
    if (!def) return;
    const value = def.type === 'boolean' ? true : def.options?.[0]?.value ?? (def.type === 'number' || def.type === 'date' ? 0 : '');
    setRule(id, { field, operator: def.operators[0], value });
  };

  const save = () => {
    if (!seg.name.trim() || !seg.rules.length) return;
    saveSegment({ ...seg, updatedAt: new Date().toISOString() });
    onSaved();
  };

  const canSave = seg.name.trim().length > 0 && seg.rules.length > 0;

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-modal="true">
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>
              {phase === 'template' ? 'Create audience' : isEditing && initial.name ? 'Edit segment' : 'New segment'}
            </span>
            <h2 className={styles.title}>
              {phase === 'template' ? 'Choose a starting point' : seg.name || 'Untitled segment'}
            </h2>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>

        {phase === 'template' ? (
          <div className={styles.body}>
            <p className={styles.tplIntro}>Start from a proven template or build your own — you can fully customise every rule afterwards.</p>
            <div className={styles.tplGrid}>
              {SEGMENT_TEMPLATES.map((t) => {
                const Icon = TPL_ICONS[t.icon];
                return (
                  <button key={t.id} className={styles.tpl} onClick={() => applyTemplate(t)}>
                    <span className={styles.tplIcon}><Icon size={18} /></span>
                    <span className={styles.tplName}>{t.name}</span>
                    <span className={styles.tplDesc}>{t.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.section}>
              <label className={styles.label}>Segment name</label>
              <input className={styles.input} value={seg.name} autoFocus
                placeholder="e.g. High-value sportsbook players"
                onChange={(e) => set({ name: e.target.value })} />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Description <span style={{ textTransform: 'none', opacity: 0.6 }}>(optional)</span></label>
              <input className={styles.input} value={seg.description ?? ''}
                placeholder="What is this audience for?"
                onChange={(e) => set({ description: e.target.value })} />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Rules</label>
              <div className={styles.matchBar}>
                <span>Match</span>
                <div className={styles.matchToggle}>
                  <button className={`${styles.matchOpt} ${seg.match === 'all' ? styles.active : ''}`} onClick={() => set({ match: 'all' })}>ALL</button>
                  <button className={`${styles.matchOpt} ${seg.match === 'any' ? styles.active : ''}`} onClick={() => set({ match: 'any' })}>ANY</button>
                </div>
                <span>of the following conditions</span>
              </div>

              <div className={styles.rules}>
                {seg.rules.map((r, i) => {
                  const def = fieldDef(r.field);
                  return (
                    <div key={r.id}>
                      {i > 0 && <div className={styles.connector}>{seg.match === 'all' ? 'AND' : 'OR'}</div>}
                      <div className={styles.rule}>
                        <div className={styles.ruleGrid}>
                          <FieldPicker value={r.field} onChange={(field) => onFieldChange(r.id, field)} />

                        <select className={styles.sel} value={r.operator}
                          onChange={(e) => setRule(r.id, { operator: e.target.value as Rule['operator'] })}>
                          {def?.operators.map((op) => (
                            <option key={op} value={op}>{operatorLabel(op, def?.type)}</option>
                          ))}
                        </select>

                        {/* Value input(s) — driven by operator arity and field type. */}
                        {operatorArity(r.operator) === 0 ? (
                          <span className={styles.val} style={{ opacity: 0.5, display: 'flex', alignItems: 'center' }}>—</span>
                        ) : def?.type === 'boolean' ? (
                          <select className={styles.val} value={String(r.value)}
                            onChange={(e) => setRule(r.id, { value: e.target.value === 'true' })}>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : def?.options ? (
                          <select className={styles.val} value={String(r.value)}
                            onChange={(e) => setRule(r.id, { value: e.target.value })}>
                            {def.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <div className={styles.val} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input style={{ flex: 1, minWidth: 0 }}
                              type={def?.type === 'number' || def?.type === 'date' ? 'number' : 'text'}
                              value={String(r.value)}
                              onChange={(e) => setRule(r.id, { value: def?.type === 'number' || def?.type === 'date' ? Number(e.target.value) : e.target.value })} />
                            {operatorArity(r.operator) === 2 && (
                              <>
                                <span style={{ opacity: 0.6, fontSize: 12 }}>and</span>
                                <input style={{ flex: 1, minWidth: 0 }}
                                  type={def?.type === 'number' || def?.type === 'date' ? 'number' : 'text'}
                                  value={String(r.value2 ?? '')}
                                  onChange={(e) => setRule(r.id, { value2: def?.type === 'number' || def?.type === 'date' ? Number(e.target.value) : e.target.value })} />
                              </>
                            )}
                            {def?.type === 'date' && (
                              <select style={{ flexShrink: 0 }} value={r.unit ?? 'days'}
                                onChange={(e) => setRule(r.id, { unit: e.target.value as DateUnit })}>
                                {DATE_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                              </select>
                            )}
                          </div>
                        )}
                      </div>

                        <button className={styles.del} onClick={() => removeRule(r.id)}
                          disabled={seg.rules.length <= 1} aria-label="Remove rule">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className={styles.addRule} onClick={addRule}><Plus size={14} /> Add condition</button>
            </div>
          </div>
        )}

        {phase === 'edit' && (
          <footer className={styles.foot}>
            <div className={styles.audience}>
              <div className={styles.audLeft}>
                <Users size={22} className={styles.audIcon} />
                <div>
                  <div className={styles.audCount}>{members.length.toLocaleString()}</div>
                  <div className={styles.audLabel}>players match</div>
                </div>
              </div>
              <div className={styles.audRight}>
                <div className={styles.audLtv}>{avgLtv ? `${fmt(avgLtv)}` : '—'}</div>
                <div className={styles.audLabel}>avg LTV</div>
              </div>
            </div>

            {members.length > 0 && (
              <div className={styles.samples}>
                {members.slice(0, 4).map((p) => <span key={p.id} className={styles.chip}>{p.name}</span>)}
                {members.length > 4 && <span className={`${styles.chip} ${styles.chipMore}`}>+{members.length - 4} more</span>}
              </div>
            )}

            <div className={styles.actions}>
              <button className={`${styles.btn} ${styles.ghost}`} onClick={onClose}>Cancel</button>
              <button className={`${styles.btn} ${styles.save}`} onClick={save} disabled={!canSave}>Save segment</button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
}
