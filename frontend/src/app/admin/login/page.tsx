'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const googleIcon = '/assets/login/google.svg';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    window.setTimeout(() => router.push('/'), 800);
  };

  return (
    <main className="ds-login ionix-login" aria-label="Admin portal sign in">
      <section className="ds-login__campaign">
        <img
          className="ds-login__hero"
          src="/assets/login/hero-panel.png"
          alt="Betika Admin Portal — Built for Champions. Made for You"
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <header className="ds-login__intro">
            <h1>Welcome Back</h1>
            <p>Sign in with your authorised Google account to access the admin portal.</p>
          </header>
          <button
            className="ds-login__google-button"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <img src={googleIcon} alt="" />
            <span>{isLoading ? 'Signing in…' : 'Sign in with Google'}</span>
          </button>
          <p className="ds-login__notice">
            Access is restricted to authorised staff only.<br />
            Contact your administrator if you need access.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
