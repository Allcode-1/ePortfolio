export type ThemeId = 'light' | 'dark' | 'ocean' | 'sunset';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  preview: string;
}

export const themeOptions: ThemeOption[] = [
  { id: 'light', name: 'Light', preview: 'from-slate-100 via-white to-slate-200' },
  { id: 'dark', name: 'Dark', preview: 'from-slate-900 via-slate-800 to-slate-900' },
  { id: 'ocean', name: 'Ocean', preview: 'from-cyan-900 via-sky-700 to-blue-900' },
  { id: 'sunset', name: 'Sunset', preview: 'from-orange-400 via-rose-400 to-fuchsia-500' },
];
