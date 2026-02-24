import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeState';
import type { ThemeId } from '../types/theme';

const STORAGE_KEY = 'eportfolio.theme.v1';

const getInitialTheme = (): ThemeId => {
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeId | null;

  if (stored === 'light' || stored === 'dark' || stored === 'ocean' || stored === 'sunset') {
    return stored;
  }

  return 'light';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
