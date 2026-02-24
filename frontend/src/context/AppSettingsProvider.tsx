import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { AppSettingsContext, type AppSettingsContextValue } from './AppSettingsState';
import { defaultAppSettings, type AppSettings } from '../types/appSettings';

const STORAGE_KEY = 'eportfolio.appSettings.v1';

const getInitialSettings = (): AppSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultAppSettings;
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaultAppSettings,
      ...parsed,
    };
  } catch {
    return defaultAppSettings;
  }
};

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.lang = settings.language;
  }, [settings]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      patchSettings: (partial) => setSettings((prev) => ({ ...prev, ...partial })),
      resetSettings: () => setSettings(defaultAppSettings),
    }),
    [settings],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};
