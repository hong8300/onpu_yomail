'use client';

import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings, isLoading } = useSettings();

  useEffect(() => {
    if (isLoading) return;

    const root = window.document.documentElement;
    const { theme } = settings.display;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      // Use user selected theme
      root.classList.add(theme);
    }
  }, [settings.display.theme, isLoading]);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (isLoading || settings.display.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.display.theme, isLoading]);

  return <>{children}</>;
}