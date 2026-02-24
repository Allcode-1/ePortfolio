export interface SearchEntry {
  label: string;
  path: string;
  keywords: string[];
}

export const searchIndex: SearchEntry[] = [
  {
    label: 'Info / About',
    path: '/info',
    keywords: ['info', 'about', 'about project', 'инфо', 'о проекте', 'информация'],
  },
  {
    label: 'Dashboard / Profile',
    path: '/dashboard',
    keywords: ['dashboard', 'profile', 'профиль', 'дашборд', 'главная'],
  },
  {
    label: 'Certificates',
    path: '/certificates',
    keywords: ['certificate', 'certificates', 'сертификат', 'сертификаты', 'диплом'],
  },
  {
    label: 'CV Builder',
    path: '/cv-builder',
    keywords: ['cv', 'resume', 'cv builder', 'резюме', 'сиви'],
  },
  {
    label: 'Projects',
    path: '/projects',
    keywords: ['project', 'projects', 'проект', 'проекты', 'github'],
  },
  {
    label: 'Statistics',
    path: '/statistics',
    keywords: ['statistics', 'analytics', 'stats', 'статистика', 'аналитика', 'дашборд'],
  },
  {
    label: 'Public Preview',
    path: '/dashboard',
    keywords: ['public', 'share link', 'preview', 'публичный', 'паблик', 'ссылка'],
  },
  {
    label: 'Settings',
    path: '/settings',
    keywords: ['settings', 'privacy', 'theme', 'настройки', 'тема', 'приватность'],
  },
];
