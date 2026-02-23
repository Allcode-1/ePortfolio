import MainLayout from './components/layout/MainLayout';
import { useUser } from "@clerk/clerk-react";

function App() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4F4F4]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5E5ADB]"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto transition-all">
        <header className="mb-10 px-2">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.firstName || "Guest"}!
          </h1>
          <p className="text-slate-500 mt-3 text-xl">
            There is a dashboard, your documents and CV's collected. Have a nice day!
          </p>
        </header>
        
        <div className="grid grid-cols-12 gap-8 px-2">
          {/* Левая верхняя карточка */}
          <div className="col-span-12 lg:col-span-4 h-[350px] bg-white rounded-[40px] shadow-sm border border-slate-100 p-10 hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-bold text-slate-800">Certificates</h3>
            <p className="text-6xl font-black mt-6 text-[#5E5ADB]">12</p>
            <p className="text-slate-400 mt-2 font-medium">Total uploaded</p>
          </div>
          
          {/* Правая верхняя */}
          <div className="col-span-12 lg:col-span-8 h-[350px] bg-white rounded-[40px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-8 border-b border-slate-50">
               <h3 className="text-2xl font-bold text-slate-800">Activity Overview</h3>
            </div>
            <div className="flex items-center justify-center h-full bg-slate-50/30">
               <span className="text-slate-300 font-medium">No activity data yet</span>
            </div>
          </div>
          
          {/* Нижняя широкая */}
          <div className="col-span-12 h-[450px] bg-white rounded-[40px] shadow-sm border border-slate-100 p-10 hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-bold mb-8 text-slate-800">Recent CV's</h3>
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-100 rounded-[30px] bg-slate-50/20">
              <p className="text-slate-400 italic text-lg">No CV created yet.</p>
              <button className="mt-4 text-[#5E5ADB] font-bold hover:underline">
                + Create your first CV
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;