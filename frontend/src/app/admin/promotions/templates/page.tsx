'use client';
import Link from 'next/link';
import { useState } from 'react';
import { LayoutTemplate, Trash2, Rocket, ArrowLeft } from 'lucide-react';
import { useTemplates } from '@/context/TemplatesContext';

export default function TemplatesPage() {
  const { templates, deleteTemplate } = useTemplates();
  const [busy, setBusy] = useState(false);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link href="/admin/promotions" className="back-link"><ArrowLeft size={14} /> Promotions</Link>
          <h1 className="page-title">Saved Templates</h1>
          <p className="page-subtitle">Re-launch a saved promotion configuration and tweak it in the wizard.</p>
        </div>
        <Link href="/admin/promotions/create" className="btn btn-primary">New Promotion</Link>
      </div>

      {templates.length === 0 ? (
        <div className="glass-panel empty">
          <LayoutTemplate size={36} />
          <p className="empty-title">No saved templates yet</p>
          <p className="empty-sub">Configure a promotion in the wizard and choose "Save as template" to reuse it later.</p>
          <Link href="/admin/promotions/create" className="btn btn-secondary">Create a promotion</Link>
        </div>
      ) : (
        <div className="tpl-grid">
          {templates.map((tpl) => (
            <div key={tpl.id} className="glass-panel tpl-card">
              <div className="tpl-top">
                <LayoutTemplate size={18} className="tpl-icon" />
                <div className="tpl-info">
                  <span className="tpl-name">{tpl.name}</span>
                  <span className="tpl-meta">
                    {tpl.basedOnType?.replace(/_/g, ' ')}{tpl.market ? ` · ${tpl.market}` : ''}
                  </span>
                </div>
              </div>
              {tpl.description && <p className="tpl-desc">{tpl.description}</p>}
              <span className="tpl-date">Updated {new Date(tpl.updatedAt).toLocaleDateString()}</span>
              <div className="tpl-actions">
                <Link
                  href={`/admin/promotions/create?template=${tpl.id}`}
                  className="btn btn-primary btn-sm"
                  onClick={() => setBusy(true)}
                >
                  <Rocket size={14} /> Launch
                </Link>
                <button
                  className="btn btn-secondary btn-sm danger"
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

      <style jsx>{`
        .page-container { max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 16px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-muted); text-decoration: none; margin-bottom: 8px; }
        .back-link:hover { color: var(--color-text-primary); }
        .page-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0; }
        .page-subtitle { font-size: 14px; color: var(--color-text-secondary); margin: 0; }

        .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 24px; text-align: center; color: var(--color-text-muted); }
        .empty-title { margin: 8px 0 0 0; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
        .empty-sub { margin: 0 0 8px 0; font-size: 13px; color: var(--color-text-secondary); max-width: 420px; }

        .tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .tpl-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .tpl-top { display: flex; align-items: center; gap: 12px; }
        .tpl-icon { color: var(--color-betika-yellow); flex-shrink: 0; }
        .tpl-info { display: flex; flex-direction: column; min-width: 0; }
        .tpl-name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
        .tpl-meta { font-size: 12px; text-transform: capitalize; color: var(--color-text-muted); }
        .tpl-desc { font-size: 13px; color: var(--color-text-secondary); margin: 0; line-height: 1.4; }
        .tpl-date { font-size: 11px; color: var(--color-text-muted); }
        .tpl-actions { display: flex; gap: 8px; margin-top: 6px; }
        .btn-sm { padding: 8px 14px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
        .danger { color: #f87171; }
        .danger:hover { background: rgba(248,113,113,0.1); }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
