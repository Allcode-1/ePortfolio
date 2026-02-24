import { useUser } from '@clerk/clerk-react';
import { ArrowUpRight, BarChart3, Eye, FileDown, Link2, MonitorPlay, NotebookTabs } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCertificates } from '../hooks/useCertificates';
import { useCvDocuments } from '../hooks/useCvDocuments';
import { useProjects } from '../hooks/useProjects';
import { readAnalytics } from '../utils/analytics';
import { getPublicProfileLink } from '../utils/publicProfile';
import { useAppSettings } from '../hooks/useAppSettings';

const buildRecentMonths = (count: number) => {
  const now = new Date();
  return Array.from({ length: count }).map((_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
    };
  });
};

const StatisticsPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { settings } = useAppSettings();
  const { certificates } = useCertificates();
  const { projects } = useProjects();
  const { documents } = useCvDocuments();

  const analytics = user?.id ? readAnalytics(user.id) : null;

  const chartData = useMemo(() => {
    if (!analytics) {
      return [];
    }
    const months = buildRecentMonths(6);
    const max = Math.max(...months.map((month) => analytics.monthlyActivity[month.key] ?? 0), 1);
    return months.map((month) => {
      const value = analytics.monthlyActivity[month.key] ?? 0;
      return {
        ...month,
        value,
        height: Math.max((value / max) * 100, value > 0 ? 12 : 6),
      };
    });
  }, [analytics]);

  const cards = [
    {
      title: 'Public views',
      value: analytics?.publicViews ?? 0,
      icon: Eye,
    },
    {
      title: 'Shared links',
      value: analytics?.shareClicks ?? 0,
      icon: Link2,
    },
    {
      title: 'Project detail opens',
      value: analytics?.projectDetailViews ?? 0,
      icon: NotebookTabs,
    },
    {
      title: 'Certificate opens',
      value: analytics?.certificateFileOpens ?? 0,
      icon: MonitorPlay,
    },
    {
      title: 'CV downloads',
      value: analytics?.cvDownloads ?? 0,
      icon: FileDown,
    },
    {
      title: 'Portfolio units',
      value: certificates.length + projects.length + documents.length,
      icon: BarChart3,
    },
  ];

  const badges = [
    {
      id: 'cert-collector',
      title: 'Certificate Collector',
      description: 'Add 3+ certificates',
      unlocked: certificates.length >= 3,
    },
    {
      id: 'project-builder',
      title: 'Project Builder',
      description: 'Publish 3+ projects',
      unlocked: projects.length >= 3,
    },
    {
      id: 'cv-architect',
      title: 'CV Architect',
      description: 'Create 2+ CV versions',
      unlocked: documents.length >= 2,
    },
    {
      id: 'public-voice',
      title: 'Public Voice',
      description: 'Get 10+ public views',
      unlocked: (analytics?.publicViews ?? 0) >= 10,
    },
    {
      id: 'link-sharer',
      title: 'Link Sharer',
      description: 'Copy public link 3+ times',
      unlocked: (analytics?.shareClicks ?? 0) >= 3,
    },
    {
      id: 'detail-explorer',
      title: 'Detail Explorer',
      description: 'Open project detail 5+ times',
      unlocked: (analytics?.projectDetailViews ?? 0) >= 5,
    },
  ];

  const publicLink = user?.id ? getPublicProfileLink(user.id, settings.publicProfileTheme) : '';

  return (
    <div className="max-w-[1450px] mx-auto px-2 pb-8">
      <section className="surface rounded-soft border border-app shadow-app p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-h2 text-main">Profile Statistics</h2>
            <p className="text-h3 text-muted mt-2">
              Activity dashboard for public profile and portfolio interactions.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="h-[40px] px-4 rounded-[12px] border border-app surface-soft text-h5 text-main"
            >
              Back to profile
            </button>
            <button
              type="button"
              onClick={() => window.open(publicLink, '_blank', 'noreferrer')}
              className="h-[40px] px-4 rounded-[12px] bg-primary-app text-white text-h5 inline-flex items-center gap-1"
            >
              Open public page
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {cards.map((card) => (
            <article key={card.title} className="surface-soft rounded-soft border border-app p-4 shadow-soft">
              <div
                className="w-9 h-9 rounded-[12px] text-primary-app inline-flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--primary) 16%, transparent)' }}
              >
                <card.icon size={18} />
              </div>
              <p className="text-[34px] leading-[40px] font-bold text-main mt-3">{card.value}</p>
              <p className="text-h5 text-muted">{card.title}</p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mt-6">
          <section className="xl:col-span-3 surface-soft rounded-soft border border-app p-5">
            <h3 className="text-h4 text-main">Activity (last 6 months)</h3>
            <div className="mt-5 h-[210px] flex items-end gap-4">
              {chartData.map((item) => (
                <div key={item.key} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full max-w-[58px] rounded-t-[14px] bg-primary-app"
                    style={{ height: `${item.height}%` }}
                    title={`${item.label}: ${item.value}`}
                  />
                  <p className="text-[11px] text-muted mt-2">{item.label}</p>
                  <p className="text-[11px] text-main">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="xl:col-span-2 surface-soft rounded-soft border border-app p-5">
            <h3 className="text-h4 text-main">Content Coverage</h3>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-h5">
                  <span className="text-muted">Certificates</span>
                  <span className="text-main">{certificates.length}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-200/60 overflow-hidden">
                  <div className="h-full bg-primary-app" style={{ width: `${Math.min(certificates.length * 12, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-h5">
                  <span className="text-muted">CV Versions</span>
                  <span className="text-main">{documents.length}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-200/60 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(documents.length * 20, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-h5">
                  <span className="text-muted">Projects</span>
                  <span className="text-main">{projects.length}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-200/60 overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${Math.min(projects.length * 16, 100)}%` }} />
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-soft border border-app surface-soft p-5">
          <h3 className="text-h4 text-main">Achievement Badges</h3>
          <p className="text-h5 text-muted mt-1">Unlock badges by filling portfolio and increasing profile activity.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
            {badges.map((badge) => (
              <article
                key={badge.id}
                className={`rounded-tile border p-4 ${
                  badge.unlocked ? 'border-emerald-300 bg-emerald-50' : 'border-app surface'
                }`}
              >
                <p className={`text-h4 ${badge.unlocked ? 'text-emerald-700' : 'text-main'}`}>{badge.title}</p>
                <p className="text-h5 text-muted mt-1">{badge.description}</p>
                <p className={`text-[12px] mt-2 ${badge.unlocked ? 'text-emerald-600' : 'text-muted'}`}>
                  {badge.unlocked ? 'Unlocked' : 'Locked'}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
};

export default StatisticsPage;
