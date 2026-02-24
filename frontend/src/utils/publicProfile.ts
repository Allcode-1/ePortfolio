import type { PublicProfileTheme } from '../types/appSettings';

export const getPublicProfileLink = (userId: string, theme: PublicProfileTheme) => {
  const origin = window.location.origin;
  const encodedTheme = encodeURIComponent(theme);
  return `${origin}/public/${userId}?theme=${encodedTheme}`;
};

export const resolvePublicTheme = (value: string | null): PublicProfileTheme => {
  if (value === 'emerald' || value === 'slate' || value === 'sunset' || value === 'indigo') {
    return value;
  }
  return 'indigo';
};
