'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getAIResponse, AIResponse } from '@/lib/support-ai';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    actionLink?: string;
}

interface AIContextType {
    isOpen: boolean;
    toggleChat: () => void;
    messages: ChatMessage[];
    sendMessage: (content: string) => void;
    isTyping: boolean;
    minimizeChat: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init',
            role: 'assistant',
            content: 'Hi there! I am your Betika Assistant. I can help you navigate the platform, explain features, or troubleshoot issues. How can I help today?',
            timestamp: new Date().toISOString()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    // Persist chat state (optional enhancement for later)

    const toggleChat = () => setIsOpen(prev => !prev);
    const minimizeChat = () => setIsOpen(false);

    const sendMessage = (content: string) => {
        // Add user message immediately
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Simulate AI thinking delay
        setTimeout(() => {
            const aiResponse = getAIResponse(content, { path: pathname });
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse.message,
                actionLink: aiResponse.action,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <AIContext.Provider value={{ isOpen, toggleChat, messages, sendMessage, isTyping, minimizeChat }}>
            {children}
        </AIContext.Provider>
    );
}

export function useAI() {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}
