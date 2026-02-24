import { useUser } from '@clerk/clerk-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { AppSettingsProvider } from './context/AppSettingsProvider';
import { ProfileSettingsProvider } from './context/ProfileSettingsContext';
import { ThemeProvider } from './context/ThemeProvider';
import CertificatesPage from './pages/CertificatesPage';
import CvBuilderPage from './pages/CvBuilderPage';
import DashboardPage from './pages/DashboardPage';
import InfoPage from './pages/InfoPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import PublicPortfolioPage from './pages/PublicPortfolioPage';
import SettingsPage from './pages/SettingsPage';
import StatisticsPage from './pages/StatisticsPage';

const App = () => {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-lightGrey">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AppSettingsProvider>
        <ProfileSettingsProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/info" replace />} />
              <Route path="/info" element={<InfoPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/cv-builder" element={<CvBuilderPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/public/:userId" element={<PublicPortfolioPage />} />
            <Route path="*" element={<Navigate to="/info" replace />} />
          </Routes>
        </ProfileSettingsProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
};

export default App;
