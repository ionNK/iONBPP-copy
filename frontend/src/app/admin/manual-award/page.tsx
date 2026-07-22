'use client';

import { useState } from 'react';
import {
  Users, UploadCloud, Search, CheckCircle2, XCircle,
  Gift, FileText, Banknote, Sparkles, Calendar
} from 'lucide-react';
// --- Types ---
interface Segment {
    id: string;
    name: string;
    count: number;
    criteria: string;
}

interface Player {
    id: string;
    username: string;
    status: 'active' | 'suspended';
    lastActive: string;
    selected?: boolean;
}

// --- Mock Data ---
const PRESET_SEGMENTS: Segment[] = [
    { id: 'seg_001', name: 'VIP High Rollers (Kenya)', count: 450, criteria: 'Dep > 5000 & Market = KE' },
    { id: 'seg_002', name: 'Churned Users (Last 30d)', count: 1250, criteria: 'Inactive > 30d' },
    { id: 'seg_003', name: 'New Registrations (Today)', count: 320, criteria: 'Reg Date = Today' },
];

const MOCK_PLAYERS: Player[] = [
    { id: 'PL-8821', username: 'Kofi_G.', status: 'active', lastActive: '2 mins ago' },
    { id: 'PL-9932', username: 'Sarah_K.', status: 'active', lastActive: '1 hr ago' },
    { id: 'PL-7741', username: 'David_O.', status: 'suspended', lastActive: '4 days ago' },
    { id: 'PL-3321', username: 'Emeka_J.', status: 'active', lastActive: '5 mins ago' },
    { id: 'PL-1102', username: 'Amina_S.', status: 'active', lastActive: 'Today' },
];

export default function ManualAwardPage() {
  const [activeTab, setActiveTab] = useState<'segment' | 'csv'>('segment');
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);
  const [awardType, setAwardType] = useState('cash');
  const [amount, setAmount] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const needsExpiry = awardType === 'freebet' || awardType === 'freespins';

    const handleAward = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setSuccessMsg(`Successfully queued ${selectedSegment ? 'segment' : 'CSV list'} for processing!`);
            setTimeout(() => setSuccessMsg(''), 5000);
        }, 1500);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setCsvFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="manual-award-container ds-page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manual Award</h1>
                    <p className="page-subtitle">Target specificity segments or upload lists to grant bonuses.</p>
                </div>
            </div>

            <div className="grid-layout">
                {/* LEFT COLUMN: Selection Method */}
                <div className="selection-panel">
                    <div className="tabs" role="tablist" aria-label="Recipient selection method">
                        <button
className={`tab-btn ${activeTab === 'segment' ? 'active' : ''}`}
role="tab"
aria-selected={activeTab === 'segment'}
onClick={() => setActiveTab('segment')}
                        >
                            <Users size={18} /> Select Segment
                        </button>
                        <button
className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
role="tab"
aria-selected={activeTab === 'csv'}
onClick={() => setActiveTab('csv')}
                        >
                            <UploadCloud size={18} /> Upload CSV
                        </button>
                    </div>

                    <div className="panel-content manual-award-primary-panel ds-panel">
                        {activeTab === 'segment' ? (
                            <div className="segment-list">
                                <div className="search-box ds-control">
                                    <Search size={16} className="text-secondary" />
                                    <input type="text" placeholder="Search saved segments..." />
                                </div>
                                {PRESET_SEGMENTS.map(seg => (
                                    <div
                                        key={seg.id}
className={`segment-item ds-choice ${selectedSegment === seg.id ? 'is-selected' : ''}`}
onClick={() => setSelectedSegment(seg.id)}
>
<span className={`selection-radio ${selectedSegment === seg.id ? 'is-selected' : ''}`} aria-label={selectedSegment === seg.id ? 'Selected' : undefined} />
<div className="seg-info">
                                            <span className="seg-name">{seg.name}</span>
                                            <span className="seg-criteria">{seg.criteria}</span>
                                        </div>
                                        <div className="seg-count">
                                            <Users size={12} /> {seg.count}
                                        </div>
                                    </div>
                                ))}
                                <button className="btn-create-seg ds-add-action ds-action-button">
                                    + Create New Segment
                                </button>
                            </div>
                        ) : (
                            <div
                                className="upload-area ds-add-action"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleFileDrop}
                            >
                                {csvFile ? (
                                    <div className="file-preview">
                                        <FileText size={32} className="file-preview-icon" />
                                        <div className="file-info">
                                            <p className="file-name">{csvFile.name}</p>
                                            <p className="file-size">{(csvFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <button onClick={() => setCsvFile(null)} className="btn-remove">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud size={48} className="upload-icon" />
                                        <h3>Drag & Drop CSV File</h3>
                                        <p>or click to browse</p>
                                        <span className="helper-text">Expected format: player_id, amount (optional)</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Configuration */}
                <div className="config-panel">
                    <div className="manual-award-primary-panel ds-panel form-panel">
                        <h3>Award Configuration</h3>

              <div className="form-group">
                <label>Award Type</label>
                <div className="type-grid">
                  <button
className={`type-card ds-choice ${awardType === 'cash' ? 'is-selected' : ''}`}
onClick={() => setAwardType('cash')}
>
<span className={`selection-radio ${awardType === 'cash' ? 'is-selected' : ''}`} aria-label={awardType === 'cash' ? 'Selected' : undefined} />
<Banknote size={24} />
                    <span>Cash</span>
                  </button>
                  <button
className={`type-card ds-choice ${awardType === 'bonus' ? 'is-selected' : ''}`}
onClick={() => setAwardType('bonus')}
>
<span className={`selection-radio ${awardType === 'bonus' ? 'is-selected' : ''}`} aria-label={awardType === 'bonus' ? 'Selected' : undefined} />
<Gift size={24} />
                    <span>Bonus</span>
                  </button>
                  <button
className={`type-card ds-choice ${awardType === 'freebet' ? 'is-selected' : ''}`}
onClick={() => setAwardType('freebet')}
>
<span className={`selection-radio ${awardType === 'freebet' ? 'is-selected' : ''}`} aria-label={awardType === 'freebet' ? 'Selected' : undefined} />
<FileText size={24} />
                    <span>Freebet</span>
                  </button>
                  <button
className={`type-card ds-choice ${awardType === 'freespins' ? 'is-selected' : ''}`}
onClick={() => setAwardType('freespins')}
>
<span className={`selection-radio ${awardType === 'freespins' ? 'is-selected' : ''}`} aria-label={awardType === 'freespins' ? 'Selected' : undefined} />
<Sparkles size={24} />
                    <span>Freespins</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>{awardType === 'freespins' ? 'Number of Spins' : 'Amount (€)'}</label>
                <div className="amount-input ds-control">
                  <span>{awardType === 'freespins' ? '×' : '€'}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              {needsExpiry && (
                <div className="form-group">
                  <label>Validity Period</label>
                  <div className="date-grid">
                    <div className="date-field">
                      <span className="date-label"><Calendar size={12} /> Start Date</span>
<input
className="ds-control"
type="date"
value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="date-field">
                      <span className="date-label"><Calendar size={12} /> End Date</span>
<input
className="ds-control"
type="date"
value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

                        <div className="summary-box ds-card">
                            <div className="row">
                                <span>Target:</span>
                                <span className="val">
                                    {activeTab === 'segment'
                                        ? (selectedSegment ? PRESET_SEGMENTS.find(s => s.id === selectedSegment)?.name : 'None Selected')
                                        : (csvFile ? csvFile.name : 'No File')
                                    }
                                </span>
                            </div>
                            <div className="row">
                                <span>Est. Cost:</span>
                                <span className="val text-yellow">
                                    {activeTab === 'segment' && selectedSegment
                                        ? `€${(PRESET_SEGMENTS.find(s => s.id === selectedSegment)?.count || 0) * amount}`
                                        : '---'
                                    }
                                </span>
                            </div>
                        </div>

                        <button
                            className="btn-award ds-action-button ds-action-button--primary ds-action-button--primary-lg ds-action-button--block"
                            disabled={(activeTab === 'segment' && !selectedSegment) || (activeTab === 'csv' && !csvFile) || isProcessing}
                            onClick={handleAward}
                        >
                            {isProcessing ? 'Processing...' : 'Confirm Award'}
                        </button>

                        {successMsg && (
<div className="success-banner ds-notice ds-notice--success">
<span className="ds-notice__icon"><CheckCircle2 /></span>
{successMsg}
</div>
                        )}
                    </div>

                    {/* Preview List (Mock) */}
                    <div className="manual-award-primary-panel ds-panel preview-panel">
                        <div className="panel-header">
                            <h3>Sample Recipients</h3>
                            <span className="badge">5 Random</span>
                        </div>
                        <div className="player-list">
                            {MOCK_PLAYERS.map(p => (
                                <div key={p.id} className="player-row">
                                    <div className="p-avatar">{p.username.charAt(0)}</div>
                                    <div className="p-info">
                                        <div className="p-name">{p.username}</div>
                                        <div className="p-id">{p.id}</div>
                                    </div>
                                    <div className={`p-status ds-status ${p.status === 'active' ? 'ds-status--active' : 'ds-status--danger'}`}>{p.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
