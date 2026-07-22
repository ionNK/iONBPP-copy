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
        <div className={`status-card ds-panel ${status}`}>
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
        </div>
    );

    // Derived statuses
    const backendStatus = health ? 'up' : 'down';
    const dbStatus = health?.info?.promotion_db?.status === 'up' ? 'up' : 'down';
    const kafkaStatus = health?.info?.kafka?.status === 'up' ? 'up' : 'down';

    return (
 <div className="tab-pane system-status-tab">
 <div className="header">
 <div>
 <h3>System Health</h3>
 <p className="system-status-subtitle">Real-time health monitoring of platform infrastructure.</p>
                </div>
                <button
 className="refresh-btn ds-action-button ds-action-button--outline ds-action-button--surface ds-action-button--outline-md"
 onClick={checkHealth}
 disabled={loading}
>
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
                <div className="remediation-panel ds-panel">
                    <h3>🛠️ Troubleshooting</h3>
                    <p>Some systems appear to be offline. Run the following command in your terminal to start them:</p>

                    <div className="code-block">
                        <code>docker-compose up -d</code>
                        <button
 className="copy-btn ds-action-button ds-action-button--outline ds-action-button--surface ds-action-button--outline-sm ds-action-button--accent-hover"
 onClick={() => navigator.clipboard.writeText('docker-compose up -d')}
>
 Copy
</button>
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
        </div>
    );
}
