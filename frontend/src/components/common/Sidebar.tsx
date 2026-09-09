"use client";

import React from "react";
import { useApp } from "@/lib/AppContext";
import { 
  Home, 
  User, 
  Clock, 
  Settings, 
  LogOut,
  X,
  Stethoscope
} from "lucide-react";

interface SidebarProps {
  activeTab: "home" | "profile" | "history" | "settings";
  onSelectTab: (tab: "home" | "profile" | "history" | "settings") => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, t, logout } = useApp();

  const menuItems = [
    { id: "home", label: t.home, icon: Home },
    { id: "profile", label: t.profile, icon: User },
    { id: "history", label: t.history, icon: Clock },
    { id: "settings", label: t.settings, icon: Settings },
  ] as const;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sliding Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-white dark:bg-medgrey-900 border-r border-medgrey-200 dark:border-medgrey-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Header row in mobile drawer */}
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-medgrey-100 dark:border-medgrey-800">
            <span className="text-xs font-bold uppercase tracking-wider text-medgrey-400">
              Menu
            </span>
            <button
              onClick={onClose}
              className="p-1 text-medgrey-500 hover:text-medgrey-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Patient Card badge */}
          {user && (
            <div className="p-3.5 rounded-xl bg-medblue-50/70 dark:bg-medblue-950/40 border border-medblue-100 dark:border-medblue-900/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-medblue-600 text-white flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-medgrey-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-[11px] font-mono text-medblue-600 dark:text-medblue-400">
                  {user.medikiosk_id || "MK-PATIENT"}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-medblue-600 text-white shadow-sm shadow-medblue-500/20"
                      : "text-medgrey-600 dark:text-medgrey-300 hover:bg-medgrey-100 dark:hover:bg-medgrey-800"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-medgrey-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Logout */}
        <div className="p-4 border-t border-medgrey-200 dark:border-medgrey-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-5 h-5 text-rose-500" />
            {t.logout}
          </button>
        </div>
      </aside>
    </>
  );
};
