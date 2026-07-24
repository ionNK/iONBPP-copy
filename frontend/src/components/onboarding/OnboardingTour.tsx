'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check, MapPin } from 'lucide-react';
import ExplainerVideo from './ExplainerVideo';

export default function OnboardingTour() {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const [userName, setUserName] = useState('');

    // Tour Steps Configuration (Dynamic Title)
    const steps = [
        {
            id: 'welcome',
            title: `Welcome ${userName} to Betika Promotions`,
            content: 'Your new centralized platform for managing campaigns, analyzing performance, and ensuring compliance across all markets.',
            target: null, // Center modal
            action: 'Get Started'
        },
        {
            id: 'nav-dashboard',
            title: 'Real-time Dashboard',
            content: 'Track live campaign performance, budget utilization, and player engagement metrics at a glance.',
            target: 'nav-dashboard',
            position: 'right'
        },
        {
            id: 'nav-promotions',
            title: 'Campaign Management',
            content: 'Create, edit, and schedule multi-channel promotions using our smart wizard.',
            target: 'nav-promotions',
            position: 'right'
        },
        {
            id: 'nav-pred-churn',
            title: 'AI Predictions: Churn',
            content: 'Identify at-risk players before they leave using our advanced machine learning models.',
            target: 'nav-pred-churn',
            position: 'right'
        },
        {
            id: 'nav-pred-promotions',
            title: 'AI Predictions: Offers',
            content: 'Get AI-driven recommendations for the best offers to send to specific player segments.',
            target: 'nav-pred-promotions',
            position: 'right'
        },
        {
            id: 'nav-reports',
            title: 'Deep-Dive Reports',
            content: 'Access detailed financial statements, ROI analysis, and operational reports.',
            target: 'nav-reports',
            position: 'right'
        },
        {
            id: 'nav-governance',
            title: 'Governance & Compliance',
            content: 'Manage workflow approvals, audit logs, and Responsible Gambling compliance indicators.',
            target: 'nav-governance',
            position: 'right'
        }
    ];

    useEffect(() => {
        // Get user name
        const savedName = localStorage.getItem('user_name');
        if (savedName) setUserName(savedName);

        // Check if tour has been seen
        const hasSeenTour = localStorage.getItem('hasSeenTour');

        // Listen for manual restart event
        const handleRestart = () => {
            setStep(0);
            setIsVisible(true);
        };
        window.addEventListener('restart-tour', handleRestart);

        if (!hasSeenTour) {
            // Wait for hydration and potential layout shifts
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener('restart-tour', handleRestart);
    }, []);

    // Update target position when step changes
    useEffect(() => {
        if (!isVisible) return;

    const currentStep = steps[step];
    if (currentStep.target) {
      // Reset first so a stale rect from the previous step can never leave the
      // card stranded off-screen (e.g. when the next target lives inside a
      // collapsed nav group and hasn't rendered yet).
      setTargetRect(null);
      // Wait for element to exist/render
      setTimeout(() => {
        const element = document.getElementById(currentStep.target as string);
        const rect = element?.getBoundingClientRect();
        // Only treat it as a spotlight target if the element is actually
        // rendered with real dimensions; otherwise fall back to a centered
        // modal so the step is never hidden.
        if (element && rect && rect.width > 0 && rect.height > 0) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Re-measure after the scroll settles so positioning is accurate.
          setTimeout(() => setTargetRect(element.getBoundingClientRect()), 350);
          setTargetRect(rect);
        } else {
          // Element missing/collapsed → render this step centered.
          setTargetRect(null);
        }
      }, 300);
    } else {
      setTargetRect(null);
    }
  }, [step, isVisible]);


    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            finishTour();
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const finishTour = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenTour', 'true');
        // Trigger video immediately after tour
        setTimeout(() => setShowVideo(true), 500);
    };

    const currentStep = steps[step];
    const isModal = currentStep && !currentStep.target;

    // --- Portal Rendering ---
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // State for Explainer Video
    const [showVideo, setShowVideo] = useState(false);

    // Don't render anything if not visible (managed by AnimatePresence for exit)
    if (!isVisible && !showVideo && !mounted) return null;

const tourContent = (
<div className="onboarding-tour">
<AnimatePresence>
            {isVisible && (
                <motion.div
                    key="backdrop"
                    className="tour-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={finishTour}
                />
            )}

            {isVisible && targetRect && (
                <motion.div
                    key="spotlight"
                    className="tour-spotlight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                    }}
                />
            )}

            {isVisible && (
                <motion.div
                    key="tour-card"
                    className={`tour-card ${isModal ? 'modal-center' : 'popover'}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        // If modal, center it. If target, position relative to target
                        top: isModal ? '50%' : (targetRect ? targetRect.top : 0),
                        left: isModal ? '50%' : (targetRect ? targetRect.right + 20 : 0),
                        // If modal, use translate to center. If target, no translate
                        x: isModal ? '-50%' : 0,
                        y: isModal ? '-50%' : 0
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                        position: 'fixed'
                    }}
                >
                    <button className="close-btn" onClick={finishTour}>
                        <X size={16} />
                    </button>

                    <div className="tour-content">
                        {isModal ? (
                            <div className="modal-header">
                                <div className="logo-spark">✨</div>
                                <h2>{currentStep.title}</h2>
                            </div>
                        ) : (
                            <h4>{currentStep.title}</h4>
                        )}

                        <p>{currentStep.content}</p>

                        <div className="tour-footer">
                            <div className="step-dots">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                                    />
                                ))}
                            </div>
                            <div className="nav-buttons">
                                {step > 0 && (
                                    <button className="prev-btn" onClick={handlePrev}>
                                        Back
                                    </button>
                                )}
                                <button className="next-btn" onClick={() => (step === steps.length - 1 ? finishTour() : handleNext())}>
                                    {step === steps.length - 1 ? 'Finish' : (currentStep.action || 'Next')}
                                    {step !== steps.length - 1 && <ChevronRight size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

</AnimatePresence>
</div>
    );

    // Render into body
    if (!mounted) return null;

    // Dynamically import createPortal to avoid SSR issues if used in Next.js app directory
    // Dynamically import createPortal to avoid SSR issues if used in Next.js app directory
    const { createPortal } = require('react-dom');

    return (
        <>
            {createPortal(tourContent, document.body)}
            <ExplainerVideo isOpen={showVideo} onClose={() => setShowVideo(false)} />
        </>
    );
}
