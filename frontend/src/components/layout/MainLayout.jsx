import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useLanguage } from "../../context/LanguageContext";
import { cn } from "../../lib/utils";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL } = useLanguage();

  return (
    <div className="app-shell bg-background pattern-bg">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <main
        className={cn(
          "min-h-screen pt-24 transition-all duration-300",
          isRTL() ? "md:mr-80" : "md:ml-80",
        )}>
        <div className="page-wrap p-3 md:p-5 lg:p-7">
          <div className="workspace-stage min-h-[calc(100vh-7rem)] rounded-lg p-4 md:p-6 lg:p-7">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
