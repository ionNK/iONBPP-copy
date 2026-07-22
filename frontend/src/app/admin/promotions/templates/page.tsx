'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LayoutTemplate, Trash2, Rocket, ArrowLeft } from 'lucide-react';
import { useTemplates } from '@/context/TemplatesContext';

export default function TemplatesPage() {
 const { templates, deleteTemplate } = useTemplates();
 const [busy, setBusy] = useState(false);

 return (
 <div className="promotion-templates-page">
 <div className="promotion-templates-page__header">
 <div>
 <Link
 href="/admin/promotions"
 className="promotion-templates-page__back-link"
 >
 <ArrowLeft size={14} /> Promotions
 </Link>
 <h1 className="promotion-templates-page__title">Saved Templates</h1>
 <p className="promotion-templates-page__subtitle">
 Re-launch a saved promotion configuration and tweak it in the wizard.
 </p>
 </div>
 <Link href="/admin/promotions/create" className="btn btn-primary">
 New Promotion
 </Link>
 </div>

 {templates.length === 0 ? (
 <div className="glass-panel promotion-templates-page__empty">
 <LayoutTemplate size={36} />
 <p className="promotion-templates-page__empty-title">
 No saved templates yet
 </p>
 <p className="promotion-templates-page__empty-description">
 Configure a promotion in the wizard and choose &quot;Save as template&quot;
 to reuse it later.
 </p>
 <Link href="/admin/promotions/create" className="btn btn-secondary">
 Create a promotion
 </Link>
 </div>
 ) : (
 <div className="promotion-templates-page__grid">
 {templates.map((tpl) => (
 <div
 key={tpl.id}
 className="glass-panel promotion-templates-page__card"
 >
 <div className="promotion-templates-page__card-top">
 <LayoutTemplate
 size={18}
 className="promotion-templates-page__icon"
 />
 <div className="promotion-templates-page__info">
 <span className="promotion-templates-page__name">{tpl.name}</span>
 <span className="promotion-templates-page__meta">
 {tpl.basedOnType?.replace(/_/g, ' ')}
 {tpl.market ? ` · ${tpl.market}` : ''}
 </span>
 </div>
 </div>
 {tpl.description && (
 <p className="promotion-templates-page__description">
 {tpl.description}
 </p>
 )}
 <span className="promotion-templates-page__date">
 Updated {new Date(tpl.updatedAt).toLocaleDateString()}
 </span>
 <div className="promotion-templates-page__actions">
 <Link
 href={`/admin/promotions/create?template=${tpl.id}`}
 className="btn btn-primary promotion-templates-page__action"
 onClick={() => setBusy(true)}
 >
 <Rocket size={14} /> Launch
 </Link>
 <button
 className="btn btn-secondary promotion-templates-page__action promotion-templates-page__delete"
 disabled={busy}
 onClick={() => {
 if (confirm(`Delete template "${tpl.name}"?`)) deleteTemplate(tpl.id);
 }}
 >
 <Trash2 size={14} /> Delete
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}