'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Stethoscope, ShieldAlert, Sparkles, Activity, FileText, CheckCircle2, HeartPulse } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 lg:py-16 max-w-7xl mx-auto w-full">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-6">
        <Sparkles className="w-4 h-4" />
        Smart India Hackathon 2026 • SIH26047 Ministry of Ayush
      </div>

      {/* Main Title & Subtitles */}
      <div className="text-center max-w-3xl space-y-4 mb-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
          Empowering Healthcare with <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">MediKiosk</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 font-normal">
          Moves clinical history-taking from inside the doctor's 3-minute consultation to <em>before</em> the consultation.
        </p>
        <p className="text-sm text-slate-400 font-light max-w-2xl mx-auto">
          AI prepares the case; the physician owns the clinical decision. Built with a deterministic clinical graph, evidence-linked facts, and comprehensive AYUSH Dashavidha Pariksha.
        </p>
      </div>

      {/* Target Demo Quick Launch Banner */}
      <div className="w-full max-w-4xl glass-panel-gold rounded-2xl p-4 sm:p-6 mb-10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <HeartPulse className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-amber-200">Demo Patient Scenario MK-000001</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Red-Flag Trigger
              </span>
            </div>
            <p className="text-xs text-slate-300">
              52M, Tamil • Exertional chest pain 2 days • Diabetes & HTN history • HbA1c 8.2% upload • Allergy contradiction
            </p>
          </div>
        </div>
        <Link
          href="/kiosk"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
        >
          Launch Golden Path
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Primary Role Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl">
        
        {/* Card 1: Patient Kiosk */}
        <Link
          href="/kiosk"
          className="glass-card hover:border-sky-500/50 p-6 rounded-2xl flex flex-col justify-between group transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/10"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">Patient Kiosk</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Voice and touch intake, deterministic question graph, AYUSH Dashavidha Pariksha, and prescription/lab scanning.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-sky-400">
            <span>Start intake</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Doctor Portal */}
        <Link
          href="/doctor"
          className="glass-card hover:border-emerald-500/50 p-6 rounded-2xl flex flex-col justify-between group transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Doctor Portal</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Prioritized waiting queue, side-by-side evidence links, field verification controls, and final clinical record sign-off.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <span>Review patients</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Triage Safety Console */}
        <Link
          href="/triage"
          className="glass-card hover:border-rose-500/50 p-6 rounded-2xl flex flex-col justify-between group transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">Triage Console</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time feed of urgent safety alerts triggered by deterministic rules (e.g., chest pain + breathlessness).
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-rose-400">
            <span>View active alerts</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Interoperability Console */}
        <Link
          href="/integrations"
          className="glass-card hover:border-amber-500/50 p-6 rounded-2xl flex flex-col justify-between group transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">FHIR & ABDM</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Export HL7 FHIR R4 Bundles and test mock ABDM M1 (ABHA), M2 (Consent), and M3 (Health Records).
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-amber-400">
            <span>Inspect standards</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Feature Badges Row */}
      <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Zero Custom Hardware (Runs on any tablet/touchscreen)</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>Deterministic Question Graph + LLM Layer</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>Full AYUSH Dashavidha Pariksha</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400" />
          <span>HL7 FHIR R4 & ABDM Ready</span>
        </div>
      </div>
    </div>
  );
}
