import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useI18n } from '../../i18n/useI18n';

type MainLayoutProps = {
  children?: React.ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useUser();
  const location = useLocation();
  const { t } = useI18n();

  const pathname = location.pathname;
  const isDashboard = pathname === '/dashboard';
  const isProjects = pathname.startsWith('/projects');
  const isCertificates = pathname.startsWith('/certificates');
  const isCvBuilder = pathname.startsWith('/cv-builder');
  const isSettings = pathname.startsWith('/settings');
  const isStatistics = pathname.startsWith('/statistics');

  const title = isDashboard
    ? t('layout.welcome', 'Welcome back, {{name}}', { name: user?.firstName || 'there' })
    : pathname === '/info'
      ? t('layout.title.info', 'About ePortfolio')
      : isCertificates
        ? t('layout.title.certificates', 'Certificates')
        : isCvBuilder
          ? t('layout.title.cv', 'CV Builder')
          : isProjects
            ? t('layout.title.projects', 'Projects')
            : isStatistics
              ? t('layout.title.statistics', 'Statistics')
              : isSettings
                ? t('layout.title.settings', 'Settings')
                : t('layout.title.workspace', 'Workspace');

  const subtitle = isDashboard
    ? t('layout.subtitle.dashboard', 'Manage your profile, certificates, CV and projects from one workspace.')
    : pathname === '/info'
      ? t('layout.subtitle.info', 'Project overview, creator details and entry point to your profile.')
      : isStatistics
        ? t('layout.subtitle.statistics', 'Track profile views, share clicks and portfolio activity trends.')
      : t('layout.subtitle.default', 'Use this section to keep your portfolio up to date.');

  return (
    <div className="h-screen app-bg flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-6"> 
        
        <Sidebar />
        
        <section className="flex-1 min-h-0 flex flex-col">
          <header className="shrink-0 px-2 pb-6">
            <h1 className="text-[32px] leading-[40px] font-bold text-main">{title}</h1>
            <p className="text-[16px] leading-[24px] font-normal text-muted mt-2">
              {subtitle}
            </p>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children || <Outlet />}
          </main>
        </section>
      </div>
    </div>
  );
};

export default MainLayout;
