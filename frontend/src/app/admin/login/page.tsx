'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Lock, Mail, ArrowRight, ShieldCheck, Globe,
    LayoutGrid, Chrome, CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('nana@gmail.com');
    const [password, setPassword] = useState('1234');
    const [isLoading, setIsLoading] = useState(false);
    const [authMethod, setAuthMethod] = useState<'email' | 'sso'>('email');

    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            // 1. Check for stored users
            const savedUsers = localStorage.getItem('settings_users');
            let users = [];
            try {
                if (savedUsers) users = JSON.parse(savedUsers);
            } catch (e) { }

            // 2. Validate Credentials
            const user = users.find((u: any) => u.email === email && u.password === password);
            const isDefaultUser = email === 'nana@gmail.com' && password === '1234';

            if (user || isDefaultUser) {
                // 3. Set User Name for Personalization
                const nameToSave = user ? user.name : 'Nana';
                localStorage.setItem('user_name', nameToSave);
                router.push('/');
            } else {
                setIsLoading(false);
                setError('Invalid email or password');
            }
        }, 1000);
    };

    const handleSSO = (provider: string) => {
        setIsLoading(true);
        console.log(`Authenticating with ${provider}...`);
        setTimeout(() => {
            router.push('/');
        }, 1500);
    };

    return (
        <div className="login-container">

            {/* --- LEFT PANEL: VISUAL & BRANDING --- */}
            <div className="visual-panel">
                <div className="visual-content">
                    <div className="hero-text">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ fontSize: '42px', lineHeight: '1.2', marginBottom: '16px' }}
                        >
                            Welcome to The Betika Promotions Platform
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '24px' }}
                        >
                            Your #1 to Enterprise Campaign Management. Orchestrate complex player engagements and scale your operations from a single control tower.
                        </motion.p>
                    </div>

                    <div className="visual-footer" style={{
                        borderTop: 'none',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '24px',
                        alignItems: 'center',
                        marginTop: '24px'
                    }}>
                        <div style={{
                            color: 'var(--color-betika-yellow, #eab308)',
                            fontSize: '13px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                        }}>
                            Home of Champions
                        </div>
                        <div className="flags-container" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {[
                                { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
                                { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
                                { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
                                { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
                                { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
                                { code: 'CD', name: 'DRC', flag: '🇨🇩' },
                                { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
                                { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' }
                            ].map((country) => (
                                <div key={country.code} title={country.name} style={{
                                    fontSize: '24px',
                                    cursor: 'help',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                }}>
                                    {country.flag}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Abstract Background Elements */}
                <div className="abstract-bg">
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                    <div className="grid-overlay"></div>
                </div>
            </div>

            {/* --- RIGHT PANEL: AUTHENTICATION --- */}
            <div className="auth-panel">
                <div className="auth-wrapper">
                    <div className="auth-header">
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                            <img src="/assets/logo.png" alt="Betika Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                        </div>
                        <p style={{ textAlign: 'center', marginTop: 16 }}>Please enter your details to sign in.</p>
                    </div>

                    {/* SSO Buttons */}
                    <div className="sso-group">
                        <button className="btn-sso" onClick={() => handleSSO('Google')} type="button">
                            <span className="icon-google">G</span>
                            <span className="btn-text">Sign in with Google</span>
                        </button>
                        <button className="btn-sso" onClick={() => handleSSO('Microsoft')} type="button">
                            <span className="icon-microsoft">
                                <LayoutGrid size={16} fill="currentColor" />
                            </span>
                            <span className="btn-text">Sign in with Microsoft</span>
                        </button>
                    </div>

                    <div className="divider">
                        <span>or continue with email</span>
                    </div>

                    {error && (
                        <div className="error-alert" style={{
                            color: '#f87171',
                            background: 'rgba(248, 113, 113, 0.1)',
                            padding: '10px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            marginBottom: '16px',
                            textAlign: 'center',
                            border: '1px solid rgba(248, 113, 113, 0.2)'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="input-group">
                            <div className="input-field">
                                <span className="input-icon">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    placeholder="Work Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <div className="input-field">
                                <span className="input-icon">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <label className="checkbox-wrap">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                <span>Remember for 30 days</span>
                            </label>
                            <a href="#" className="forgot-pass">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className={`btn-primary ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Authenticating...' : 'Sign In'}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Don't have an account? <a href="#">Contact Admin</a></p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .login-container {
                    display: flex;
                    height: 100vh;
                    width: 100vw;
                    background: #0f0f12;
                    color: #fff;
                    font-family: 'Inter', sans-serif;
                    overflow: hidden;
                }

                /* --- Visual Panel (Left) --- */
                .visual-panel {
                    flex: 1;
                    position: relative;
                    background: #18181b;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 80px;
                    overflow: hidden;
                }

                .visual-content {
                    position: relative;
                    z-index: 10;
                    max-width: 600px;
                }

                .brand-mark {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 60px;
                }
                
                .brand-name {
                    font-size: 24px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #fff;
                }

                .hero-text h1 {
                    font-size: 48px;
                    font-weight: 800;
                    line-height: 1.1;
                    margin-bottom: 24px;
                    background: linear-gradient(to right, #fff, #94a3b8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hero-text p {
                    font-size: 18px;
                    color: #94a3b8;
                    line-height: 1.6;
                    margin-bottom: 48px;
                    max-width: 90%;
                }

                .visual-footer {
                    display: flex;
                    gap: 32px;
                    padding-top: 32px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #e2e8f0;
                }
                .text-yellow { color: var(--color-betika-yellow, #eab308); }

                /* Abstract BG */
                .abstract-bg {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 1;
                }
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.4;
                }
                .orb-1 {
                    width: 400px; height: 400px;
                    background: var(--color-betika-yellow, #eab308);
                    top: -100px; right: -100px;
                }
                .orb-2 {
                    width: 600px; height: 600px;
                    background: #4f46e5;
                    bottom: -200px; left: -200px;
                    opacity: 0.2;
                }
                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 40px 40px;
                    opacity: 0.3;
                }

                /* --- Auth Panel (Right) --- */
                .auth-panel {
                    width: 50%;
                    max-width: 600px;
                    background: #0f0f12;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 60px;
                }

                .auth-wrapper {
                    width: 100%;
                    max-width: 400px;
                }

                .auth-header { margin-bottom: 40px; }
                .auth-header h2 { font-size: 32px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; }
                .auth-header p { color: #64748b; font-size: 15px; margin: 0; }

                /* SSO Buttons */
                .sso-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
                .btn-sso {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    background: #18181b;
                    border: 1px solid #27272a;
                    color: #fff;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-sso:hover { background: #27272a; border-color: #3f3f46; }
                .icon-google { font-weight: 700; font-family: serif; font-size: 18px; }

                /* Divider */
                .divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    margin: 24px 0;
                    color: #52525b;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .divider::before, .divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid #27272a;
                }
                .divider span { padding: 0 10px; }

                /* Form */
                .auth-form { display: flex; flex-direction: column; gap: 20px; }
                
                .input-group label { display: block; font-size: 13px; font-weight: 500; color: #e2e8f0; margin-bottom: 8px; }
                .input-field { position: relative; }
                .input-icon { 
                    position: absolute; 
                    left: 14px; 
                    top: 50%; 
                    transform: translateY(-50%); 
                    color: #71717a; 
                    pointer-events: none; 
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                input {
                    width: 100%;
                    background: #18181b;
                    border: 1px solid #27272a;
                    border-radius: 8px;
                    padding: 12px 16px 12px 42px;
                    color: #fff;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                }
                input:focus {
                    background: #18181b;
                    border-color: var(--color-betika-yellow, #eab308);
                    box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.1);
                }
                input::placeholder { color: #52525b; }

                .form-actions { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin: 4px 0 8px 0; }
                
                .checkbox-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; color: #a1a1aa; }
                .checkbox-wrap input { display: none; }
                .checkmark { width: 16px; height: 16px; border: 1px solid #52525b; border-radius: 4px; display: inline-block; position: relative; }
                .checkbox-wrap input:checked + .checkmark { background: var(--color-betika-yellow, #eab308); border-color: var(--color-betika-yellow, #eab308); }
                
                .forgot-pass { color: var(--color-betika-yellow, #eab308); text-decoration: none; font-weight: 500; }
                .forgot-pass:hover { text-decoration: underline; }

                .btn-primary {
                    background: var(--color-betika-yellow, #eab308);
                    color: #000;
                    border: none;
                    padding: 14px;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
                .btn-primary:active { transform: translateY(0); }
                .btn-primary.loading { opacity: 0.7; cursor: wait; }

                .auth-footer { text-align: center; margin-top: 32px; font-size: 13px; color: #71717a; }
                .auth-footer a { color: #fff; text-decoration: none; font-weight: 500; }
                .auth-footer a:hover { text-decoration: underline; }

                /* Responsive */
                @media (max-width: 1024px) {
                    .visual-panel { display: none; }
                    .auth-panel { width: 100%; max-width: 100%; }
                    .auth-wrapper { max-width: 420px; }
                }
            `}</style>
        </div >
    );
}
