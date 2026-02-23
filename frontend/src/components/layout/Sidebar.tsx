import { useState } from 'react';
import { Sun, Moon, User, Award, FileText, Briefcase, Info, LogOut } from 'lucide-react';

const Sidebar = () => {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const menuItems = [
    { id: 'profile', icon: User },
    { id: 'certs', icon: Award },
    { id: 'cv', icon: FileText },
    { id: 'projects', icon: Briefcase },
  ];

  return (
    <aside className="w-[60px] h-full flex flex-col items-center gap-6 select-none">
      
      {/* theme changer */}
      <div className="bg-white rounded-[24px] p-1.5 shadow-ios border border-white flex flex-col gap-1">
        <button 
          onClick={() => setIsDark(false)}
          className={`w-10 h-10 flex items-center justify-center rounded-[18px] transition-all 
            ${!isDark ? 'bg-[#F4F4F4] text-[#111827] shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Sun size={20} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => setIsDark(true)}
          className={`w-10 h-10 flex items-center justify-center rounded-[18px] transition-all 
            ${isDark ? 'bg-[#111827] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Moon size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* navigation changer */}
      <div className="bg-white rounded-[24px] p-1.5 shadow-ios border border-white flex flex-col gap-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-[18px] transition-all
              ${activeTab === item.id 
                ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-200' 
                : 'text-slate-400 hover:bg-indigo-50 hover:text-[#4F46E5]'}`}
          >
            <item.icon size={20} strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <div className="flex-1"></div>

      {/* others */}
      <div className="bg-white rounded-[24px] p-1.5 shadow-ios border border-white mb-2 flex flex-col gap-1">
        <button className="w-10 h-10 flex items-center justify-center rounded-[18px] text-slate-400 hover:bg-slate-50 hover:text-[#111827] transition-all">
          <Info size={20} strokeWidth={1.5} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-[18px] text-[#EF4444] hover:bg-red-50 transition-all">
          <LogOut size={20} strokeWidth={1.5} />
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;