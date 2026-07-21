'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ColorMode = 'light' | 'dark';
export type ThemeFamily = 'default' | 'ionix';

interface ThemeContextType {
  theme: ColorMode;
  themeFamily: ThemeFamily;
  setTheme: (theme: ColorMode) => void;
  setThemeFamily: (themeFamily: ThemeFamily) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const isColorMode = (value: string | null): value is ColorMode =>
  value === 'light' || value === 'dark';

const isThemeFamily = (value: string | null): value is ThemeFamily =>
  value === 'default' || value === 'ionix';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ColorMode>('dark');
  const [themeFamily, setThemeFamilyState] = useState<ThemeFamily>('default');

  const applyTheme = (colorMode: ColorMode, family: ThemeFamily) => {
    document.documentElement.setAttribute('data-theme', colorMode);
    document.documentElement.setAttribute('data-theme-family', family);
  };

  useEffect(() => {
    // Keep legacy color-mode preferences so existing users retain their appearance.
    const savedColorMode = localStorage.getItem('betika-theme') || localStorage.getItem('theme');
    const colorMode = isColorMode(savedColorMode) ? savedColorMode : 'dark';
    const savedThemeFamily = localStorage.getItem('betika-theme-family');
    const family = isThemeFamily(savedThemeFamily) ? savedThemeFamily : 'default';

    setThemeState(colorMode);
    setThemeFamilyState(family);
    applyTheme(colorMode, family);

    localStorage.setItem('betika-theme', colorMode);
    localStorage.setItem('betika-theme-family', family);
  }, []);

  const setTheme = (colorMode: ColorMode) => {
    setThemeState(colorMode);
    applyTheme(colorMode, themeFamily);
    localStorage.setItem('betika-theme', colorMode);
  };

  const setThemeFamily = (family: ThemeFamily) => {
    setThemeFamilyState(family);
    applyTheme(theme, family);
    localStorage.setItem('betika-theme-family', family);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, themeFamily, setTheme, setThemeFamily, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};