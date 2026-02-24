import type { AppLanguage } from '../types/appSettings';

type Dictionary = Record<string, string>;

const ru: Dictionary = {
  'app.title': 'ePortfolio',
  'common.loading': 'Загрузка...',
  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.delete': 'Удалить',
  'common.back': 'Назад',
  'common.details': 'Детали',
  'common.search': 'Поиск',
  'common.filters': 'Фильтры',
  'common.logout': 'Выйти',
  'common.language': 'Язык',
  'common.russian': 'Русский',
  'common.english': 'English',

  'layout.welcome': 'С возвращением, {{name}}',
  'layout.subtitle.dashboard': 'Управляй профилем, сертификатами, CV и проектами в одном рабочем пространстве.',
  'layout.title.info': 'О проекте ePortfolio',
  'layout.subtitle.info': 'Описание проекта, стек и точка входа в профиль.',
  'layout.title.certificates': 'Сертификаты',
  'layout.title.cv': 'Конструктор CV',
  'layout.title.projects': 'Проекты',
  'layout.title.statistics': 'Статистика',
  'layout.title.settings': 'Настройки',
  'layout.title.workspace': 'Рабочая зона',
  'layout.subtitle.default': 'Используй этот раздел, чтобы поддерживать портфолио в актуальном состоянии.',
  'layout.subtitle.statistics': 'Просмотры профиля, клики по ссылкам и активность портфолио.',

  'navbar.searchPlaceholder': '/поиск',
  'navbar.notifications': 'Уведомления',
  'navbar.markAllRead': 'Прочитать все',
  'navbar.noNotifications': 'Пока уведомлений нет',
  'navbar.aiInsights': 'AI Помощник',
  'navbar.aiHint': 'Используй AI-кнопки в формах CV, проектов и сертификатов для улучшения текста.',
  'navbar.account': 'Аккаунт',

  'settings.title': 'Настройки приложения',
  'settings.language.title': 'Язык интерфейса',
  'settings.language.description': 'Выбор применяется сразу и сохраняется автоматически.',
  'settings.theme.changed': 'Тема обновлена.',

  'notifications.welcome.title': 'Добро пожаловать в ePortfolio',
  'ai.improve': 'Улучшить через AI',
  'ai.improving': 'AI улучшает...',
  'ai.applied': 'AI-текст применен.',
  'ai.failed': 'Не удалось получить ответ AI.',

  'certificates.add': 'Добавить сертификат',
  'certificates.addBack': 'Назад к карточкам',
  'certificates.empty': 'Нет сертификатов по текущим фильтрам.',
  'certificates.openFile': 'Открыть файл',
  'certificates.createSuccess': 'Сертификат добавлен.',

  'projects.add': 'Добавить проект',
  'projects.back': 'Назад к карточкам',
  'projects.createSuccess': 'Проект добавлен.',

  'cv.saveSuccess': 'CV сохранено и синхронизировано с backend.',
  'cv.create': 'Создать CV',
  'cv.edit': 'Редактировать CV',
  'cv.back': 'Назад к карточкам',
  'cv.saving': 'Сохранение CV...',
  'cv.save': 'Сохранить CV',
};

const en: Dictionary = {
  'app.title': 'ePortfolio',
  'common.loading': 'Loading...',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.back': 'Back',
  'common.details': 'Details',
  'common.search': 'Search',
  'common.filters': 'Filters',
  'common.logout': 'Logout',
  'common.language': 'Language',
  'common.russian': 'Русский',
  'common.english': 'English',

  'layout.welcome': 'Welcome back, {{name}}',
  'layout.subtitle.dashboard': 'Manage your profile, certificates, CV and projects from one workspace.',
  'layout.title.info': 'About ePortfolio',
  'layout.subtitle.info': 'Project overview, stack and entry point to your profile.',
  'layout.title.certificates': 'Certificates',
  'layout.title.cv': 'CV Builder',
  'layout.title.projects': 'Projects',
  'layout.title.statistics': 'Statistics',
  'layout.title.settings': 'Settings',
  'layout.title.workspace': 'Workspace',
  'layout.subtitle.default': 'Use this section to keep your portfolio up to date.',
  'layout.subtitle.statistics': 'Track profile views, share clicks and portfolio activity trends.',

  'navbar.searchPlaceholder': '/search',
  'navbar.notifications': 'Notifications',
  'navbar.markAllRead': 'Mark all as read',
  'navbar.noNotifications': 'No notifications yet',
  'navbar.aiInsights': 'AI Insights',
  'navbar.aiHint': 'Use AI buttons in CV, projects and certificates forms to improve text.',
  'navbar.account': 'Account',

  'settings.title': 'Application Settings',
  'settings.language.title': 'Interface Language',
  'settings.language.description': 'The choice is applied instantly and saved automatically.',
  'settings.theme.changed': 'Theme updated.',

  'notifications.welcome.title': 'Welcome to ePortfolio',
  'ai.improve': 'Improve with AI',
  'ai.improving': 'AI is improving...',
  'ai.applied': 'AI text applied.',
  'ai.failed': 'Failed to get AI response.',

  'certificates.add': 'Add Certificate',
  'certificates.addBack': 'Back to cards',
  'certificates.empty': 'No certificates for current filters.',
  'certificates.openFile': 'Open file',
  'certificates.createSuccess': 'Certificate added.',

  'projects.add': 'Add Project',
  'projects.back': 'Back to cards',
  'projects.createSuccess': 'Project added.',

  'cv.saveSuccess': 'CV saved and synced to backend.',
  'cv.create': 'Create CV',
  'cv.edit': 'Edit CV',
  'cv.back': 'Back to cards',
  'cv.saving': 'Saving CV...',
  'cv.save': 'Save CV',
};

export const translations: Record<AppLanguage, Dictionary> = {
  ru,
  en,
};

const interpolate = (value: string, vars?: Record<string, string | number>) => {
  if (!vars) {
    return value;
  }

  return Object.entries(vars).reduce((acc, [key, replacement]) => {
    return acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(replacement));
  }, value);
};

export const translate = (
  language: AppLanguage,
  key: string,
  fallback?: string,
  vars?: Record<string, string | number>,
) => {
  const raw = translations[language][key] ?? translations.en[key] ?? fallback ?? key;
  return interpolate(raw, vars);
};
