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
        <div className="manual-award-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manual Award</h1>
                    <p className="page-subtitle">Target specificity segments or upload lists to grant bonuses.</p>
                </div>
            </div>

            <div className="grid-layout">
                {/* LEFT COLUMN: Selection Method */}
                <div className="selection-panel">
                    <div className="tabs">
                        <button
                            className={`tab-btn ${activeTab === 'segment' ? 'active' : ''}`}
                            onClick={() => setActiveTab('segment')}
                        >
                            <Users size={18} /> Select Segment
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
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
                                <button className="btn-create-seg ds-add-action">
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
                                        <FileText size={32} color="#4ade80" />
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
                            className="btn-award"
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
                                    <div className={`p-status ds-status ${p.status === 'active' ? 'ds-status--active' : 'ds-status--default'}`}>{p.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
.manual-award-container {
max-width: 1200px;
 margin: 0 auto;
 padding: 24px;
 color: var(--color-text-primary);
 }
        .page-header { margin-bottom: 32px; }
        .page-title { font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: var(--color-text-primary); }
        .page-subtitle { color: var(--color-text-secondary); margin: 0; font-size: 14px; }

        .grid-layout { 
            display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; 
            align-items: start;
        }

        /* Tabs */
        .tabs { display: flex; gap: 12px; margin-bottom: 16px; }
        .tab-btn {
            background: transparent; border: none; color: var(--color-text-secondary);
            font-size: 14px; font-weight: 600; cursor: pointer;
            display: flex; align-items: center; gap: 8px;
            padding: 8px 16px; border-radius: 8px;
            transition: all 0.2s;
        }
        .tab-btn.active { background: var(--color-bg-input); color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
        .tab-btn:hover { color: var(--color-text-primary); }

        /* Selection Panel */
        .selection-panel .panel-content { min-height: 400px; padding: 20px; }
        
.search-box {
display: flex; align-items: center; gap: 8px;
margin-bottom: 16px;
}
        .search-box input { background: transparent; border: none; color: var(--color-text-primary); font-size: 13px; width: 100%; outline: none; }
        .text-secondary { color: var(--color-text-muted); }

.segment-item {
padding: 12px;
margin-bottom: 8px; cursor: pointer;
display: flex; gap: 10px; align-items: center;
}
.segment-item .seg-info { flex: 1; }

.selection-radio {
position: relative;
width: 16px;
height: 16px;
flex-shrink: 0;
border: 1px solid rgba(255, 255, 255, 0.35);
border-radius: 50%;
}
.selection-radio.is-selected {
border: 2px solid #008e00;
}
.selection-radio.is-selected::after {
content: '';
position: absolute;
top: 50%;
left: 50%;
width: 8px;
height: 8px;
border-radius: 50%;
background: #008e00;
transform: translate(-50%, -50%);
}

        .seg-name { font-weight: 600; font-size: 13px; display: block; margin-bottom: 2px; color: var(--color-text-primary); }
        .seg-criteria { font-size: 11px; color: var(--color-text-muted); font-family: monospace; }
        .seg-count { font-size: 12px; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px; }

.btn-create-seg {
width: 100%; padding: 12px; margin-top: 16px;
cursor: pointer; font-size: 13px;
}

        /* Uplpad Area */
.upload-area {
height: 360px; display: flex; flex-direction: column;
align-items: center; justify-content: center;
margin-top: 20px;
}
        .upload-icon { margin-bottom: 16px; opacity: 0.5; color: var(--color-text-muted); }
        .upload-area h3 { color: var(--color-text-primary); margin: 0 0 4px 0; font-size: 16px; }
        .helper-text { font-size: 11px; margin-top: 12px; opacity: 0.6; }

        .file-preview { text-align: center; }
        .file-name { color: var(--color-text-primary); font-weight: 600; margin: 8px 0 2px 0; }
        .btn-remove { background: transparent; border: none; color: #f87171; cursor: pointer; margin-top: 12px; }

        /* Config Panel */
        .config-panel { display: flex; flex-direction: column; gap: 24px; }
        .form-panel { padding: 24px; }
        .form-panel h3 { margin: 0 0 20px 0; font-size: 16px; font-weight: 600; }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 8px; letter-spacing: 0.5px; }

        .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.type-card {
position: relative;
min-height: 107px;
padding: 16px;
cursor: pointer;
display: flex;
flex-direction: column;
align-items: flex-start;
gap: 6px;
color: var(--color-text-secondary);
text-align: left;
}
.type-card.is-selected { color: var(--ds-accent); }
        .type-card span { font-size: 12px; font-weight: 600; }

.amount-input {
display: flex; align-items: center;
padding: 0 12px;
}
        .amount-input input {
          background: transparent; border: none; padding: 12px;
          color: var(--color-text-primary); flex: 1; font-size: 16px; outline: none;
        }

        /* Date fields (freebet / freespins expiry) */
        .date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .date-field { display: flex; flex-direction: column; gap: 6px; }
        .date-label {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
          color: var(--color-text-muted);
        }
.date-field input {
width: 100%;
font-size: 13px;
color-scheme: dark;
}

.summary-box {
padding: 12px;
margin-bottom: 20px;
}
        .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
        .val { font-weight: 600; }
        .text-yellow { color: #F2D641; }

        .btn-award {
            width: 100%; padding: 14px; border: none; border-radius: 8px;
            background: var(--color-betika-yellow); color: #000;
            font-weight: 700; font-size: 14px; cursor: pointer;
            transition: all 0.2s;
        }
        .btn-award:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }
        .btn-award:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.9; }

.success-banner {
margin-top: 16px;
background: rgba(71, 170, 57, 0.16);
color: #f5f5f5;
}
.success-banner :global(.ds-notice__icon) {
background: var(--ds-success);
color: #fff;
}

        /* Preview Panel */
        .preview-panel { padding: 0; }
 .preview-panel .panel-header {
 padding: 16px 20px; border-bottom: 1px solid var(--color-border);
 display: flex; justify-content: space-between; align-items: center;
 }
 .preview-panel h3 { margin: 0; font-size: 14px; font-weight: 600; }
 .badge { font-size: 10px; background: var(--color-bg-input); padding: 2px 6px; border-radius: 4px; }

        .player-list { padding: 10px; }
        .player-row {
            display: flex; align-items: center; gap: 10px;
 padding: 8px 10px; border-radius: 6px;
 border-bottom: 1px solid var(--color-border);
 }
        .p-avatar {
            width: 28px; height: 28px; border-radius: 50%;
            background: var(--color-bg-input); display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 700; color: var(--color-text-muted);
            border: 1px solid var(--color-border);
        }
        .p-info { flex: 1; }
        .p-name { font-size: 12px; font-weight: 600; color: var(--color-text-primary); }
        .p-id { font-size: 10px; color: var(--color-text-secondary); }
.p-status { text-transform: uppercase; }
      `}</style>
        </div>
    );
}
