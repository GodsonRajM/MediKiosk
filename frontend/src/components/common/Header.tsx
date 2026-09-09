"use client";

import React from "react";
import { useApp } from "@/lib/AppContext";
import { Language } from "@/lib/translations";
import { 
  Activity, 
  Sun, 
  Moon, 
  Globe, 
  LogOut, 
  User as UserIcon,
  ShieldCheck
} from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, showSidebarToggle }) => {
  const { user, theme, setTheme, language, setLanguage, t, logout } = useApp();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-medgrey-900/95 backdrop-blur border-b border-medgrey-200 dark:border-medgrey-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Optional Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-medgrey-600 dark:text-medgrey-300 hover:bg-medgrey-100 dark:hover:bg-medgrey-800 transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medblue-700 to-medblue-500 flex items-center justify-center text-white shadow-sm shadow-medblue-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-medgrey-900 dark:text-white flex items-center gap-1.5">
                {t.appName}
              </span>
              <p className="text-[11px] text-medgrey-500 dark:text-medgrey-400 hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Language, Theme, User Badge, Logout */}
        <div className="flex items-center gap-3">
          
          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-4 h-4 text-medgrey-500 absolute left-2.5 pointer-events-none" />
            <select
              value={language}
              onChange={handleLanguageChange}
              className="pl-8 pr-3 py-1.5 text-xs font-medium bg-medgrey-50 dark:bg-medgrey-800 border border-medgrey-200 dark:border-medgrey-700 rounded-lg text-medgrey-700 dark:text-medgrey-200 focus:outline-none focus:ring-1 focus:ring-medblue-500 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-lg text-medgrey-500 dark:text-medgrey-400 hover:bg-medgrey-100 dark:hover:bg-medgrey-800 transition-colors"
            title={theme === "light" ? t.darkTheme : t.lightTheme}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* User Badge & Logout */}
          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-medgrey-200 dark:border-medgrey-700">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-medgrey-800 dark:text-medgrey-100">
                  {user.name}
                </span>
                <span className="text-[10px] font-mono text-medblue-600 dark:text-medblue-400">
                  {user.medikiosk_id || user.doctor_id || user.role.toUpperCase()}
                </span>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
