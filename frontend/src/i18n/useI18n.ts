import { useAppSettings } from '../hooks/useAppSettings';
import { translate } from './translations';

export const useI18n = () => {
  const { settings } = useAppSettings();

  const t = (key: string, fallback?: string, vars?: Record<string, string | number>) => {
    return translate(settings.language, key, fallback, vars);
  };

  return {
    language: settings.language,
    t,
  };
};
