'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Activity, ShieldAlert, Sparkles, Volume2, Globe, AlertOctagon, UserCircle } from 'lucide-react';

export default function Navbar() {
  const [lang, setLang] = useState('en');
  const [talkBack, setTalkBack] = useState(false);
  const [sosModal, setSosModal] = useState(false);

  const toggleTalkBack = () => {
    const next = !talkBack;
    setTalkBack(next);
    if ('speechSynthesis' in window && next) {
      const u = new SpeechSynthesisUtterance("Accessibility TalkBack audio assistance enabled.");
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <nav className="w-full glass-panel sticky top-0 z-50 px-4 lg:px-8 py-3.5 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Track Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">Medi<span className="text-sky-400">Kiosk</span></span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AYUSH Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400">SIH26047 • Pre-Consultation Clinical Intake</p>
            </div>
          </Link>
        </div>

        {/* Quick Nav Links */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          <Link href="/kiosk" className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-sky-400 transition-colors">
            Patient Kiosk
          </Link>
          <Link href="/doctor" className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-sky-400 transition-colors flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Doctor Portal
          </Link>
          <Link href="/triage" className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-sky-400 transition-colors flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Triage
          </Link>
          <Link href="/integrations" className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-sky-400 transition-colors flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            FHIR / ABDM
          </Link>
        </div>

        {/* Accessibility, Language & SOS */}
        <div className="flex items-center gap-2.5">
          {/* TalkBack Accessibility Toggle */}
          <button
            onClick={toggleTalkBack}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              talkBack
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-2 ring-amber-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
            title="Toggle Audio Assistance"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{talkBack ? 'Audio ON' : 'Audio Help'}</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="ta" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
            </select>
          </div>

          {/* SOS Mock Button */}
          <button
            onClick={() => setSosModal(true)}
            className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">SOS</span>
          </button>

          <Link
            href="/login"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Role Login"
          >
            <UserCircle className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Login</span>
          </Link>
        </div>
      </div>

      {/* SOS Modal */}
      {sosModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 p-6 rounded-2xl max-w-md w-full shadow-2xl shadow-rose-500/20 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
              <AlertOctagon className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Emergency Assistance Triggered</h3>
            <p className="text-sm text-slate-300 mb-6">
              A high-priority alert has been dispatched to the hospital nursing station and triage staff. Hospital personnel will arrive at this kiosk bay immediately.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSosModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Dismiss / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
