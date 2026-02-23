import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen bg-lightGrey flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-6"> 
        
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;