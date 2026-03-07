import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { AppSettingsContext, type AppSettingsContextValue } from './AppSettingsState';
import { defaultAppSettings, type AccountVisibility, type AppSettings } from '../types/appSettings';
import { usersApi } from '../api/users';

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
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.lang = settings.language;
  }, [settings]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) {
      return;
    }

    let active = true;

    const loadRemoteSettings = async () => {
      try {
        const remote = await usersApi.getMySettings(getToken);
        if (!active) {
          return;
        }

        setSettings((prev) => ({ ...prev, accountVisibility: remote.accountVisibility }));
      } catch {
        // keep local fallback if backend settings are temporarily unavailable
      }
    };

    void loadRemoteSettings();

    return () => {
      active = false;
    };
  }, [getToken, isLoaded, isSignedIn, user?.id]);

  const setAccountVisibility = useCallback(async (visibility: AccountVisibility) => {
    if (isSignedIn) {
      await usersApi.updateMySettings(visibility, getToken);
    }

    setSettings((prev) => ({ ...prev, accountVisibility: visibility }));
  }, [getToken, isSignedIn]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      patchSettings: (partial) => setSettings((prev) => ({ ...prev, ...partial })),
      setAccountVisibility,
      resetSettings: () => setSettings(defaultAppSettings),
    }),
    [settings, setAccountVisibility],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};
