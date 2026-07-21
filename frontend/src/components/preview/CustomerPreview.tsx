import React from 'react';

interface CustomerPreviewProps {
    promotion: {
        title: string;
        subtitle?: string;
        bannerImage?: string;
        howItWorks: string[];
        terms: string[];
    };
}

export default function CustomerPreview({ promotion }: CustomerPreviewProps) {
    return (
        <div className="customer-preview-container" style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            background: '#1a2332',
            color: '#ffffff',
            minHeight: '100vh'
        }}>
            {/* Header Navigation */}
            <div style={{
                background: '#0f1419',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #2a3441',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                gap: '20px'
            }}>
                <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#F2D641',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                }}>
                    Betika!
                </div>
                <div style={{
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    minWidth: 0
                }}>
                    <a href="#" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Home</a>
                    <a href="#" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Live</a>
                    <a href="#" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Casino</a>
                    <a href="#" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Promotions</a>
                    <a href="#" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Login</a>
                    <a href="#" style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        padding: '8px 20px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '14px',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap'
                    }}>Register</a>
                </div>
            </div>

            {/* Back Navigation */}
            <div style={{
                background: '#1a2332',
                padding: '16px 20px',
                borderBottom: '1px solid #2a3441'
            }}>
                <a href="#" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: 600
                }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    {promotion.title}
                </a>
            </div>

            {/* Hero Banner */}
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                {promotion.bannerImage ? (
                    <img
                        src={promotion.bannerImage}
                        alt={promotion.title}
                        style={{ width: '100%', height: 'auto', borderRadius: '12px', display: 'block' }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '400px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1a2332 0%, #2a3441 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                        fontWeight: 700,
                        color: '#F2D641',
                        textAlign: 'center',
                        padding: '40px'
                    }}>
                        {promotion.title.toUpperCase()}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
                    {promotion.title}
                </h1>
                {promotion.subtitle && (
                    <p style={{ fontSize: '16px', color: '#d4d4d8', marginBottom: '40px' }}>
                        {promotion.subtitle}
                    </p>
                )}

                {/* How It Works Section */}
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '20px',
                    marginTop: '40px',
                    color: '#ffffff'
                }}>
                    HOW IT WORKS
                </h3>
                <ol style={{ listStyle: 'none', counterReset: 'letter-counter', paddingLeft: 0 }}>
                    {promotion.howItWorks.map((item, index) => (
                        <li key={index} style={{
                            position: 'relative',
                            paddingLeft: '40px',
                            marginBottom: '20px',
                            fontSize: '15px',
                            lineHeight: '1.8',
                            color: '#e4e4e7',
                            counterIncrement: 'letter-counter'
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                fontWeight: 700,
                                color: '#F2D641',
                                fontSize: '16px'
                            }}>
                                {String.fromCharCode(97 + index)}.
                            </span>
                            {item}
                        </li>
                    ))}
                </ol>

                {/* Terms and Conditions */}
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '20px',
                    marginTop: '40px',
                    color: '#ffffff'
                }}>
                    TERMS AND CONDITIONS
                </h3>
                <ol style={{ listStyle: 'none', counterReset: 'term-counter', paddingLeft: 0 }}>
                    {promotion.terms.map((term, index) => (
                        <li key={index} style={{
                            position: 'relative',
                            paddingLeft: '40px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            lineHeight: '1.8',
                            color: '#d4d4d8',
                            counterIncrement: 'term-counter'
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                fontWeight: 700,
                                color: '#22c55e',
                                fontSize: '15px'
                            }}>
                                {index + 1}.
                            </span>
                            {term}
                        </li>
                    ))}
                </ol>
            </div>

            {/* Footer */}
            <div style={{
                background: '#0f1419',
                padding: '20px',
                textAlign: 'center',
                marginTop: '60px',
                borderTop: '1px solid #2a3441'
            }}>
                <p style={{ fontSize: '12px', color: '#71717a', lineHeight: '1.6' }}>
                    Regulated by the Gaming Commission of Ghana<br />
                    License No. GC-2023-001
                </p>
                <div style={{
                    display: 'inline-block',
                    marginTop: '12px',
                    padding: '6px 12px',
                    background: 'rgba(242, 214, 65, 0.1)',
                    border: '1px solid #F2D641',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#F2D641',
                    fontWeight: 600
                }}>
                    18+ | Play Responsibly
                </div>
            </div>

            {/* Chat Widget */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                background: '#ffffff',
                color: '#000000',
                padding: '12px 20px',
                borderRadius: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                zIndex: 1000
            }}>
                Hi. Need any help?
            </div>
        </div>
    );
}
