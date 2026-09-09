"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { Header } from "@/components/common/Header";
import { Sidebar } from "@/components/common/Sidebar";
import { DoctorConnectCard } from "@/components/patient/DoctorConnectCard";
import { ClinicalIntakeGraph } from "@/components/patient/ClinicalIntakeGraph";
import { ProfileEditor } from "@/components/patient/ProfileEditor";
import { MedicalHistoryManager } from "@/components/patient/MedicalHistoryManager";
import { DocumentUploader } from "@/components/patient/DocumentUploader";
import { EmergencyAccessCard } from "@/components/patient/EmergencyAccessCard";
import { 
  Home, 
  User, 
  Clock, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Globe, 
  ShieldCheck,
  Stethoscope,
  FileUp,
  ShieldAlert
} from "lucide-react";
import { Language } from "@/lib/translations";

export default function PatientPortalPage() {
  const router = useRouter();
  const { user, theme, setTheme, language, setLanguage, t, isLoading } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "profile" | "history" | "emergency" | "settings">("home");
  const [intakeActive, setIntakeActive] = useState(false);

  // Authentication protection
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    } else if (!isLoading && user && user.role !== "patient") {
      router.push("/portal/doctor");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-medgrey-50 dark:bg-medgrey-900">
        <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header
        showSidebarToggle={true}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left-Side Sliding Menu Bar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIntakeActive(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-72 max-w-5xl space-y-6">
          
          {/* TAB 1: HOME */}
          {activeTab === "home" && (
            <div className="space-y-6">
              {intakeActive ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIntakeActive(false)}
                      className="text-xs font-semibold text-medblue-600 dark:text-medblue-400 hover:underline"
                    >
                      ← Back to Home
                    </button>
                    <span className="text-xs text-slate-500 font-mono">
                      Patient: {user.medikiosk_id}
                    </span>
                  </div>
                  <ClinicalIntakeGraph />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Greeting Card */}
                  <div className="health-card p-6 bg-gradient-to-r from-medblue-600 to-medblue-700 text-white space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-medblue-100">
                      Welcome to MediKiosk
                    </span>
                    <h1 className="text-2xl font-bold">
                      Hello, {user.name}
                    </h1>
                    <p className="text-xs text-medblue-100 max-w-lg">
                      Please connect to your attending doctor to start your pre-consultation clinical intake.
                    </p>
                  </div>

                  {/* Connect Doctor Component */}
                  <DoctorConnectCard onStartIntake={() => setIntakeActive(true)} />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === "profile" && <ProfileEditor />}

          {/* TAB 3: HISTORY & DOCUMENTS */}
          {activeTab === "history" && (
            <div className="space-y-8">
              <MedicalHistoryManager />
              <DocumentUploader />
            </div>
          )}

          {/* TAB 4: EMERGENCY QR */}
          {activeTab === "emergency" && (
            <EmergencyAccessCard />
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === "settings" && (
            <div className="health-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t.settings}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Customize your kiosk interface preferences and accessibility options
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Theme Setting */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === "light" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{t.theme}</h4>
                      <p className="text-slate-500">
                        {theme === "light" ? "Light high-contrast healthcare theme" : "Dark ambient theme"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <button
                      onClick={() => setTheme("light")}
                      className={`px-3 py-1.5 rounded font-semibold transition-all ${
                        theme === "light" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                      }`}
                    >
                      {t.lightTheme}
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`px-3 py-1.5 rounded font-semibold transition-all ${
                        theme === "dark" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500"
                      }`}
                    >
                      {t.darkTheme}
                    </button>
                  </div>
                </div>

                {/* Language Setting */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-medblue-600 dark:text-medblue-400" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{t.language}</h4>
                      <p className="text-slate-500">
                        Selected language applies platform-wide across all forms and clinical intake
                      </p>
                    </div>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="health-input w-auto py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>

                {/* Privacy and Consent Notice */}
                <div className="p-4 rounded-xl bg-medblue-50/70 dark:bg-medblue-950/30 border border-medblue-100 dark:border-medblue-900 space-y-1.5">
                  <span className="flex items-center gap-1.5 font-bold text-medblue-700 dark:text-medblue-300">
                    <ShieldCheck className="w-4 h-4" />
                    Clinical Intake Consent Status: Active & Granted
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    MediKiosk operates on strict privacy-by-design principles. Your clinical records are encrypted and accessible only to authorized attending physicians.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
