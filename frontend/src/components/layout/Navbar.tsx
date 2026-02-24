import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { Bell, Sparkles, ChevronDown, CheckCircle2, LoaderCircle, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications';
import logoImg from '../../assets/logo.png';
import { searchIndex } from '../../constants/searchIndex';
import { useI18n } from '../../i18n/useI18n';
import type { NotificationItem } from '../../types/notification';

type NotificationView = NotificationItem & {
  createdLabel: string;
};

const formatNotificationDate = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString();
};

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsNotifLoading(true);
    try {
      const [items, count] = await Promise.all([
        notificationsApi.list(getToken),
        notificationsApi.unreadCount(getToken),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      // do not block navbar interactions if notification API is temporarily unavailable
    } finally {
      setIsNotifLoading(false);
    }
  }, [getToken, user?.id]);

  useEffect(() => {
    void loadNotifications();

    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 20000);

    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const notificationViews = useMemo<NotificationView[]>(() => {
    return notifications.map((item) => ({
      ...item,
      createdLabel: formatNotificationDate(item.createdAt),
    }));
  }, [notifications]);

  const suggestions = searchQuery.trim()
    ? searchIndex
        .filter((entry) => {
          const query = searchQuery.toLowerCase().trim();
          const inLabel = entry.label.toLowerCase().includes(query);
          const inKeywords = entry.keywords.some(
            (keyword) => keyword.toLowerCase().includes(query) || query.includes(keyword.toLowerCase()),
          );
          return inLabel || inKeywords;
        })
        .slice(0, 6)
    : [];

  const openSearchEntry = (path: string) => {
    setSearchQuery('');
    navigate(path);
  };

  const handleMarkRead = async (notificationId: number) => {
    try {
      const updated = await notificationsApi.markRead(notificationId, getToken);
      setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // no-op
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead(getToken);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // no-op
    }
  };

  return (
    <nav className="w-full h-[100px] px-[24px] flex items-center justify-between relative z-[100]">
      <button
        type="button"
        onClick={() => navigate('/info')}
        className="flex items-center h-[50px] surface rounded-[25px] pl-1.5 pr-5 shadow-ios border border-app"
      >
        <div className="w-[40px] h-[40px] rounded-full bg-[#4F46E5] flex items-center justify-center overflow-hidden shrink-0">
          <img src={logoImg} alt="" className="w-6 h-6 object-contain brightness-0 invert" />
        </div>
        <span className="ml-3 text-[14px] font-medium text-main tracking-tight">{t('app.title', 'ePortfolio')}</span>
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 w-[550px] group">
        <input
          type="text"
          placeholder={t('navbar.searchPlaceholder', '/search')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && suggestions[0]) {
              event.preventDefault();
              openSearchEntry(suggestions[0].path);
            }
          }}
          className="w-full h-[50px] surface rounded-[20px] px-6 outline-none text-[14px] text-main shadow-ios border border-app focus:border-app transition-all"
        />
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-muted" size={18} strokeWidth={1.5} />

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[56px] surface border border-app rounded-[20px] shadow-2xl overflow-hidden">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.path}
                type="button"
                onClick={() => openSearchEntry(suggestion.path)}
                className="w-full px-4 py-3 text-left hover:bg-[rgba(148,163,184,0.12)] border-b border-app last:border-b-0"
              >
                <p className="text-[13px] font-medium text-main">{suggestion.label}</p>
                <p className="text-[11px] text-muted mt-0.5">{suggestion.path}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              const next = !showNotif;
              setShowNotif(next);
              setShowAi(false);
              setShowProfile(false);

              if (next) {
                void loadNotifications();
              }
            }}
            className={`w-[50px] h-[50px] flex items-center justify-center rounded-[20px] surface shadow-ios transition-all border border-app ${showNotif ? 'text-[#4F46E5]' : 'text-muted hover:text-main'}`}
          >
            <Bell size={20} strokeWidth={1.5} />
          </button>

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-primary-app text-white text-[10px] font-semibold inline-flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {showNotif && (
            <div className="absolute right-0 mt-3 w-[340px] surface rounded-[24px] shadow-2xl border border-app overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-app surface-soft flex justify-between items-center gap-2">
                <span className="font-medium text-sm text-main">{t('navbar.notifications', 'Notifications')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
                  <button
                    type="button"
                    onClick={() => {
                      void handleMarkAllRead();
                    }}
                    className="text-[11px] text-primary-app hover:underline"
                  >
                    {t('navbar.markAllRead', 'Mark all as read')}
                  </button>
                </div>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {isNotifLoading && (
                  <div className="p-4 flex items-center gap-2 text-h5 text-muted">
                    <LoaderCircle size={14} className="animate-spin" />
                    {t('common.loading', 'Loading...')}
                  </div>
                )}

                {!isNotifLoading && notificationViews.length === 0 && (
                  <div className="p-4 text-h5 text-muted">{t('navbar.noNotifications', 'No notifications yet')}</div>
                )}

                {!isNotifLoading &&
                  notificationViews.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!item.isRead) {
                          void handleMarkRead(item.id);
                        }
                      }}
                      className={`w-full p-4 flex gap-3 text-left border-b border-app last:border-b-0 transition-colors ${
                        item.isRead ? 'hover:bg-[rgba(148,163,184,0.08)]' : 'hover:bg-[rgba(79,70,229,0.08)]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.isRead ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-[#4F46E5]'}`}>
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[13px] font-semibold ${item.isRead ? 'text-muted' : 'text-main'}`}>{item.title}</p>
                        <p className="text-[11px] text-muted leading-snug mt-1">{item.message}</p>
                        <p className="text-[10px] text-muted mt-1">{item.createdLabel}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowAi(!showAi);
              setShowNotif(false);
              setShowProfile(false);
            }}
            className={`w-[50px] h-[50px] flex items-center justify-center rounded-[20px] surface shadow-ios transition-all border border-app ${showAi ? 'text-[#4F46E5]' : 'text-muted hover:text-main'}`}
          >
            <Sparkles size={20} strokeWidth={1.5} />
          </button>

          {showAi && (
            <div className="absolute right-0 mt-3 w-[320px] surface rounded-[24px] shadow-2xl border border-app p-6 text-center animate-in fade-in slide-in-from-top-2">
              <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-medium text-main">{t('navbar.aiInsights', 'AI Insights')}</p>
              <p className="text-[11px] text-muted mt-2 leading-relaxed">
                {t('navbar.aiHint', 'Use AI buttons in CV, projects and certificates forms to improve text.')}
              </p>
            </div>
          )}
        </div>

        <div className="relative ml-2">
          <div
            onClick={() => {
              setShowProfile(!showProfile);
              setShowAi(false);
              setShowNotif(false);
            }}
            className="h-[50px] flex items-center gap-3 surface px-2 pr-5 rounded-[25px] shadow-ios border border-app cursor-pointer active:scale-95 transition-all"
          >
            <div className="w-[36px] h-[36px] rounded-full overflow-hidden surface-soft border border-app">
              <img src={user?.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col max-w-[120px]">
              <span className="text-[12px] font-medium text-main leading-none truncate">
                {user?.fullName || 'User'}
              </span>
              <span className="text-[10px] text-muted leading-none mt-1 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-muted transition-transform duration-300 ${showProfile ? 'rotate-180' : ''}`}
            />
          </div>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-full min-w-[180px] surface rounded-[20px] shadow-2xl border border-app p-1.5 z-[110]">
              <div className="px-3 py-2 border-b border-app mb-1">
                <p className="text-[10px] text-main uppercase tracking-widest">{t('navbar.account', 'Account')}</p>
              </div>
              <button
                onClick={() => {
                  void signOut({ redirectUrl: '/info' });
                }}
                className="w-full text-left px-3 py-2.5 text-[12px] text-red-500 hover:bg-red-50 rounded-[12px] transition-colors flex items-center justify-between"
              >
                {t('common.logout', 'Logout')}
                <ChevronDown size={12} className="-rotate-90 opacity-40" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
