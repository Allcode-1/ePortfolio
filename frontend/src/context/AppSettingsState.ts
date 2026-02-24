import { createContext } from 'react';
import type { AppSettings } from '../types/appSettings';

export type AppSettingsContextValue = {
  settings: AppSettings;
  patchSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
};

export const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);
