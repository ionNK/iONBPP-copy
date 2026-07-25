'use client';

import { useState, useEffect } from 'react';
import { X, Play, SkipForward } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ExplainerVideoProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ExplainerVideo({ isOpen, onClose }: ExplainerVideoProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    // Portal to document.body
    const { createPortal } = require('react-dom');

    const content = (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="ds-explainer-video video-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="ds-explainer-video video-modal"

role="dialog"
aria-modal="true"
aria-labelledby="explainer-video-title"
initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <button className="close-btn" type="button" aria-label="Close video" onClick={onClose}>
                            <X size={20} />
                        </button>

                        <div className="video-header">
                            <h2 id="explainer-video-title">Welcome to Betika Promotions</h2>
                            <p>Here's a quick 30s overview of the platform.</p>
                        </div>

                        <div className="video-player">
                            {/* Mock Video Player */}
                            <div className="video-placeholder">
                                <div className="play-icon">
                                    <Play size={48} fill="currentColor" />
                                </div>
                                <div className="video-overlay">
                                    <span className="duration">0:30</span>
                                </div>
                                {/* In a real app, this would be:
                                   <iframe src="https://www.youtube.com/embed/VIDEO_ID" ... />
                                */}
                                <img
                                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000"
                                    alt="Platform Preview"
                                    className="video-poster"
                                />
                            </div>
                        </div>

                        <div className="video-footer">
                            <button className="btn-skip" onClick={onClose}>
                                <SkipForward size={16} /> Skip Video
                            </button>
                            <button className="btn-primary" onClick={onClose}>
                                Get Started
                            </button>
                        </div>
 </motion.div>
 </>

            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}
