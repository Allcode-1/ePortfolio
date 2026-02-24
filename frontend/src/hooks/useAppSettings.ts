import { useContext } from 'react';
import { AppSettingsContext } from '../context/AppSettingsState';

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider');
  }

  return context;
};
