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
 <div className="tab-pane simulator-tab">
 <div className="header">
 <div>
 <h3>Event Simulator</h3>
 <p className="simulator-subtitle">Trigger complex mock user events to test promotion rules.</p>
                </div>
            </div>

            <div className="content-grid-tab">
                {/* Configuration Panel */}
                <div className="panel-inner config-panel ds-panel">
                    <h4 className="panel-title-sm"><Activity size={16} /> Event Configuration</h4>

                    {/* Scenario Quick Picks */}
                    <div className="scenarios-list">
                        {SCENARIOS.map((s, idx) => (
                            <button
 key={idx}
 className="btn-scenario ds-action-button ds-action-button--outline ds-action-button--outline-compact ds-action-button--outline-hover-neutral ds-action-button--surface ds-action-button--secondary"
 onClick={() => loadScenario(s)}
>
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
 className="ds-select"
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
                        <input className="ds-control" type="text" value={playerId} onChange={(e) => setPlayerId(e.target.value)} />
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
                                                className="btn-add-item ds-action-button ds-action-button--outline ds-action-button--outline-sm"
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
                                                        <button className="btn-remove ds-action-button ds-action-button--secondary" type="button" aria-label={`Remove item ${idx + 1}`} onClick={() => handleArrayRemove(param.name, idx)}>×</button>
                                                    </div>
                                                    <div className="item-fields-grid">
                                                        {param.itemSchema.map((subParam: any) => (
                                                            <div key={subParam.name} className="sub-field">
                                                                <label>{subParam.name}</label>
                                                                {subParam.options ? (
<select
 className="ds-select"
 value={item[subParam.name] || ''}
                                                                        onChange={(e) => handleArrayItemChange(param.name, idx, subParam.name, e.target.value)}
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {subParam.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                                                    </select>
                                                                ) : (
<input
 className="ds-control"
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
 className="ds-select"
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
 className="ds-select"
 value={String(formData[param.name])}
                                                onChange={(e) => handleInputChange(param.name, e.target.value === 'true')}
                                            >
                                                <option value="false">No</option>
                                                <option value="true">Yes</option>
                                            </select>
                                        ) : (
<input
 className="ds-control"
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
                        className="btn-primary ds-action-button ds-action-button--primary ds-action-button--primary-lg ds-action-button--block"
                        onClick={handleSimulate}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : <><Play size={16} /> Simulate Event</>}
                    </button>
                </div>

                {/* Logs Panel */}
                <div className="panel-inner logs-panel ds-panel">
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
        </div>
    );
}
