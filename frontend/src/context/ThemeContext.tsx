'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ColorMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ColorMode;
   setTheme: (theme: ColorMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const isColorMode = (value: string | null): value is ColorMode =>
  value === 'light' || value === 'dark';

export function ThemeProvider({ children }: { children: ReactNode }) {
const [theme, setThemeState] = useState<ColorMode>('light');


  const applyTheme = (colorMode: ColorMode) => {
    document.documentElement.setAttribute('data-theme', colorMode);
    // Ionix is the only theme family; the attribute is kept static so the
// surviving [data-theme-family='ionix'] CSS selectors keep matching.
document.documentElement.setAttribute('data-theme-family', 'ionix');
  };

  useEffect(() => {
    // Keep legacy color-mode preferences so existing users retain their appearance.
    const savedColorMode = localStorage.getItem('betika-theme') || localStorage.getItem('theme');
const colorMode = isColorMode(savedColorMode) ? savedColorMode : 'light';



    setThemeState(colorMode);
    applyTheme(colorMode);

    localStorage.setItem('betika-theme', colorMode);
  }, []);

  const setTheme = (colorMode: ColorMode) => {
    setThemeState(colorMode);
    applyTheme(colorMode);
    localStorage.setItem('betika-theme', colorMode);
  };



  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};