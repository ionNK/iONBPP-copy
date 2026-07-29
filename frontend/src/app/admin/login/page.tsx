'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

const googleIcon = '/assets/login/google.svg';

const cascade = {
 hidden: { opacity: 0, y: 16 },
 show: {
 opacity: 1,
 y: 0,
 transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
 },
};

const container = {
 hidden: {},
 show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

export default function LoginPage() {
 const router = useRouter();
 const { setTheme, setThemeFamily } = useTheme();
 const [isLoading, setIsLoading] = useState(false);

 const handleGoogleSignIn = () => {
 setIsLoading(true);

 // Post-login default: Ionix dark. Routed through ThemeContext so React
 // state, localStorage (betika-theme / betika-theme-family), and the
 // <html> data attributes stay in sync across client-side navigation.
 setThemeFamily('ionix');
 setTheme('dark');

 window.setTimeout(() => router.push('/'), 800);
 };

 return (
 <main className="ds-login ionix-login" aria-label="Admin portal sign in">
 <section className="ds-login__campaign">
 <div className="ds-login__brand">Ionix Boost CRM</div>
 <motion.img
 className="ds-login__hero"
 src="/assets/login/hero-main.png"
 alt="Ionix Boost CRM — Built for Champions. Made for You"
 initial={{ opacity: 0, x: -24 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
 />
 <div className="ds-login__flags">
 <img src="/assets/login/flag-zm.png" alt="Zambia" />
 <img src="/assets/login/flag-gh.png" alt="Ghana" />
 <img src="/assets/login/flag-et.png" alt="Ethiopia" />
 <img src="/assets/login/flag-mw.png" alt="Malawi" />
 <img src="/assets/login/flag-mz.png" alt="Mozambique" />
 <img src="/assets/login/flag-ke.png" alt="Kenya" />
 <img src="/assets/login/flag-ug.png" alt="Uganda" />
 <img src="/assets/login/flag-tz.png" alt="Tanzania" />
 <img src="/assets/login/flag-cd.png" alt="DRC" />
 </div>
 </section>

 <section className="ds-login__authentication">
 <motion.div
 className="ds-login__form"
 variants={container}
 initial="hidden"
 animate="show"
 >
 <motion.header className="ds-login__intro" variants={cascade}>
 <h1>
 Good to see you{' '}
 <motion.span
 aria-hidden="true"
 className="ds-login__wave"
 initial={{ rotate: 0 }}
 animate={{ rotate: [0, 18, -8, 14, -4, 0] }}
 transition={{ duration: 1.1, delay: 0.6, ease: 'easeInOut' }}
 >
 👋
 </motion.span>
 </h1>
 <p>Use your authorised Google account to access the admin portal.</p>
 </motion.header>

 <motion.div variants={cascade}>
 <button
 className="ds-login__google-button"
 type="button"
 onClick={handleGoogleSignIn}
 disabled={isLoading}
 >
 <img src={googleIcon} alt="" />
 <span>{isLoading ? 'Signing in…' : 'Sign in with Google'}</span>
 </button>
 </motion.div>

 <motion.p className="ds-login__notice" variants={cascade}>
 Access is restricted to authorised staff only.<br />
 Contact your administrator if you need access.
 </motion.p>

 <motion.div className="ds-login__highlights" variants={cascade}>
 <div className="ds-login__highlight">
 <span className="ds-login__highlight-icon" aria-hidden="true">📊</span>
 <strong>Player 360</strong>
 <p>Full customer view in one screen</p>
 </div>
 <div className="ds-login__highlight">
 <span className="ds-login__highlight-icon" aria-hidden="true">🎯</span>
 <strong>Smart Segments</strong>
 <p>Target the right players, instantly</p>
 </div>
 <div className="ds-login__highlight">
 <span className="ds-login__highlight-icon" aria-hidden="true">⚡</span>
 <strong>Live Monitoring</strong>
 <p>Real-time promotion performance</p>
 </div>
 </motion.div>
 </motion.div>
 </section>
 </main>
 );
}