import { useState } from 'react';
import { Search, Bell, Sparkles, ChevronDown, Mail, CheckCircle2, Star } from 'lucide-react';
import { useUser, useClerk } from "@clerk/clerk-react";
import logoImg from '../../assets/logo.png'; 

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showNotif, setShowNotif] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <nav className="w-full h-[100px] px-[24px] flex items-center justify-between relative z-[100]">
      
      {/* logo */}
      <div className="flex items-center h-[50px] bg-white rounded-[25px] pl-1.5 pr-5 shadow-ios border border-white">
        <div className="w-[40px] h-[40px] rounded-full bg-[#4F46E5] flex items-center justify-center overflow-hidden shrink-0">
          <img src={logoImg} alt="" className="w-6 h-6 object-contain brightness-0 invert" />
        </div>
        <span className="ml-3 text-[14px] font-medium text-slate-800 tracking-tight">ePortfolio</span>
      </div>

      {/* searchbar */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[550px] group">
        <input 
          type="text"
          placeholder="/search"
          className="w-full h-[50px] bg-white rounded-[20px] px-6 outline-none text-[14px] font-regular text-slate-600 shadow-ios border border-transparent focus:border-slate-300 transition-all"
        />
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={1.5} />
      </div>

      {/* 3. buttons and pfp */}
      <div className="flex items-center gap-3">
        
        {/* norifs button */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotif(!showNotif); setShowAi(false); setShowProfile(false); }}
            className={`w-[50px] h-[50px] flex items-center justify-center rounded-[20px] bg-white shadow-ios transition-all border border-transparent ${showNotif ? 'text-[#4F46E5] border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Bell size={20} strokeWidth={1.5} />
          </button>
          
          {showNotif && (
            <div className="absolute right-0 mt-3 w-[320px] bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <span className="font-medium text-sm text-slate-800">Notifications</span>
                <span className="text-[10px] font-regular bg-slate-500 text-white px-2 py-0.5 rounded-full">1 Notifications</span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {/* notif 1 */}
                <div className="p-4 flex gap-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#4F46E5] shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">System Ready</p>
                    <p className="text-[11px] font-regular text-slate-600 leading-snug">Your accaunt has been successfully synchronized with Clerk Auth.</p>
                    <p className="text-[9px] font-light text-slate-500 mt-1">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ai button */}
        <div className="relative">
          <button 
            onClick={() => { setShowAi(!showAi); setShowNotif(false); setShowProfile(false); }}
            className={`w-[50px] h-[50px] flex items-center justify-center rounded-[20px] bg-white shadow-ios transition-all border border-transparent ${showAi ? 'text-[#4F46E5] border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Sparkles size={20} strokeWidth={1.5} />
          </button>

          {showAi && (
            <div className="absolute right-0 mt-3 w-[320px] bg-white rounded-[24px] shadow-2xl border border-slate-100 p-6 text-center animate-in fade-in slide-in-from-top-2">
              <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-medium text-slate-800">AI Insights</p>
              <p className="text-[11px] font-regular text-slate-600 mt-2 leading-relaxed">
                We're developing an algorithm for analyzing your competencies. Smart tips will appear here soon.
              </p>
            </div>
          )}
        </div>

        {/* userbutton */}
        <div className="relative ml-2">
          <div 
            onClick={() => { setShowProfile(!showProfile); setShowAi(false); setShowNotif(false); }}
            className="h-[50px] flex items-center gap-3 bg-white px-2 pr-5 rounded-[25px] shadow-ios border border-white cursor-pointer active:scale-95 transition-all"
          >
            <div className="w-[36px] h-[36px] rounded-full overflow-hidden bg-slate-100 border border-slate-50">
              <img src={user?.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col max-w-[120px]">
              <span className="text-[12px] font-medium text-slate-800 leading-none truncate">
                {user?.fullName || "User Name"}
              </span>
              <span className="text-[10px] text-slate-400 font-regular leading-none mt-1 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showProfile ? 'rotate-180' : ''}`} />
          </div>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-full min-w-[180px] bg-white rounded-[20px] shadow-2xl border border-slate-100 p-1.5 z-[110]">
              <div className="px-3 py-2 border-b border-slate-50 mb-1">
                <p className="text-[10px] font-regular text-slate-700 uppercase tracking-widest">Account</p>
              </div>
              <button 
                onClick={() => signOut()}
                className="w-full text-left px-3 py-2.5 text-[12px] font-regular text-red-500 hover:bg-red-50 rounded-[12px] transition-colors flex items-center justify-between"
              >
                Logout
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