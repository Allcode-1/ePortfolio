import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { Bell, Copy, Globe2, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { themeOptions } from '../types/theme';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTheme } from '../hooks/useTheme';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import type { PublicProfileTheme } from '../types/appSettings';
import { getPublicProfileLink } from '../utils/publicProfile';
import { bumpAnalytics } from '../utils/analytics';
import { useI18n } from '../i18n/useI18n';

const profileThemeOptions: Array<{ id: PublicProfileTheme; label: string; preview: string }> = [
  { id: 'indigo', label: 'Indigo', preview: 'from-indigo-500 to-violet-500' },
  { id: 'emerald', label: 'Emerald', preview: 'from-emerald-500 to-teal-500' },
  { id: 'slate', label: 'Slate', preview: 'from-slate-600 to-slate-800' },
  { id: 'sunset', label: 'Sunset', preview: 'from-orange-500 to-rose-500' },
];

const SettingsPage = () => {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings, patchSettings } = useAppSettings();
  const { t, language } = useI18n();

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkState, setLinkState] = useState<string | null>(null);

  const publicLink = user?.id ? getPublicProfileLink(user.id, settings.publicProfileTheme) : '';

  const handleDeleteAccount = async () => {
    setError(null);
    setStatus(null);
    setIsDeleting(true);

    try {
      await usersApi.deleteMe(getToken);
      setStatus('Account was deleted from backend. Signing out...');
      await signOut({ redirectUrl: '/info' });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to delete account.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-2 pb-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 surface rounded-soft border border-app shadow-app p-6">
          <h2 className="text-h2 text-main">{t('settings.title', 'Application Settings')}</h2>
          <p className="text-h3 text-muted mt-2">
            Profile fields were moved to Dashboard. Settings now control app behavior and account options.
          </p>

          <div className="mt-7 surface-soft rounded-soft border border-app p-4">
            <h3 className="text-h4 text-main">Theme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTheme(option.id);
                    setStatus(t('settings.theme.changed', 'Theme updated.'));
                  }}
                  className={`rounded-[16px] border p-3 text-left transition shadow-soft ${
                    theme === option.id ? 'border-primary-app surface' : 'border-app surface'
                  }`}
                >
                  <div className={`h-16 rounded-[12px] bg-gradient-to-r ${option.preview}`} />
                  <p className="text-h5 text-main mt-2">{option.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 surface-soft rounded-soft border border-app p-4">
            <h3 className="text-h4 text-main inline-flex items-center gap-2">
              <Globe2 size={16} />
              {t('settings.language.title', 'Interface Language')}
            </h3>
            <p className="text-h5 text-muted mt-1">
              {t('settings.language.description', 'The choice is applied instantly and saved automatically.')}
            </p>
            <div className="mt-4 inline-flex rounded-[12px] border border-app overflow-hidden">
              <button
                type="button"
                onClick={() => patchSettings({ language: 'ru' })}
                className={`h-[38px] px-4 text-h5 transition ${language === 'ru' ? 'bg-primary-app text-white' : 'surface text-main'}`}
              >
                {t('common.russian', 'Русский')}
              </button>
              <button
                type="button"
                onClick={() => patchSettings({ language: 'en' })}
                className={`h-[38px] px-4 text-h5 transition ${language === 'en' ? 'bg-primary-app text-white' : 'surface text-main'}`}
              >
                {t('common.english', 'English')}
              </button>
            </div>
          </div>

          <div className="mt-5 surface-soft rounded-soft border border-app p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-h4 text-main">Public Profile</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate('/statistics')}
                  className="h-[36px] px-3 rounded-[10px] border border-app surface text-[12px] text-main"
                >
                  See statistics
                </button>
                <button
                  type="button"
                  disabled={!user?.id}
                  onClick={() => window.open(publicLink, '_blank', 'noreferrer')}
                  className="h-[36px] px-3 rounded-[10px] border border-app surface text-[12px] text-main disabled:opacity-50"
                >
                  Public preview
                </button>
                <button
                  type="button"
                  disabled={!user?.id}
                  onClick={() => {
                    if (!user?.id) {
                      return;
                    }
                    void navigator.clipboard.writeText(publicLink);
                    bumpAnalytics(user.id, 'shareClicks');
                    setLinkState('Public link copied');
                    window.setTimeout(() => setLinkState(null), 1600);
                  }}
                  className="h-[36px] px-3 rounded-[10px] border border-app surface text-[12px] text-main inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <Copy size={12} />
                  Copy link
                </button>
              </div>
            </div>
            {linkState && <p className="text-[12px] text-emerald-600 mt-2">{linkState}</p>}
            <p className="text-h5 text-muted mt-2">Customize how your shared public profile looks.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {profileThemeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    patchSettings({ publicProfileTheme: option.id });
                    setStatus(`Public profile theme changed to ${option.label}.`);
                  }}
                  className={`rounded-[16px] border p-3 text-left transition shadow-soft ${
                    settings.publicProfileTheme === option.id ? 'border-primary-app surface' : 'border-app surface'
                  }`}
                >
                  <div className={`h-14 rounded-[12px] bg-gradient-to-r ${option.preview}`} />
                  <p className="text-h5 text-main mt-2">{option.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 surface-soft rounded-soft border border-app p-4">
            <h3 className="text-h4 text-main inline-flex items-center gap-1">
              <ShieldCheck size={16} />
              Privacy
            </h3>
            <div className="space-y-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  patchSettings({ accountVisibility: 'private' });
                  setStatus('Visibility changed to Private.');
                }}
                className={`w-full rounded-[14px] border px-4 py-3 text-left surface ${
                  settings.accountVisibility === 'private' ? 'border-primary-app' : 'border-app'
                }`}
              >
                <p className="text-h4 text-main">Private profile</p>
                <p className="text-h5 text-muted mt-1">Only you can access your profile details.</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  patchSettings({ accountVisibility: 'public' });
                  setStatus('Visibility changed to Public.');
                }}
                className={`w-full rounded-[14px] border px-4 py-3 text-left surface ${
                  settings.accountVisibility === 'public' ? 'border-primary-app' : 'border-app'
                }`}
              >
                <p className="text-h4 text-main">Public profile</p>
                <p className="text-h5 text-muted mt-1">Profile can be viewed by others using your link.</p>
              </button>
            </div>
          </div>

          <div className="mt-5 surface-soft rounded-soft border border-app p-4">
            <h3 className="text-h4 text-main inline-flex items-center gap-1">
              <Bell size={16} />
              Notifications
            </h3>
            <label className="mt-3 inline-flex items-center gap-2 text-h5 text-main">
              <input
                type="checkbox"
                className="accent-[var(--primary)]"
                checked={settings.emailNotifications}
                onChange={(event) => {
                  patchSettings({ emailNotifications: event.target.checked });
                  setStatus(
                    event.target.checked
                      ? 'Notifications are enabled.'
                      : 'Notifications are disabled.',
                  );
                }}
              />
              Receive updates and product notifications
            </label>
          </div>

          <div className="mt-6 rounded-soft border border-red-200 bg-red-50 p-4">
            <p className="text-h4 text-red-600">Danger zone</p>
            <p className="text-h5 text-red-500 mt-1">
              Deleting account removes your backend data (projects, CV and certificates).
            </p>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                void handleDeleteAccount();
              }}
              className="mt-3 h-[42px] px-4 rounded-[12px] bg-red-500 text-white text-h5 inline-flex items-center gap-2 disabled:opacity-70"
            >
              <Trash2 size={15} />
              {isDeleting ? 'Deleting...' : 'Delete account'}
            </button>
          </div>

          {status && <p className="text-h5 text-green-600 mt-4">{status}</p>}
          {error && <p className="text-h5 text-red-500 mt-2">{error}</p>}
        </section>

        <aside className="xl:col-span-1 surface rounded-soft border border-app shadow-app p-6 h-fit">
          <h3 className="text-h4 text-main">Quick Notes</h3>
          <ul className="mt-4 space-y-2 text-h5 text-muted">
            <li>Theme is applied instantly.</li>
            <li>Privacy and notifications are saved automatically.</li>
            <li>Profile editing lives on Dashboard in the Edit modal.</li>
            <li>Use Public preview to verify your shared link style.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default SettingsPage;
