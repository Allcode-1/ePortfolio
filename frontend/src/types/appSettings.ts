export type AccountVisibility = 'private' | 'public';
export type PublicProfileTheme = 'indigo' | 'emerald' | 'slate' | 'sunset';
export type AppLanguage = 'ru' | 'en';

export interface AppSettings {
  accountVisibility: AccountVisibility;
  emailNotifications: boolean;
  publicProfileTheme: PublicProfileTheme;
  language: AppLanguage;
}

export const defaultAppSettings: AppSettings = {
  accountVisibility: 'private',
  emailNotifications: true,
  publicProfileTheme: 'indigo',
  language: 'ru',
};
