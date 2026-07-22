'use client';

import { useState } from 'react';
import {
 Search,
 UserSearch,
 Phone,
 ShieldCheck,
 ShieldAlert,
 ShieldQuestion,
 Info,
} from 'lucide-react';
import {
 findCustomer,
 OUTCOME_META,
 type CustomerRecord,
} from '@/data/customerLookup';
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
 <div className="customer-lookup-denied">
 <ShieldAlert size={40} />
 <h2>Access Restricted</h2>
 <p>
 Your role does not have the <b>customer.lookup</b> permission.
 </p>
 </div>
 );
 }

 const kycIcon = (k: CustomerRecord['kycStatus']) =>
 k === 'verified' ? (
 <ShieldCheck size={14} />
 ) : k === 'flagged' ? (
 <ShieldAlert size={14} />
 ) : (
 <ShieldQuestion size={14} />
 );

 return (
 <div className="customer-lookup-page">
 <div className="customer-lookup-page__head">
 <h1 className="customer-lookup-page__title">
 <UserSearch size={22} /> Customer Lookup
 </h1>
 <p className="customer-lookup-page__subtitle">
 Support-scoped search by phone number or customer ID. Shows the promotion
 status and outcomes for a given customer only — no financial actions.
 </p>
 </div>

 <div className="customer-lookup-page__search">
 <Search size={16} />
 <input
 placeholder="Enter phone (e.g. +254712345678 / 0712345678) or ID (e.g. CUS-100482)"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && runSearch()}
 />
 <button onClick={runSearch} disabled={!query.trim()}>
 Search
 </button>
 </div>
 <p className="customer-lookup-page__hint">
 <Info size={12} /> Demo IDs: CUS-100482, CUS-205913, CUS-330271
 </p>

 {searched && !result && (
 <div className="customer-lookup-page__empty">
 No customer found for &ldquo;{query}&rdquo;. Check the phone number or ID
 and try again.
 </div>
 )}

 {result && (
 <div className="customer-lookup-page__card">
 <div className="customer-lookup-page__profile">
 <div className="customer-lookup-page__avatar">
 {result.name
 .split(' ')
 .map((n) => n[0])
 .join('')}
 </div>
 <div className="customer-lookup-page__profile-info">
 <h2>{result.name}</h2>
 <div className="customer-lookup-page__meta">
 <span className="customer-lookup-page__mono">{result.id}</span>
 <span>
 <Phone size={12} /> {result.phone}
 </span>
 <span className="customer-lookup-page__tag">{result.market}</span>
 <span className="customer-lookup-page__tag">{result.tier}</span>
 <span
 className={`customer-lookup-page__kyc ${result.kycStatus}`}
 >
 {kycIcon(result.kycStatus)} {result.kycStatus}
 </span>
 </div>
 <div className="customer-lookup-page__joined">
 Member since {result.joinedAt}
 </div>
 </div>
 </div>

 <h3 className="customer-lookup-page__section">
 Promotion History ({result.promotions.length})
 </h3>
 <div className="customer-lookup-page__promotions">
 {result.promotions.map((p) => {
 const meta = OUTCOME_META[p.outcome];
 return (
 <div
 key={p.promotionId + p.enrolledAt}
 className="customer-lookup-page__promotion"
 >
 <div className="customer-lookup-page__promotion-header">
 <b>{p.promotionName}</b>
 <span
 className={`customer-lookup-page__outcome ${meta.tone}`}
 >
 {meta.label}
 </span>
 </div>
 <div className="customer-lookup-page__promotion-meta">
 <span className="customer-lookup-page__mono">{p.promotionId}</span>
 <span className="customer-lookup-page__dot">·</span>
 <span>{p.market}</span>
 <span className="customer-lookup-page__dot">·</span>
 <span>Status: {p.status.replace('_', ' ')}</span>
 <span className="customer-lookup-page__dot">·</span>
 <span>Enrolled {p.enrolledAt}</span>
 </div>
 {p.progressLabel && (
 <div className="customer-lookup-page__progress">
 {p.progressLabel}
 </div>
 )}
 {p.rewardValue && (
 <div className="customer-lookup-page__reward">
 Reward: {p.rewardValue}
 </div>
 )}
 {p.note && <div className="customer-lookup-page__note">{p.note}</div>}
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 );
}