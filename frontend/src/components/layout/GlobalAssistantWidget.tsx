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
 <div className="assistant-widget">
 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 transition={{ duration: 0.2 }}
 className="assistant-widget__window"
 >
 {/* Header */}
 <div className="assistant-widget__header">
 <div className="assistant-widget__header-left">
 <div className="assistant-widget__avatar">
 <Sparkles size={16} />
 </div>
 <div>
 <h3 className="assistant-widget__name">Betika AI Assistant</h3>
 <p className="assistant-widget__status">
 <span className="assistant-widget__status-dot"></span> Online
 </p>
 </div>
 </div>
 <div className="assistant-widget__header-actions">
 <button onClick={minimizeChat} className="assistant-widget__icon-button">
 <ChevronDown size={18} />
 </button>
 <button onClick={toggleChat} className="assistant-widget__icon-button">
 <X size={18} />
 </button>
 </div>
 </div>

 {/* Messages */}
 <div className="assistant-widget__messages">
 {messages.map((msg, index) => (
 <div
 key={index}
 className={`assistant-widget__message-row ${msg.role === 'user' ? 'assistant-widget__message-row--user' : 'assistant-widget__message-row--assistant'}`}
 >
 <div className="assistant-widget__message-bubble">
 <p>{msg.content}</p>

 {/* Action Link */}
 {msg.actionLink && (
 <a
 href={msg.actionLink}
 className="assistant-widget__action-link"
 >
 Go to {msg.actionLink} →
 </a>
 )}

 <span className="assistant-widget__timestamp">
 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 </div>
 ))}

 {isTyping && (
 <div className="assistant-widget__message-row assistant-widget__message-row--assistant">
 <div className="assistant-widget__message-bubble assistant-widget__typing-bubble">
 <span className="assistant-widget__typing-dot"></span>
 <span className="assistant-widget__typing-dot"></span>
 <span className="assistant-widget__typing-dot"></span>
 </div>
 </div>
 )}
 <div ref={chatEndRef} />
 </div>

 {/* Input Area */}
 <div className="assistant-widget__input-area">
 <div className="assistant-widget__input-wrapper">
 <input
 type="text"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
 placeholder="Type your question..."
 className="assistant-widget__input"
 />
 <button
 onClick={handleSend}
 disabled={!input.trim()}
 className="assistant-widget__send-button"
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
 className={`assistant-widget__trigger${isOpen ? ' is-open' : ''}`}
 >
 {isOpen ? <ChevronDown size={28} /> : <MessageSquare size={24} />}
 </motion.button>
 </div>
 );
}
