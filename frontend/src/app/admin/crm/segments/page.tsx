'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Users, Zap, Plus, Pencil, Trash2, Filter } from 'lucide-react';


import { Player, getPlayers } from '@/data/players';
import {
  Segment, getSegments, deleteSegment, newSegmentDraft,
  segmentMembers, fieldDef, OPERATOR_LABELS,
} from '@/data/segments';
import SegmentBuilder from '@/components/crm/SegmentBuilder';
import { useCountry } from '@/context/CountryContext';

export default function SegmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isInScope, selectedCountry } = useCountry();
  const [players, setPlayers] = useState<Player[]>([]);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [editing, setEditing] = useState<Segment | null>(null);

  useEffect(() => {
    setPlayers(getPlayers());
    setSegments(getSegments());
  }, []);

  // When the promotion wizard links here with ?create=1 (e.g. "+ Create New
  // Segment"), open the builder immediately so the user lands on a blank draft.
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setEditing(newSegmentDraft());
    }
  }, [searchParams]);


 // Only compute segment membership against players the admin can access.
 const scoped = useMemo(() => players.filter((p) => isInScope(p.country)), [players, isInScope]);

 const cards = useMemo(
 () => segments.map((s) => ({ seg: s, members: segmentMembers(s, scoped) })),
 [segments, scoped],
 );

  const remove = (id: string) => setSegments(deleteSegment(id));
  const onSaved = () => { setSegments(getSegments()); setEditing(null); };

  // Launch the promotion wizard with this segment pre-attached as the target audience.
  const target = (seg: Segment, count: number) => {
    const params = new URLSearchParams({
      segment: seg.id,
      segmentName: seg.name,
      audience: String(count),
    });
    router.push(`/admin/promotions/create?${params.toString()}`);
  };


  const ruleSummary = (s: Segment) =>
    s.rules.map((r) => `${fieldDef(r.field)?.label} ${OPERATOR_LABELS[r.operator]} ${r.value}`).join(s.match === 'all' ? '  AND  ' : '  OR  ');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Segments</h1>
          <p className="page-subtitle">Dynamic cohorts computed live from synced platform activity. · {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'All markets'}</p>
        </div>
        <button className="btn primary" onClick={() => setEditing(newSegmentDraft())}><Plus size={16} /> New segment</button>
      </div>

      <div className="seg-grid">
        {cards.map(({ seg, members }) => {
          const ltv = members.reduce((sum, p) => sum + p.ltv, 0);
          return (
            <div key={seg.id} className="seg-card glass-panel">
              <div className="seg-top">
                <div className="seg-titles">
                  <span className="seg-name">{seg.name}</span>
                  {seg.preset && <span className="badge">Preset</span>}
                </div>
                <span className="seg-count">{members.length}</span>
              </div>
              {seg.description && <p className="seg-desc">{seg.description}</p>}
              <div className="seg-rule"><Filter size={12} /> {ruleSummary(seg) || 'No rules'}</div>
              <div className="seg-meta">
                <span><Users size={13} /> {members.length} players</span>
                <span>LTV {ltv.toLocaleString()}</span>
              </div>
                <div className="seg-actions">
                  <button className="btn ghost" onClick={() => setEditing(seg)}><Pencil size={13} /> Edit</button>
                  {!seg.preset && <button className="btn ghost danger" onClick={() => remove(seg.id)}><Trash2 size={13} /></button>}
                  <button className="btn ghost primary-ghost" onClick={() => target(seg, members.length)} disabled={members.length === 0}><Zap size={13} /> Target</button>
                </div>
                </div>
                );

        })}
      </div>

      {editing && <SegmentBuilder initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}

      <style jsx>{`
        .page-container { max-width: 1400px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .page-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0; }
        .page-subtitle { font-size: 14px; color: var(--color-text-secondary); margin: 0; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--color-border); background: var(--color-bg-input); color: var(--color-text-primary); }
        .btn.primary { background: var(--color-betika-yellow, #F2D641); color: #000; border-color: var(--color-betika-yellow, #F2D641); }
        .btn.ghost { background: transparent; color: var(--color-text-secondary); padding: 6px 10px; }
        .btn.ghost:hover { color: var(--color-betika-yellow, #F2D641); border-color: var(--color-betika-yellow, #F2D641); }
        .btn.danger:hover { color: #ff6b6b; border-color: #ff6b6b; }
        .btn.primary-ghost { color: var(--color-betika-yellow, #F2D641); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn:disabled:hover { color: var(--color-text-secondary); border-color: var(--color-border); }

        .seg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .seg-card { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .seg-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .seg-titles { display: flex; flex-direction: column; gap: 4px; }
        .seg-name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
        .badge { font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); border: 1px solid var(--color-border); border-radius: 10px; padding: 1px 7px; width: fit-content; }
        .seg-count { font-size: 26px; font-weight: 700; color: var(--color-text-primary); }
        .seg-desc { font-size: 12px; color: var(--color-text-secondary); margin: 0; }
        .seg-rule { font-size: 11px; color: var(--color-text-muted); display: flex; align-items: center; gap: 5px; background: var(--color-bg-input); padding: 6px 9px; border-radius: 6px; }
        .seg-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--color-text-muted); }
        .seg-meta span { display: inline-flex; align-items: center; gap: 4px; }
        .seg-actions { display: flex; gap: 8px; margin-top: auto; }

        @media (max-width: 1000px) { .seg-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .seg-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
