'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { Stethoscope, Activity, ShieldAlert, Sparkles, Volume2, Globe, AlertOctagon, Sun, Moon, LogOut, UserCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { lang, setLang, t, theme, toggleTheme, user, logout } = useApp();
  const [talkBack, setTalkBack] = useState(false);
  const [sosModal, setSosModal] = useState(false);

  const toggleTalkBack = () => {
    const next = !talkBack;
    setTalkBack(next);
    if ('speechSynthesis' in window && next) {
      const u = new SpeechSynthesisUtterance("Audio assistance enabled.");
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <nav className="w-full bg-white/95 dark:bg-medgrey-900/95 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3 border-b border-medgrey-200 dark:border-medgrey-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Track Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medblue-600 to-sky-500 flex items-center justify-center shadow-md shadow-medblue-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-medgrey-900 dark:text-white">
                  Medi<span className="text-medblue-600 dark:text-medblue-400">Kiosk</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-medblue-50 dark:bg-medblue-900/40 text-medblue-700 dark:text-medblue-300 border border-medblue-200 dark:border-medblue-700">
                  AYUSH • SIH26047
                </span>
              </div>
              <p className="text-[11px] text-medgrey-500 dark:text-medgrey-400 hidden sm:block">
                Pre-Consultation Clinical Intake Engine
              </p>
            </div>
          </Link>
        </div>

        {/* Primary Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-medgrey-100 dark:bg-medgrey-800 p-1 rounded-xl border border-medgrey-200 dark:border-medgrey-700 text-xs font-semibold">
          <Link
            href="/kiosk"
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              pathname === '/kiosk'
                ? 'bg-white dark:bg-medgrey-700 text-medblue-600 dark:text-white shadow-sm font-bold'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:text-medblue-600 dark:hover:text-white'
            }`}
          >
            {t.patientPortal}
          </Link>
          <Link
            href="/doctor"
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname === '/doctor'
                ? 'bg-white dark:bg-medgrey-700 text-medblue-600 dark:text-white shadow-sm font-bold'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:text-medblue-600 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            {t.doctorPortal}
          </Link>
          <Link
            href="/triage"
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname === '/triage'
                ? 'bg-white dark:bg-medgrey-700 text-medblue-600 dark:text-white shadow-sm font-bold'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:text-medblue-600 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            {t.triageDesk}
          </Link>
          <Link
            href="/integrations"
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname === '/integrations'
                ? 'bg-white dark:bg-medgrey-700 text-medblue-600 dark:text-white shadow-sm font-bold'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:text-medblue-600 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t.fhirAbdm}
          </Link>
        </div>

        {/* Language, Theme & User Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Assistance */}
          <button
            onClick={toggleTalkBack}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
              talkBack
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-700 dark:text-medgrey-300 border-medgrey-200 dark:border-medgrey-700 hover:bg-medgrey-200 dark:hover:bg-medgrey-700'
            }`}
            title="Audio assistance"
          >
            <Volume2 className="w-4 h-4 text-medblue-600 dark:text-medblue-400" />
            <span className="hidden lg:inline">{talkBack ? t.audioOn : t.audioHelp}</span>
          </button>

          {/* Multilingual Selector (EN, KN, TA, HI) */}
          <div className="flex items-center bg-medgrey-100 dark:bg-medgrey-800 border border-medgrey-200 dark:border-medgrey-700 rounded-lg px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-medblue-600 dark:text-medblue-400 mr-1.5" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-medgrey-800 dark:text-medgrey-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="en" className="bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white">English</option>
              <option value="kn" className="bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white">ಕನ್ನಡ (Kannada)</option>
              <option value="ta" className="bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white">தமிழ் (Tamil)</option>
              <option value="hi" className="bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white">हिंदी (Hindi)</option>
            </select>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-medgrey-100 dark:bg-medgrey-800 hover:bg-medgrey-200 dark:hover:bg-medgrey-700 border border-medgrey-200 dark:border-medgrey-700 text-medgrey-700 dark:text-medgrey-300 rounded-lg transition-colors"
            title="Toggle theme (Light / Dark)"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-medblue-600" />}
          </button>

          {/* User Account / Login */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-medgrey-800 dark:text-medgrey-200 max-w-[120px] truncate">
                  {user.full_name || 'User'}
                </span>
                <span className="text-[10px] text-medblue-600 dark:text-medblue-400 font-medium">
                  {user.medikiosk_id || user.doctor_id || user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors"
                title={t.signOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 bg-medblue-600 hover:bg-medblue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              {t.signInButton}
            </Link>
          )}

          {/* SOS Emergency Button */}
          <button
            onClick={() => setSosModal(true)}
            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.sos}</span>
          </button>
        </div>

      </div>

      {/* SOS Modal */}
      {sosModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-medgrey-800 p-6 rounded-2xl max-w-sm w-full border border-rose-300 dark:border-rose-900 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-medgrey-900 dark:text-white">Hospital Emergency Assistance (SOS)</h3>
            <p className="text-xs text-medgrey-600 dark:text-medgrey-300 mt-2">
              If experiencing severe chest pain, loss of consciousness, or acute shortness of breath, staff has been notified to assist immediately.
            </p>
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
              Emergency Code Dispatched to Triage Desk
            </div>
            <button
              onClick={() => setSosModal(false)}
              className="mt-4 w-full py-2 bg-medgrey-200 dark:bg-medgrey-700 hover:bg-medgrey-300 text-medgrey-800 dark:text-white rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
