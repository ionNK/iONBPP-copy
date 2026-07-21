import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, Server, Database, Activity, Cpu } from 'lucide-react';

interface HealthStatus {
    status: 'ok' | 'error' | 'shutting_down';
    info: {
        promotion_db?: { status: string };
        kafka?: { status: string };
        [key: string]: any;
    };
    error?: any;
    details?: any;
}

export default function SystemStatusTab() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:4000/health');
            if (res.ok) {
                const data = await res.json();
                setHealth(data);
            } else {
                setHealth(null); // Backend down
            }
        } catch (err) {
            console.error(err);
            setHealth(null); // Network error / Backend down
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    };

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const StatusCard = ({ title, icon: Icon, status, details }: { title: string, icon: any, status: 'up' | 'down' | 'loading', details?: string }) => (
        <div className={`status-card ${status}`}>
            <div className="card-icon">
                <Icon size={24} />
            </div>
            <div className="card-content">
                <h3>{title}</h3>
                <div className="status-badge">
                    {status === 'loading' ? (
                        <span className="loading-spinner">Checking...</span>
                    ) : status === 'up' ? (
                        <><CheckCircle size={16} /> Online</>
                    ) : (
                        <><XCircle size={16} /> Offline</>
                    )}
                </div>
                {details && <p className="details">{details}</p>}
            </div>

            <style jsx>{`
                .status-card {
                    background: var(--color-bg-panel);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: all 0.2s;
                }
                .status-card.up { border-color: rgba(34, 197, 94, 0.2); }
                .status-card.down { border-color: rgba(239, 68, 68, 0.2); }
                [data-theme='light'] .status-card.up { background: linear-gradient(135deg, rgba(34, 197, 94, 0.03), var(--color-bg-panel)); }
                [data-theme='light'] .status-card.down { background: linear-gradient(135deg, rgba(239, 68, 68, 0.03), var(--color-bg-panel)); }
                [data-theme='dark'] .status-card.up { background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), var(--color-bg-panel)); }
                [data-theme='dark'] .status-card.down { background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), var(--color-bg-panel)); }
                
                .card-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: var(--color-bg-input);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-secondary);
                }
                .status-card.up .card-icon { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
                .status-card.down .card-icon { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

                .card-content h3 { margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
                .status-badge { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; }
                .up .status-badge { color: #22c55e; }
                .down .status-badge { color: #ef4444; }
                .details { margin: 4px 0 0 0; font-size: 12px; color: var(--color-text-muted); }
            `}</style>
        </div>
    );

    // Derived statuses
    const backendStatus = health ? 'up' : 'down';
    const dbStatus = health?.info?.promotion_db?.status === 'up' ? 'up' : 'down';
    const kafkaStatus = health?.info?.kafka?.status === 'up' ? 'up' : 'down';

    return (
        <div className="tab-pane">
            <div className="header">
                <div>
                    <h3>System Health</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>Real-time health monitoring of platform infrastructure.</p>
                </div>
                <button className="refresh-btn" onClick={checkHealth} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            <div className="grid-layout">
                <StatusCard
                    title="Backend API"
                    icon={Server}
                    status={loading && !health ? 'loading' : backendStatus}
                    details="Port 4000 (NestJS)"
                />
                <StatusCard
                    title="Database"
                    icon={Database}
                    status={loading && !health ? 'loading' : (backendStatus === 'down' ? 'down' : dbStatus)}
                    details="PostgreSQL (Port 5432)"
                />
                <StatusCard
                    title="Event Bus"
                    icon={Activity}
                    status={loading && !health ? 'loading' : (backendStatus === 'down' ? 'down' : kafkaStatus)}
                    details="Redpanda Kafka (Port 9092)"
                />
                <StatusCard
                    title="Frontend"
                    icon={Cpu}
                    status="up"
                    details="Next.js (Port 3000)"
                />
            </div>

            {/* Remediation Section */}
            {(backendStatus === 'down' || dbStatus === 'down' || kafkaStatus === 'down') && (
                <div className="remediation-panel">
                    <h3>🛠️ Troubleshooting</h3>
                    <p>Some systems appear to be offline. Run the following command in your terminal to start them:</p>

                    <div className="code-block">
                        <code>docker-compose up -d</code>
                        <button className="copy-btn" onClick={() => navigator.clipboard.writeText('docker-compose up -d')}>Copy</button>
                    </div>

                    {backendStatus === 'down' && (
                        <div className="mt-4">
                            <p className="text-sm text-yellow-500">Note: If the Backend is down, run this in the <code>backend</code> folder:</p>
                            <div className="code-block">
                                <code>npm run start:dev</code>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="footer-meta">
                Last updated: {lastUpdated?.toLocaleTimeString()}
            </div>

            <style jsx>{`
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
                
                .refresh-btn {
                    background: var(--color-bg-input);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-primary);
                    padding: 8px 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 13px;
                }
                .refresh-btn:hover { background: var(--color-bg-input-focus); border-color: var(--color-betika-yellow); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                .grid-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 32px; }

                .remediation-panel {
                    background: var(--color-bg-panel);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: var(--shadow-md);
                }
                [data-theme='light'] .remediation-panel { border-color: rgba(239, 68, 68, 0.2); background: linear-gradient(135deg, rgba(239, 68, 68, 0.02), var(--color-bg-panel)); }
                [data-theme='dark'] .remediation-panel { border-color: rgba(239, 68, 68, 0.1); background: rgba(239, 68, 68, 0.02); }

                .remediation-panel h3 { margin-top: 0; color: #ef4444; font-size: 16px; margin-bottom: 12px; font-weight: 700; }
                .remediation-panel p { color: var(--color-text-secondary); font-size: 13px; margin-bottom: 12px; }

                .code-block {
                    background: var(--color-bg-sidebar);
                    border: 1px solid var(--color-border);
                    padding: 12px;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-family: inherit;
                    color: var(--color-text-secondary);
                    font-size: 13px;
                }
                .code-block code { color: #22c55e; font-weight: 600; font-family: monospace; }

                .copy-btn {
                    background: var(--color-bg-input);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-primary);
                    padding: 4px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                }
                .copy-btn:hover { background: var(--color-bg-input-focus); color: var(--color-betika-yellow); }

                .footer-meta { margin-top: 32px; color: var(--color-text-muted); font-size: 11px; text-align: right; }
                .mt-4 { margin-top: 16px; }
            `}</style>
        </div>
    );
}
