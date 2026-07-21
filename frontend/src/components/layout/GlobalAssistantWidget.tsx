'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, ChevronDown, Sparkles } from 'lucide-react';
import { useAI } from '@/context/AIContext';

export default function GlobalAssistantWidget() {
    const { isOpen, toggleChat, messages, sendMessage, isTyping, minimizeChat } = useAI();
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    return (
        <div className="global-widget-container">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="chat-window"
                        style={{ width: '400px', height: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100001, position: 'relative' }}
                    >
                        {/* Header */}
                        <div className="chat-header">
                            <div className="header-left">
                                <div className="avatar-circle">
                                    <Sparkles size={16} color="#0f172a" />
                                </div>
                                <div>
                                    <h3 className="assistant-name">Betika AI Assistant</h3>
                                    <p className="assistant-status">
                                        <span className="status-dot"></span> Online
                                    </p>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button onClick={minimizeChat} className="icon-btn">
                                    <ChevronDown size={18} />
                                </button>
                                <button onClick={toggleChat} className="icon-btn">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`message-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
                                >
                                    <div className="message-bubble">
                                        <p>{msg.content}</p>

                                        {/* Action Link */}
                                        {msg.actionLink && (
                                            <a
                                                href={msg.actionLink}
                                                className="action-link"
                                            >
                                                Go to {msg.actionLink} →
                                            </a>
                                        )}

                                        <span className="timestamp">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="message-row assistant">
                                    <div className="message-bubble typing-bubble">
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="chat-input-area">
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your question..."
                                    className="chat-input"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="send-btn"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleChat}
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    cursor: 'pointer',
                    background: isOpen ? '#1e293b' : '#F2D641',
                    color: isOpen ? '#ffffff' : '#0f172a',
                    zIndex: 100000,
                }}
            >
                {isOpen ? <ChevronDown size={28} /> : <MessageSquare size={24} />}
            </motion.button>

            <style jsx>{`
                .global-widget-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }

                .chat-window {
                    margin-bottom: 16px;
                    width: 400px;
                    height: 400px;
                    background: var(--color-bg-panel);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    box-shadow: var(--shadow-lg);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .chat-header {
                    padding: 16px;
                    background: var(--color-bg-sidebar);
                    backdrop-filter: blur(8px);
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .avatar-circle {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--color-betika-yellow), #fbbf24);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .assistant-name {
                    font-weight: 600;
                    color: var(--color-text-primary);
                    font-size: 14px;
                    margin: 0;
                }

                .assistant-status {
                    font-size: 12px;
                    color: var(--color-text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin: 0;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #22c55e;
                    animation: pulse 2s infinite;
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                }

                .icon-btn {
                    padding: 6px;
                    background: transparent;
                    border: none;
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    border-radius: 8px;
                }
                .icon-btn:hover {
                    background: var(--color-bg-input);
                    color: var(--color-text-primary);
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    min-height: 0;
                    padding: 16px;
                    background: var(--color-bg-panel);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    scrollbar-width: thin;
                    scrollbar-color: var(--color-border) transparent;
                }
                .chat-messages::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-messages::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-messages::-webkit-scrollbar-thumb {
                    background-color: var(--color-border);
                    border-radius: 3px;
                }

                .message-row {
                    display: flex;
                }
                .message-row.user {
                    justify-content: flex-end;
                }
                .message-row.assistant {
                    justify-content: flex-start;
                }

                .message-bubble {
                    max-width: 85%;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .message-row.user .message-bubble {
                    background: #3b82f6;
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .message-row.assistant .message-bubble {
                    background: var(--color-bg-input);
                    color: var(--color-text-primary);
                    border: 1px solid var(--color-border);
                    border-bottom-left-radius: 4px;
                }

                .action-link {
                    display: block;
                    margin-top: 8px;
                    text-align: center;
                    padding: 8px;
                    background: var(--color-bg-panel);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    font-size: 12px;
                    color: var(--color-text-primary);
                    text-decoration: none;
                    transition: background 0.2s;
                }
                .action-link:hover {
                    background: var(--color-border);
                }

                .timestamp {
                    display: block;
                    font-size: 10px;
                    opacity: 0.5;
                    margin-top: 4px;
                    text-align: right;
                }

                .typing-bubble {
                    display: flex;
                    gap: 4px;
                    padding: 12px;
                }

                .typing-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--color-text-muted);
                    border-radius: 50%;
                    animation: bounce 1s infinite;
                }
                .typing-dot:nth-child(2) { animation-delay: 0.1s; }
                .typing-dot:nth-child(3) { animation-delay: 0.2s; }

                .chat-input-area {
                    padding: 16px;
                    background: var(--color-bg-sidebar);
                    border-top: 1px solid var(--color-border);
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .chat-input {
                    width: 100%;
                    background: var(--color-bg-input);
                    border: 1px solid var(--color-border);
                    border-radius: 12px;
                    padding: 12px 16px;
                    padding-right: 40px;
                    font-size: 14px;
                    color: var(--color-text-primary);
                    outline: none;
                }
                .chat-input:focus {
                    border-color: var(--color-betika-yellow);
                }

                .send-btn {
                    position: absolute;
                    right: 8px;
                    background: var(--color-betika-yellow);
                    color: #000;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
            `}</style>
        </div>
    );
}
