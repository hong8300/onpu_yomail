'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/settings';

const SETTINGS_STORAGE_KEY = 'onpu-app-settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure all properties exist
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          practice: {
            ...DEFAULT_SETTINGS.practice,
            ...parsed.practice
          },
          display: {
            ...DEFAULT_SETTINGS.display,
            ...parsed.display
          }
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: AppSettings) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }, []);

  // Update practice settings
  const updatePracticeSettings = useCallback((updates: Partial<AppSettings['practice']>) => {
    const newSettings = {
      ...settings,
      practice: {
        ...settings.practice,
        ...updates
      }
    };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Update display settings
  const updateDisplaySettings = useCallback((updates: Partial<AppSettings['display']>) => {
    const newSettings = {
      ...settings,
      display: {
        ...settings.display,
        ...updates
      }
    };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  // Export settings as JSON
  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `onpu-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [settings]);

  // Import settings from JSON
  const importSettings = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const importedSettings = JSON.parse(text);
          
          // Validate the imported settings structure
          if (!importedSettings || typeof importedSettings !== 'object') {
            throw new Error('Invalid settings format');
          }
          
          // Merge with defaults to ensure all properties exist
          const validatedSettings: AppSettings = {
            ...DEFAULT_SETTINGS,
            ...importedSettings,
            practice: {
              ...DEFAULT_SETTINGS.practice,
              ...importedSettings.practice
            },
            display: {
              ...DEFAULT_SETTINGS.display,
              ...importedSettings.display
            }
          };
          
          saveSettings(validatedSettings);
          resolve();
        } catch (error) {
          reject(new Error('Failed to import settings: Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [saveSettings]);

  return {
    settings,
    isLoading,
    updatePracticeSettings,
    updateDisplaySettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    saveSettings
  };
}