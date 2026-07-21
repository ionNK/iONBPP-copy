'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { WizardState } from '@/context/WizardContext';
import { SEED_TEMPLATES } from '@/data/seedTemplates';

// A reusable, operator-created promotion preset. Unlike TEMPLATE_META (which
// are developer-defined promotion *types*), these are saved snapshots of a
// fully-configured WizardState that operators can re-launch and tweak.
export interface PromotionTemplate {
  id: string;
  name: string;
  description: string;
  basedOnType: string; // links back to TEMPLATE_META (e.g. 'deposit_match')
  market: string; // primary market at save time (e.g. 'KE'); '' = market-agnostic
  payload: WizardState; // the saved wizard configuration
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'saved_templates';

interface TemplatesContextType {
  templates: PromotionTemplate[];
  saveTemplate: (input: {
    name: string;
    description?: string;
    basedOnType: string;
    market?: string;
    payload: WizardState;
  }) => PromotionTemplate;
  updateTemplate: (id: string, patch: Partial<Omit<PromotionTemplate, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => PromotionTemplate | undefined;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

function readFromStorage(): PromotionTemplate[] {
  if (typeof window === 'undefined') return [];
  let stored: PromotionTemplate[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    stored = raw ? (JSON.parse(raw) as PromotionTemplate[]) : [];
  } catch {
    stored = [];
  }
  // Merge in the built-in seed templates so the Templates page is populated on
  // first load. User-saved templates take precedence over a seed with the same id.
  const storedIds = new Set(stored.map((t) => t.id));
  const missingSeeds = SEED_TEMPLATES.filter((s) => !storedIds.has(s.id));
  return [...stored, ...missingSeeds];
}

export function TemplatesProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<PromotionTemplate[]>([]);

  // Hydrate from localStorage on mount (client-only to avoid SSR mismatch).
  useEffect(() => {
    setTemplates(readFromStorage());
    const sync = () => setTemplates(readFromStorage());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const persist = (next: PromotionTemplate[]) => {
    setTemplates(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to persist templates:', err);
    }
  };

  const saveTemplate: TemplatesContextType['saveTemplate'] = (input) => {
    const now = new Date().toISOString();
    const template: PromotionTemplate = {
      id: `tpl_${Date.now()}`,
      name: input.name.trim(),
      description: (input.description || '').trim(),
      basedOnType: input.basedOnType,
      market: (input.market || '').toUpperCase(),
      payload: input.payload,
      createdAt: now,
      updatedAt: now,
    };
    persist([template, ...templates]);
    return template;
  };

  const updateTemplate: TemplatesContextType['updateTemplate'] = (id, patch) => {
    persist(
      templates.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      ),
    );
  };

  const deleteTemplate: TemplatesContextType['deleteTemplate'] = (id) => {
    persist(templates.filter((t) => t.id !== id));
  };

  const getTemplate: TemplatesContextType['getTemplate'] = (id) =>
    templates.find((t) => t.id === id);

  return (
    <TemplatesContext.Provider
      value={{ templates, saveTemplate, updateTemplate, deleteTemplate, getTemplate }}
    >
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const ctx = useContext(TemplatesContext);
  if (ctx === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return ctx;
}
