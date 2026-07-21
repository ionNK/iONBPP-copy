import { useState, useEffect } from 'react';
import { Play, Activity, CheckCircle, AlertTriangle, Zap, RotateCcw } from 'lucide-react';

const SCENARIOS = [
    {
        label: 'Winning Accumulator',
        eventId: 'bet_placed',
        payload: {
            betId: 'TICKET-999',
            stake: 1000,
            country: 'KE',
            totalOdds: 15.5,
            potentialWin: 15500,
            isLive: false,
            selections: [
                { selectionId: 's1', sport: 'Football', league: 'EPL', market: '1x2', odds: 1.5, outcome: 'Home' },
                { selectionId: 's2', sport: 'Football', league: 'La Liga', market: 'Over 2.5', odds: 2.1, outcome: 'Over' },
                { selectionId: 's3', sport: 'Tennis', league: 'ATP', market: 'Winner', odds: 4.9, outcome: 'Player 1' }
            ]
        }
    },
    {
        label: 'Big Win Settlement',
        eventId: 'bet_settled',
        payload: {
            ticketId: 'ticket-888',
            status: 'Won',
            payout: 50000
        }
    },
    {
        label: 'First Deposit',
        eventId: 'deposit',
        payload: {
            amount: 500,
            country: 'KE',
            method: 'Mpesa'
        }
    }
];

export default function SimulatorTab() {
    // State
    const [catalog, setCatalog] = useState<any>({});
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [playerId, setPlayerId] = useState('user-123');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            await fetchSchema();
            await fetchLogs();
        };
        init();

        const interval = setInterval(fetchLogs, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchSchema = async () => {
        try {
            const res = await fetch('http://localhost:4000/events/schema');
            if (res.ok) {
                const data = await res.json();
                setCatalog(data);
                // Set default selections
                const firstCat = Object.keys(data)[0];
                if (firstCat) {
                    setSelectedCategory(firstCat);
                    setSelectedEventId(data[firstCat].events[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch schema:', err);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch('http://localhost:4000/events/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    };

    // Derived
    const currentCategory = catalog[selectedCategory];
    const currentEvent = currentCategory?.events.find((e: any) => e.id === selectedEventId);

    // Reset Form on Event Change
    useEffect(() => {
        if (currentEvent) {
            const defaults: Record<string, any> = {};
            currentEvent.params.forEach((p: any) => {
                if (p.type === 'array') defaults[p.name] = [];
                else if (p.type === 'boolean') defaults[p.name] = false;
                else defaults[p.name] = '';
            });
            setFormData(defaults);
        }
    }, [selectedEventId, catalog]);

    // Handlers
    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const loadScenario = (scenario: typeof SCENARIOS[0]) => {
        let catKey = 'sports';
        for (const [key, cat] of Object.entries(catalog) as any) {
            if (cat.events.some((e: any) => e.id === scenario.eventId)) {
                catKey = key;
                break;
            }
        }

        setSelectedCategory(catKey);
        setSelectedEventId(scenario.eventId);

        setTimeout(() => {
            setFormData(scenario.payload);
        }, 50);
    };

    const handleArrayPush = (field: string, itemSchema: any[]) => {
        const currentArr = formData[field] || [];
        const newItem: any = {};
        itemSchema.forEach(p => newItem[p.name] = '');
        setFormData(prev => ({ ...prev, [field]: [...currentArr, newItem] }));
    };

    const handleArrayItemChange = (field: string, index: number, itemField: string, value: any) => {
        const newArr = [...(formData[field] || [])];
        newArr[index] = { ...newArr[index], [itemField]: value };
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const handleArrayRemove = (field: string, index: number) => {
        const newArr = [...(formData[field] || [])];
        newArr.splice(index, 1);
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const handleSimulate = async () => {
        setLoading(true);
        const payload: any = {
            eventType: selectedEventId,
            playerId,
            timestamp: new Date().toISOString(),
            ...formData
        };

        currentEvent?.params.forEach((p: any) => {
            if ((p.type === 'float' || p.type === 'integer') && payload[p.name]) {
                payload[p.name] = Number(payload[p.name]);
            }
            if (p.type === 'array' && Array.isArray(payload[p.name])) {
                payload[p.name] = payload[p.name].map((item: any) => {
                    const newItem = { ...item };
                    p.itemSchema.forEach((schemaP: any) => {
                        if ((schemaP.type === 'float' || schemaP.type === 'integer') && newItem[schemaP.name]) {
                            newItem[schemaP.name] = Number(newItem[schemaP.name]);
                        }
                    });
                    return newItem;
                });
            }
        });

        try {
            await fetch('http://localhost:4000/events/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tab-pane">
            <div className="header">
                <div>
                    <h3>Event Simulator</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>Trigger complex mock user events to test promotion rules.</p>
                </div>
            </div>

            <div className="content-grid-tab">
                {/* Configuration Panel */}
                <div className="panel-inner config-panel">
                    <h4 className="panel-title-sm"><Activity size={16} /> Event Configuration</h4>

                    {/* Scenario Quick Picks */}
                    <div className="scenarios-list">
                        {SCENARIOS.map((s, idx) => (
                            <button key={idx} className="btn-scenario" onClick={() => loadScenario(s)}>
                                <Zap size={14} className={idx % 2 === 0 ? 'text-yellow' : 'text-purple'} />
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="divider"></div>

                    {/* Category Selector */}
                    <div className="category-tabs">
                        {Object.entries(catalog).map(([key, cat]: [string, any]) => (
                            <button
                                key={key}
                                className={`cat-tab ${selectedCategory === key ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(key)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Event Type Selector */}
                    <div className="form-group">
                        <label>Event Type</label>
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                        >
                            {currentCategory?.events.map((ev: any) => (
                                <option key={ev.id} value={ev.id}>{ev.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Player ID (Global) */}
                    <div className="form-group">
                        <label>Player ID</label>
                        <input type="text" value={playerId} onChange={(e) => setPlayerId(e.target.value)} />
                    </div>

                    {/* Dynamic Params */}
                    <div className="dynamic-params">
                        <h4>Event Parameters</h4>
                        {currentEvent?.params.map((param: any) => (
                            <div key={param.name} className="form-group-wrapper">
                                {param.type === 'array' ? (
                                    <div className="array-field-group">
                                        <div className="array-header">
                                            <label>{param.name}</label>
                                            <button
                                                className="btn-add-item"
                                                onClick={() => handleArrayPush(param.name, param.itemSchema)}
                                            >
                                                + Add Item
                                            </button>
                                        </div>
                                        <div className="array-items">
                                            {(formData[param.name] || []).map((item: any, idx: number) => (
                                                <div key={idx} className="array-item-card">
                                                    <div className="item-header">
                                                        <span>Item #{idx + 1}</span>
                                                        <button className="btn-remove" onClick={() => handleArrayRemove(param.name, idx)}>×</button>
                                                    </div>
                                                    <div className="item-fields-grid">
                                                        {param.itemSchema.map((subParam: any) => (
                                                            <div key={subParam.name} className="sub-field">
                                                                <label>{subParam.name}</label>
                                                                {subParam.options ? (
                                                                    <select
                                                                        value={item[subParam.name] || ''}
                                                                        onChange={(e) => handleArrayItemChange(param.name, idx, subParam.name, e.target.value)}
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {subParam.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        type={subParam.type === 'float' ? 'number' : 'text'}
                                                                        value={item[subParam.name] || ''}
                                                                        onChange={(e) => handleArrayItemChange(param.name, idx, subParam.name, e.target.value)}
                                                                        placeholder={subParam.name}
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label>{param.name}</label>
                                        {param.options ? (
                                            <select
                                                value={formData[param.name] || ''}
                                                onChange={(e) => handleInputChange(param.name, e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {param.options.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : param.type === 'boolean' ? (
                                            <select
                                                value={String(formData[param.name])}
                                                onChange={(e) => handleInputChange(param.name, e.target.value === 'true')}
                                            >
                                                <option value="false">No</option>
                                                <option value="true">Yes</option>
                                            </select>
                                        ) : (
                                            <input
                                                type={param.type === 'float' || param.type === 'integer' ? 'number' : 'text'}
                                                value={formData[param.name] || ''}
                                                onChange={(e) => handleInputChange(param.name, e.target.value)}
                                                step={param.type === 'float' ? '0.01' : '1'}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleSimulate}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : <><Play size={16} /> Simulate Event</>}
                    </button>
                </div>

                {/* Logs Panel */}
                <div className="panel-inner logs-panel">
                    <h4 className="panel-title-sm">Execution Logs</h4>
                    <div className="logs-container">
                        {logs.length === 0 ? (
                            <div className="empty-state">No events found in database.</div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className={`log-item ${log.processed ? 'success' : 'pending'}`}>
                                    <div className="log-header">
                                        <span className={`status-dot ${log.processed ? 'success' : 'pending'}`}></span>
                                        <span className="timestamp">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                        <span className="status-text">{log.type}</span>
                                        {log.processed && <span className="badge-processed">Processed</span>}
                                    </div>
                                    <div className="log-details">
                                        <div className="payload">
                                            <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .header { margin-bottom: 24px; }
                
                .content-grid-tab {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 20px;
                    align-items: start;
                }

                .panel-inner {
                    background: var(--color-bg-panel);
                    border: 1px solid var(--color-border);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: var(--shadow-sm);
                }
                .panel-title-sm { margin: 0 0 16px 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; color: var(--color-text-primary); }

                /* Scenarios */
                .scenarios-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
                .btn-scenario { 
                    background: var(--color-bg-input); border: 1px solid var(--color-border); 
                    border-radius: 6px; padding: 6px 12px; font-size: 11px; color: var(--color-text-secondary); 
                    cursor: pointer; display: flex; align-items: center; gap: 6px; 
                }
                .btn-scenario:hover { background: var(--color-bg-app); border-color: var(--color-border-hover); color: var(--color-text-primary); }
                .text-yellow { color: #facc15; }
                .text-purple { color: #c084fc; }

                .divider { height: 1px; background: var(--color-border); margin: 20px 0; }

                /* Category Tabs */
                .category-tabs { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); }
                .cat-tab { 
                    background: transparent; border: none; color: var(--color-text-secondary); padding: 6px 12px; 
                    font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; 
                    border-bottom: 2px solid transparent; 
                }
                .cat-tab.active { color: var(--color-betika-yellow); border-bottom-color: var(--color-betika-yellow); }

                /* Form */
                .form-group { margin-bottom: 12px; }
                .form-group label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; }
                .form-group input, .form-group select {
                    width: 100%;
                    background: var(--color-bg-input);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-primary);
                    padding: 8px;
                    border-radius: 6px;
                    outline: none;
                    transition: border-color 0.2s;
                    font-size: 12px;
                }
                .form-group input:focus, .form-group select:focus {
                    border-color: var(--color-betika-yellow);
                    background: var(--color-bg-panel);
                }

                /* Array Fields */
                .array-field-group { margin-bottom: 20px; }
                .array-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .btn-add-item { background: var(--color-bg-input); border: 1px solid var(--color-border); color: var(--color-betika-yellow); font-size: 11px; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
                
                .array-items { display: flex; flex-direction: column; gap: 6px; }
                .array-item-card { background: var(--color-bg-app); border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; }
                .item-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600; }
                .btn-remove { background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 16px; }
                
                .item-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .sub-field input, .sub-field select { width: 100%; background: var(--color-bg-input); border: 1px solid var(--color-border); color: var(--color-text-primary); padding: 6px; border-radius: 4px; font-size: 11px; }

                .dynamic-params { background: var(--color-bg-app); padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--color-border); }
                .dynamic-params h4 { margin: 0 0 12px 0; font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }

                .btn-primary {
                    width: 100%;
                    background: var(--color-betika-yellow);
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    padding: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                }
                .btn-primary:active { transform: scale(0.98); }
                .btn-primary:hover { opacity: 0.9; box-shadow: var(--shadow-md); }
                .btn-primary:disabled { opacity: 0.5; cursor: wait; }

                .logs-container { max-height: 500px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
                .empty-state { color: var(--color-text-muted); font-style: italic; text-align: center; padding: 30px; font-size: 13px; }

                .log-item {
                    background: var(--color-bg-panel);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    padding: 12px;
                    font-family: inherit;
                    font-size: 12px;
                }
                .log-item.success { border-left: 4px solid #4ade80; }
                .log-item.pending { border-left: 4px solid #facc15; }

                .log-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; }
                .status-dot.success { background: #4ade80; }
                .status-dot.pending { background: #facc15; }
                .timestamp { color: var(--color-text-muted); font-size: 11px; }
                .status-text { color: var(--color-text-primary); font-weight: 700; }
                .badge-processed { 
                    font-size: 9px; background: rgba(74, 222, 128, 0.1); color: #22c55e; 
                    padding: 2px 6px; border-radius: 4px; margin-left: auto; font-weight: 700;
                }

                .log-details pre { margin: 0; background: var(--color-bg-input); padding: 12px; border-radius: 6px; overflow-x: auto; color: var(--color-text-secondary); font-size: 11px; border: 1px solid var(--color-border); }
            `}</style>
        </div>
    );
}
