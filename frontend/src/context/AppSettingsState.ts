import { createContext } from 'react';
import type { AccountVisibility, AppSettings } from '../types/appSettings';

export type AppSettingsContextValue = {
  settings: AppSettings;
  patchSettings: (partial: Partial<AppSettings>) => void;
  setAccountVisibility: (visibility: AccountVisibility) => Promise<void>;
  resetSettings: () => void;
};

export const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);
