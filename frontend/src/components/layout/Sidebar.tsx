import { Sun, Moon, User, Award, FileText, Briefcase, Settings, Info, LogOut } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', icon: User, path: '/dashboard' },
    { id: 'certificates', icon: Award, path: '/certificates' },
    { id: 'cv', icon: FileText, path: '/cv-builder' },
    { id: 'projects', icon: Briefcase, path: '/projects' },
    { id: 'settings', icon: Settings, path: '/settings' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === path;
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-[60px] h-full flex flex-col items-center gap-6 select-none">
      <div className="surface rounded-[24px] p-1.5 shadow-ios border border-app flex flex-col gap-1">
        <button
          onClick={() => setTheme('light')}
          className={`w-10 h-10 flex items-center justify-center rounded-[18px] transition-all 
            ${
              theme === 'light'
                ? 'bg-[#F4F4F4] text-[#111827] shadow-inner'
                : 'text-muted hover:bg-[rgba(148,163,184,0.15)]'
            }`}
        >
          <Sun size={20} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`w-10 h-10 flex items-center justify-center rounded-[18px] transition-all 
            ${
              theme === 'dark'
                ? 'bg-[#111827] text-white shadow-lg'
                : 'text-muted hover:bg-[rgba(148,163,184,0.15)]'
            }`}
        >
          <Moon size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="surface rounded-[24px] p-1.5 shadow-ios border border-app flex flex-col gap-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-10 h-10 flex items-center justify-center rounded-[18px] transition-all
              ${isActivePath(item.path) 
                ? 'bg-primary-app text-white shadow-md shadow-indigo-200' 
                : 'text-muted hover:bg-[rgba(79,70,229,0.10)] hover:text-primary-app'}`}
          >
            <item.icon size={20} strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <div className="surface rounded-[24px] p-1.5 shadow-ios border border-app mb-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => navigate('/info')}
          className="w-10 h-10 flex items-center justify-center rounded-[18px] text-muted hover:bg-[rgba(148,163,184,0.15)] hover:text-main transition-all"
        >
          <Info size={20} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => {
            void signOut({ redirectUrl: '/info' });
          }}
          className="w-10 h-10 flex items-center justify-center rounded-[18px] text-[#EF4444] hover:bg-red-50 transition-all"
        >
          <LogOut size={20} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
