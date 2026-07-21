'use client';

export default function ReportsLoading() {
    return (
        <div style={{
            display: 'flex',
            height: '100%',
            minHeight: '600px',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-app)'
        }}>
            <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--color-betika-yellow)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#fff', marginBottom: '4px', fontSize: '16px' }}>Generating Reports...</h3>
                <span style={{ fontSize: '13px' }}>Compiling campaign performance metrics...</span>
            </div>

            <style jsx global>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
