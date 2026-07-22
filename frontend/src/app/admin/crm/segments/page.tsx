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
<div className="crm-segments-page ds-page-shell">
<div className="crm-segments-page__header">
<div>
<h1 className="crm-segments-page__title">Segments</h1>
<p className="crm-segments-page__subtitle">Dynamic cohorts computed live from synced platform activity. · {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'All markets'}</p>
</div>
<button className="crm-segments-page__button crm-segments-page__button--primary" onClick={() => setEditing(newSegmentDraft())}><Plus size={16} /> New segment</button>
</div>

<div className="crm-segments-page__grid">
        {cards.map(({ seg, members }) => {
          const ltv = members.reduce((sum, p) => sum + p.ltv, 0);
          return (
<div key={seg.id} className="crm-segments-page__card glass-panel">
<div className="crm-segments-page__card-top">
<div className="crm-segments-page__titles">
<span className="crm-segments-page__name">{seg.name}</span>
{seg.preset && <span className="crm-segments-page__badge">Preset</span>}
</div>
<span className="crm-segments-page__count">{members.length}</span>
</div>
{seg.description && <p className="crm-segments-page__description">{seg.description}</p>}
<div className="crm-segments-page__rule"><Filter size={12} /> {ruleSummary(seg) || 'No rules'}</div>
<div className="crm-segments-page__meta">
<span><Users size={13} /> {members.length} players</span>
<span>LTV {ltv.toLocaleString()}</span>
</div>
<div className="crm-segments-page__actions">
<button className="crm-segments-page__button crm-segments-page__button--ghost" onClick={() => setEditing(seg)}><Pencil size={13} /> Edit</button>
{!seg.preset && <button className="crm-segments-page__button crm-segments-page__button--ghost crm-segments-page__button--danger" onClick={() => remove(seg.id)}><Trash2 size={13} /></button>}
<button className="crm-segments-page__button crm-segments-page__button--ghost crm-segments-page__button--target" onClick={() => target(seg, members.length)} disabled={members.length === 0}><Zap size={13} /> Target</button>
</div>
                </div>
                );

        })}
      </div>

      {editing && <SegmentBuilder initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </div>
  );
}
