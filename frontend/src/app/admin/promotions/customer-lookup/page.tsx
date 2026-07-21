'use client';
import { useState } from 'react';
import { Search, UserSearch, Phone, ShieldCheck, ShieldAlert, ShieldQuestion, Info } from 'lucide-react';
import { findCustomer, OUTCOME_META, type CustomerRecord } from '@/data/customerLookup';
import { can } from '@/lib/permissions';

export default function CustomerLookupPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CustomerRecord | null>(null);
  const [searched, setSearched] = useState(false);

  const allowed = can('customer.lookup');

  const runSearch = () => {
    setResult(findCustomer(query));
    setSearched(true);
  };

  if (!allowed) {
    return (
      <div className="denied">
        <ShieldAlert size={40} />
        <h2>Access Restricted</h2>
        <p>Your role does not have the <b>customer.lookup</b> permission.</p>
      </div>
    );
  }

  const kycIcon = (k: CustomerRecord['kycStatus']) =>
    k === 'verified' ? <ShieldCheck size={14} /> : k === 'flagged' ? <ShieldAlert size={14} /> : <ShieldQuestion size={14} />;

  return (
    <div className="lookup">
      <div className="head">
        <h1><UserSearch size={22} /> Customer Lookup</h1>
        <p className="sub">Support-scoped search by phone number or customer ID. Shows the promotion status and outcomes for a given customer only — no financial actions.</p>
      </div>

      <div className="searchbar">
        <Search size={16} />
        <input
          placeholder="Enter phone (e.g. +254712345678 / 0712345678) or ID (e.g. CUS-100482)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        <button onClick={runSearch} disabled={!query.trim()}>Search</button>
      </div>
      <p className="hint"><Info size={12} /> Demo IDs: CUS-100482, CUS-205913, CUS-330271</p>

      {searched && !result && (
        <div className="empty">No customer found for &ldquo;{query}&rdquo;. Check the phone number or ID and try again.</div>
      )}

      {result && (
        <div className="card">
          <div className="profile">
            <div className="avatar">{result.name.split(' ').map((n) => n[0]).join('')}</div>
            <div className="pinfo">
              <h2>{result.name}</h2>
              <div className="meta">
                <span className="mono">{result.id}</span>
                <span><Phone size={12} /> {result.phone}</span>
                <span className="market">{result.market}</span>
                <span className="tier">{result.tier}</span>
                <span className={`kyc ${result.kycStatus}`}>{kycIcon(result.kycStatus)} {result.kycStatus}</span>
              </div>
              <div className="joined">Member since {result.joinedAt}</div>
            </div>
          </div>

          <h3 className="section">Promotion History ({result.promotions.length})</h3>
          <div className="promos">
            {result.promotions.map((p) => {
              const meta = OUTCOME_META[p.outcome];
              return (
                <div key={p.promotionId + p.enrolledAt} className="promo">
                  <div className="prow1">
                    <b>{p.promotionName}</b>
                    <span className={`outcome ${meta.tone}`}>{meta.label}</span>
                  </div>
                  <div className="prow2">
                    <span className="mono">{p.promotionId}</span>
                    <span className="dot">·</span>
                    <span>{p.market}</span>
                    <span className="dot">·</span>
                    <span>Status: {p.status.replace('_', ' ')}</span>
                    <span className="dot">·</span>
                    <span>Enrolled {p.enrolledAt}</span>
                  </div>
                  {p.progressLabel && <div className="progress">{p.progressLabel}</div>}
                  {p.rewardValue && <div className="reward">Reward: {p.rewardValue}</div>}
                  {p.note && <div className="note">{p.note}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .lookup { max-width: 820px; margin: 0 auto; padding-bottom: 40px; }
        .head h1 { display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: 700; margin: 0; color: var(--color-text-primary); }
        .sub { color: var(--color-text-muted); font-size: 13px; margin: 6px 0 20px; line-height: 1.5; }
        .searchbar { display: flex; align-items: center; gap: 8px; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 10px; padding: 8px 8px 8px 12px; color: var(--color-text-muted); }
        .searchbar input { flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: var(--color-text-primary); }
        .searchbar button { background: var(--color-betika-yellow); color: #000; border: none; border-radius: 7px; padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .searchbar button:disabled { opacity: .5; cursor: not-allowed; }
        .hint { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--color-text-muted); margin: 8px 0 20px; }
        .empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 13px; background: var(--color-bg-surface); border: 1px dashed var(--color-border); border-radius: 12px; }
        .card { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 14px; padding: 22px; }
        .profile { display: flex; gap: 16px; align-items: center; padding-bottom: 18px; border-bottom: 1px solid var(--color-border); }
        .avatar { width: 54px; height: 54px; border-radius: 50%; background: var(--color-betika-green); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; flex-shrink: 0; }
        .pinfo h2 { margin: 0; font-size: 19px; color: var(--color-text-primary); }
        .meta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 6px; font-size: 12px; color: var(--color-text-muted); }
        .meta span { display: inline-flex; align-items: center; gap: 4px; }
        .mono { font-family: monospace; }
        .market, .tier { background: var(--color-bg-hover); padding: 1px 8px; border-radius: 10px; }
        .kyc { text-transform: capitalize; padding: 1px 8px; border-radius: 10px; }
        .kyc.verified { color: var(--color-betika-green); background: rgba(105,153,81,.15); }
        .kyc.pending { color: #d97706; background: rgba(250,204,21,.15); }
        .kyc.flagged { color: #f87171; background: rgba(248,113,113,.15); }
        .joined { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; }
        .section { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-secondary); margin: 18px 0 12px; }
        .promos { display: flex; flex-direction: column; gap: 12px; }
        .promo { background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 10px; padding: 12px 14px; }
        .prow1 { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .prow1 b { font-size: 14px; color: var(--color-text-primary); }
        .outcome { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 12px; white-space: nowrap; }
        .outcome.success { color: var(--color-betika-green); background: rgba(105,153,81,.15); }
        .outcome.info { color: #38bdf8; background: rgba(56,189,248,.15); }
        .outcome.warning { color: #d97706; background: rgba(250,204,21,.15); }
        .outcome.error { color: #f87171; background: rgba(248,113,113,.15); }
        .prow2 { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 6px; font-size: 11px; color: var(--color-text-muted); }
        .dot { opacity: .5; }
        .progress { margin-top: 8px; font-size: 12px; color: #38bdf8; }
        .reward { margin-top: 4px; font-size: 12px; color: var(--color-betika-green); font-weight: 600; }
        .note { margin-top: 6px; font-size: 12px; color: var(--color-text-secondary); font-style: italic; }
        .denied { max-width: 460px; margin: 80px auto; text-align: center; color: var(--color-text-muted); }
        .denied h2 { color: var(--color-text-primary); margin: 12px 0 6px; }
      `}</style>
    </div>
  );
}
