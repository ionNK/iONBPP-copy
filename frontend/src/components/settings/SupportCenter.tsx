'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Paperclip, MessageSquare, List, Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getAIResponse } from '@/lib/support-ai';

interface Ticket {
    id: string;
    category: string;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    createdAt: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    actionLink?: string;
}

// Mock initial data
const INITIAL_TICKETS: Ticket[] = [
    { id: 'SUP-1023', category: 'Billing', title: 'Invoice incorrect for March', description: 'The invoice amount does not match usage.', priority: 'High', status: 'In Progress', createdAt: '2024-03-10' },
    { id: 'SUP-1002', category: 'Bug', title: 'Cannot save promotion draft', description: 'Error 500 when clicking save.', priority: 'Medium', status: 'Resolved', createdAt: '2024-02-28' },
];

export default function SupportCenter() {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<'create' | 'list' | 'chat' | 'config'>('create');
    const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: 'Hello! I am your Betika Support Assistant. How can I help you today?', timestamp: new Date().toISOString() }
    ]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // New Ticket State
    const [newTicket, setNewTicket] = useState({ category: 'Bug', title: '', description: '', priority: 'Medium' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState('');

    // Config State
    const [config, setConfig] = useState({ method: 'jira', jiraProject: 'PROMO', supportEmail: 'support@betika.com' });

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleCreateTicket = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            const ticket: Ticket = {
                id: `SUP-${Math.floor(Math.random() * 10000)}`,
                category: newTicket.category,
                title: newTicket.title,
                description: newTicket.description,
                priority: newTicket.priority as any,
                status: 'Open',
                createdAt: new Date().toISOString().split('T')[0]
            };
            setTickets([ticket, ...tickets]);
            setSubmissionSuccess(`Ticket #${ticket.id} created successfully!`);
            setIsSubmitting(false);
            setNewTicket({ category: 'Bug', title: '', description: '', priority: 'Medium' });
            setTimeout(() => setSubmissionSuccess(''), 5000);
            setActiveTab('list');
        }, 1500);
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;

        // User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, userMsg]);
        setChatInput('');

        // Mock AI Response
        setTimeout(() => {
            const result = getAIResponse(userMsg.content, { path: pathname || undefined });

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.message,
                actionLink: result.action,
                timestamp: new Date().toISOString()
            };
            setChatHistory(prev => [...prev, aiMsg]);
        }, 1000);
    };

    return (
        <div className="support-center">
            {/* Navigation Tabs */}
            <div className="support-nav">
                <button className={`sup-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
                    <Plus size={16} /> Log Issue
                </button>
                <button className={`sup-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                    <List size={16} /> My Tickets
                </button>
                <button className={`sup-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                    <MessageSquare size={16} /> AI Assistant
                </button>
                <button className={`sup-tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')} style={{ marginLeft: 'auto' }}>
                    <SettingsIcon size={16} /> Config
                </button>
            </div>

            <div className="glass-card">
                {activeTab === 'create' && (
                    <div className="create-ticket-view" style={{ padding: 24 }}>
                        <h3 style={{ marginBottom: 20 }}>Log a New Issue</h3>

                        {submissionSuccess && (
                            <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: 8, marginBottom: 20, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <CheckCircle2 size={18} /> {submissionSuccess}
                            </div>
                        )}

                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Issue Category</label>
                                <select
                                    value={newTicket.category}
                                    onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                                    style={{ width: '100%', padding: 10, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)' }}
                                >
                                    <option>Bug</option>
                                    <option>Access Problem</option>
                                    <option>Billing</option>
                                    <option>Feature Request</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Priority</label>
                                <select
                                    value={newTicket.priority}
                                    onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                                    style={{ width: '100%', padding: 10, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)' }}
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Critical</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Title</label>
                                <input
                                    type="text"
                                    placeholder="Brief summary of the issue"
                                    value={newTicket.title}
                                    onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                                    style={{ width: '100%', padding: 10, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Description</label>
                                <textarea
                                    rows={5}
                                    placeholder="Detailed description..."
                                    value={newTicket.description}
                                    onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                    style={{ width: '100%', padding: 10, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Attachments (Optional)</label>
                                <div className="file-drop-area" style={{ border: '2px dashed var(--color-border)', padding: 30, borderRadius: 8, textAlign: 'center', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                    <Paperclip size={20} /> <span>Drag files or click to upload screenshot</span>
                                </div>
                            </div>
                        </div>
                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="btn-primary"
                                disabled={!newTicket.title || !newTicket.description || isSubmitting}
                                onClick={handleCreateTicket}
                                style={{ background: 'var(--color-betika-yellow)', color: '#000', padding: '10px 24px', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: (!newTicket.title || !newTicket.description || isSubmitting) ? 0.5 : 1 }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'list' && (
                    <div className="ticket-list-view" style={{ padding: 24 }}>
                        <h3 style={{ marginBottom: 20 }}>Support Ticket History</h3>
                        <table className="tickets-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: 12, color: 'var(--color-text-secondary)', fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>ID</th>
                                    <th style={{ textAlign: 'left', padding: 12, color: 'var(--color-text-secondary)', fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>Title</th>
                                    <th style={{ textAlign: 'left', padding: 12, color: 'var(--color-text-secondary)', fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>Category</th>
                                    <th style={{ textAlign: 'left', padding: 12, color: 'var(--color-text-secondary)', fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>Priority</th>
                                    <th style={{ textAlign: 'left', padding: 12, color: 'var(--color-text-secondary)', fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: 12, color: 'var(--color-text-secondary)', fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', fontFamily: 'monospace', color: 'var(--color-betika-yellow)' }}>{t.id}</td>
                                        <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{t.title}</td>
                                        <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{t.category}</td>
                                        <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                                                background: t.priority === 'High' || t.priority === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : t.priority === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                color: t.priority === 'High' || t.priority === 'Critical' ? '#ef4444' : t.priority === 'Medium' ? '#f59e0b' : '#3b82f6'
                                            }}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: 12, fontSize: 11, border: '1px solid',
                                                borderColor: t.status === 'Resolved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                background: t.status === 'Resolved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                color: t.status === 'Resolved' ? '#4ade80' : '#60a5fa'
                                            }}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 13 }}>{t.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="chat-view" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
                        <div className="chat-history" style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {chatHistory.map(msg => (
                                <div key={msg.id} className={`chat-msg`} style={{
                                    maxWidth: '80%',
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    display: 'flex', flexDirection: 'column'
                                }}>
                                    <div className="msg-bubble" style={{
                                        padding: '12px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                                        background: msg.role === 'user' ? '#3b82f6' : 'var(--color-bg-card)',
                                        color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                                        borderBottomRightRadius: msg.role === 'user' ? 2 : 12,
                                        borderBottomLeftRadius: msg.role === 'assistant' ? 2 : 12,
                                    }}>
                                        {msg.content}
                                        {msg.actionLink && (
                                            <a href={msg.actionLink} style={{ display: 'block', marginTop: 8, padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', textDecoration: 'none', fontSize: 13, textAlign: 'center' }}>
                                                Open {msg.actionLink} →
                                            </a>
                                        )}
                                    </div>
                                    <div className="msg-time" style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4, textAlign: 'right' }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="chat-input-area" style={{ padding: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10 }}>
                            <input
                                type="text"
                                placeholder="Type your question..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                style={{ flex: 1, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', padding: 12, borderRadius: 24, color: 'var(--color-text-primary)', outline: 'none' }}
                            />
                            <button
                                onClick={handleSendMessage}
                                style={{ background: 'var(--color-betika-yellow)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000' }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="config-view" style={{ padding: 24 }}>
                        <h3 style={{ marginBottom: 20 }}>Support Configuration</h3>
                        <div className="form-group" style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>Integration Method</label>
                            <div className="radio-group" style={{ display: 'flex', gap: 20 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="radio" name="method" checked={config.method === 'jira'} onChange={() => setConfig({ ...config, method: 'jira' })} />
                                    Jira Cloud
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="radio" name="method" checked={config.method === 'email'} onChange={() => setConfig({ ...config, method: 'email' })} />
                                    Email Only
                                </label>
                            </div>
                        </div>
                        {config.method === 'jira' && (
                            <div className="jira-config" style={{ padding: 20, background: 'var(--color-bg-input)', borderRadius: 8 }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Jira Project Key</label>
                                    <input
                                        type="text"
                                        value={config.jiraProject}
                                        onChange={e => setConfig({ ...config, jiraProject: e.target.value })}
                                        style={{ width: '100%', padding: 10, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)' }}
                                    />
                                </div>
                                <div className="info-box" style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', color: '#60a5fa', fontSize: 13 }}>
                                    <AlertCircle size={16} /> Tickets will be created automatically in the configured Jira project.
                                </div>
                            </div>
                        )}
                        {config.method === 'email' && (
                            <div className="email-config" style={{ padding: 20, background: 'var(--color-bg-input)', borderRadius: 8 }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>Support Email Address</label>
                                    <input
                                        type="email"
                                        value={config.supportEmail}
                                        onChange={e => setConfig({ ...config, supportEmail: e.target.value })}
                                        style={{ width: '100%', padding: 10, background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)' }}
                                    />
                                </div>
                                <div className="info-box" style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', color: '#60a5fa', fontSize: 13 }}>
                                    <AlertCircle size={16} /> Issues will be sent to this email address.
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
            .support-nav { display: flex; gap: 10px; margin-bottom: 20px; }
            .sup-tab { padding: 10px 16px; border-radius: 8px; background: var(--color-bg-input); color: var(--color-text-secondary); display: flex; align-items: center; gap: 8px; font-weight: 500; transition: all 0.2s; border: 1px solid transparent; cursor: pointer; }
            .sup-tab:hover { background: var(--color-bg-input-focus); color: var(--color-text-primary); }
            .sup-tab.active { background: rgba(242, 214, 65, 0.1); color: var(--color-betika-yellow); border-color: rgba(242, 214, 65, 0.3); }
            .glass-card { background: var(--color-bg-panel); backdrop-filter: blur(10px); border: 1px solid var(--color-border); border-radius: 12px; }
        `}</style>
        </div>
    );
}
