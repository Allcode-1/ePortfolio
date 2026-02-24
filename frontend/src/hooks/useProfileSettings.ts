import { useContext } from 'react';
import { ProfileSettingsContext } from '../context/ProfileSettingsState';

export const useProfileSettings = () => {
  const context = useContext(ProfileSettingsContext);

  if (!context) {
    throw new Error('useProfileSettings must be used inside ProfileSettingsProvider');
  }

  return context;
};
