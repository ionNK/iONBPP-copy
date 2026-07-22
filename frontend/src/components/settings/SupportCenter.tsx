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

const INITIAL_TICKETS: Ticket[] = [
 { id: 'SUP-1023', category: 'Billing', title: 'Invoice incorrect for March', description: 'The invoice amount does not match usage.', priority: 'High', status: 'In Progress', createdAt: '2024-03-10' },
 { id: 'SUP-1002', category: 'Bug', title: 'Cannot save promotion draft', description: 'Error 500 when clicking save.', priority: 'Medium', status: 'Resolved', createdAt: '2024-02-28' },
];

export default function SupportCenter() {
 const pathname = usePathname();
 const [activeTab, setActiveTab] = useState<'create' | 'list' | 'chat' | 'config'>('create');
 const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
 const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
 { id: '1', role: 'assistant', content: 'Hello! I am your Betika Support Assistant. How can I help you today?', timestamp: new Date().toISOString() },
 ]);
 const [chatInput, setChatInput] = useState('');
 const chatEndRef = useRef<HTMLDivElement>(null);
 const [newTicket, setNewTicket] = useState({ category: 'Bug', title: '', description: '', priority: 'Medium' });
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [submissionSuccess, setSubmissionSuccess] = useState('');
 const [config, setConfig] = useState({ method: 'jira', jiraProject: 'PROMO', supportEmail: 'support@betika.com' });

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
 priority: newTicket.priority as Ticket['priority'],
 status: 'Open',
 createdAt: new Date().toISOString().split('T')[0],
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

 const userMsg: ChatMessage = {
 id: Date.now().toString(),
 role: 'user',
 content: chatInput,
 timestamp: new Date().toISOString(),
 };
 setChatHistory(prev => [...prev, userMsg]);
 setChatInput('');

 setTimeout(() => {
 const result = getAIResponse(userMsg.content, { path: pathname || undefined });
 const aiMsg: ChatMessage = {
 id: (Date.now() + 1).toString(),
 role: 'assistant',
 content: result.message,
 actionLink: result.action,
 timestamp: new Date().toISOString(),
 };
 setChatHistory(prev => [...prev, aiMsg]);
 }, 1000);
 };

 return (
 <div className="support-center">
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
 <button className={`sup-tab sup-tab--config ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
 <SettingsIcon size={16} /> Config
 </button>
 </div>

 <div className="support-card ds-panel">
 {activeTab === 'create' && (
 <div className="support-view support-create-view">
 <h3 className="support-view-title">Log a New Issue</h3>

 {submissionSuccess && (
<div className="support-success-banner ds-notice ds-notice--success" role="status">
<span className="ds-notice__icon"><CheckCircle2 aria-hidden="true" /></span>
<span>{submissionSuccess}</span>
</div>
 )}

 <div className="support-form-grid">
 <div className="support-form-group">
 <label htmlFor="support-category">Issue Category</label>
 <select className="ds-select" id="support-category" value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}>
 <option>Bug</option>
 <option>Access Problem</option>
 <option>Billing</option>
 <option>Feature Request</option>
 <option>Other</option>
 </select>
 </div>
 <div className="support-form-group">
 <label htmlFor="support-priority">Priority</label>
 <select className="ds-select" id="support-priority" value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}>
 <option>Low</option>
 <option>Medium</option>
 <option>High</option>
 <option>Critical</option>
 </select>
 </div>
 <div className="support-form-group support-form-group--full">
 <label htmlFor="support-title">Title</label>
 <input className="ds-control" id="support-title" type="text" placeholder="Brief summary of the issue" value={newTicket.title} onChange={e => setNewTicket({ ...newTicket, title: e.target.value })} />
 </div>
 <div className="support-form-group support-form-group--full">
 <label htmlFor="support-description">Description</label>
 <textarea className="ds-control" id="support-description" rows={5} placeholder="Detailed description..." value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} />
 </div>
 <div className="support-form-group support-form-group--full">
 <label>Attachments (Optional)</label>
 <div className="support-file-drop-area">
 <Paperclip size={20} /> <span>Drag files or click to upload screenshot</span>
 </div>
 </div>
 </div>
 <div className="support-form-actions">
 <button className="support-submit-button ds-action-button ds-action-button--primary ds-action-button--primary-lg" disabled={!newTicket.title || !newTicket.description || isSubmitting} onClick={handleCreateTicket}>
 {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
 </button>
 </div>
 </div>
 )}

 {activeTab === 'list' && (
 <div className="support-view support-ticket-list-view">
 <h3 className="support-view-title">Support Ticket History</h3>
 <div className="support-table-scroll">
 <table className="support-tickets-table">
 <thead>
 <tr>
 <th>ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th>
 </tr>
 </thead>
 <tbody>
 {tickets.map(t => (
 <tr key={t.id}>
 <td className="support-ticket-id">{t.id}</td>
 <td className="support-ticket-title">{t.title}</td>
 <td className="support-ticket-category">{t.category}</td>
 <td><span className={`support-priority-badge support-priority-badge--${t.priority.toLowerCase()}`}>{t.priority}</span></td>
 <td><span className={`support-ticket-status support-ticket-status--${t.status.toLowerCase().replaceAll(' ', '-')}`}>{t.status}</span></td>
 <td className="support-ticket-date">{t.createdAt}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {activeTab === 'chat' && (
 <div className="support-chat-view">
 <div className="support-chat-history">
 {chatHistory.map(msg => (
 <div key={msg.id} className={`support-chat-message support-chat-message--${msg.role}`}>
 <div className="support-message-bubble">
 {msg.content}
 {msg.actionLink && (
 <a href={msg.actionLink} className="support-message-action">Open {msg.actionLink} →</a>
 )}
 </div>
 <div className="support-message-time">
 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </div>
 </div>
 ))}
 <div ref={chatEndRef} />
 </div>
 <div className="support-chat-input-area">
 <input className="ds-control" type="text" placeholder="Type your question..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
 <button className="support-send-button ds-action-button ds-action-button--primary" type="button" onClick={handleSendMessage} aria-label="Send message"><Send size={18} /></button>
 </div>
 </div>
 )}

 {activeTab === 'config' && (
 <div className="support-view support-config-view">
 <h3 className="support-view-title">Support Configuration</h3>
 <div className="support-form-group support-config-method">
 <label>Integration Method</label>
 <div className="support-radio-group">
 <label><input type="radio" name="method" checked={config.method === 'jira'} onChange={() => setConfig({ ...config, method: 'jira' })} /> Jira Cloud</label>
 <label><input type="radio" name="method" checked={config.method === 'email'} onChange={() => setConfig({ ...config, method: 'email' })} /> Email Only</label>
 </div>
 </div>
 {config.method === 'jira' && (
 <div className="support-integration-config ds-panel">
 <div className="support-form-group">
 <label htmlFor="support-jira-project">Jira Project Key</label>
 <input className="ds-control" id="support-jira-project" type="text" value={config.jiraProject} onChange={e => setConfig({ ...config, jiraProject: e.target.value })} />
 </div>
 <div className="support-info-box ds-notice ds-notice--info">
<span className="ds-notice__icon"><AlertCircle aria-hidden="true" /></span>
<span>Tickets will be created automatically in the configured Jira project.</span>
</div>
 </div>
 )}
 {config.method === 'email' && (
 <div className="support-integration-config ds-panel">
 <div className="support-form-group">
 <label htmlFor="support-email">Support Email Address</label>
 <input className="ds-control" id="support-email" type="email" value={config.supportEmail} onChange={e => setConfig({ ...config, supportEmail: e.target.value })} />
 </div>
 <div className="support-info-box ds-notice ds-notice--info">
<span className="ds-notice__icon"><AlertCircle aria-hidden="true" /></span>
<span>Issues will be sent to this email address.</span>
</div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}