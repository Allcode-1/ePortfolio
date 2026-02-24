import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ProfileSettingsContext, type ProfileSettingsContextValue } from './ProfileSettingsState';
import { defaultProfileSettings, type ProfileSettings } from '../types/profileSettings';

const STORAGE_KEY = 'eportfolio.profileSettings.v1';

const getInitialSettings = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultProfileSettings;
    }

    const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
    return {
      ...defaultProfileSettings,
      ...parsed,
    };
  } catch {
    return defaultProfileSettings;
  }
};

export const ProfileSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ProfileSettings>(getInitialSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<ProfileSettingsContextValue>(
    () => ({
      settings,
      updateSettings: setSettings,
      patchSettings: (partial) => setSettings((prev) => ({ ...prev, ...partial })),
      resetSettings: () => setSettings(defaultProfileSettings),
    }),
    [settings],
  );

  return <ProfileSettingsContext.Provider value={value}>{children}</ProfileSettingsContext.Provider>;
};
