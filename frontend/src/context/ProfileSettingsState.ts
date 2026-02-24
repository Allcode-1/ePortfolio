import { createContext } from 'react';
import type { ProfileSettings } from '../types/profileSettings';

export type ProfileSettingsContextValue = {
  settings: ProfileSettings;
  updateSettings: (next: ProfileSettings) => void;
  patchSettings: (partial: Partial<ProfileSettings>) => void;
  resetSettings: () => void;
};

export const ProfileSettingsContext = createContext<ProfileSettingsContextValue | undefined>(
  undefined,
);
