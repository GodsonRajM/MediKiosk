'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/AppContext';
import { ArrowRight, Stethoscope, ShieldAlert, Sparkles, Activity, FileText, CheckCircle2, UserCircle, ShieldCheck, HeartPulse } from 'lucide-react';

export default function HomePage() {
  const { t, user } = useApp();

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 lg:py-16 max-w-7xl mx-auto w-full">
      {/* Track Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medblue-50 dark:bg-medblue-950/50 border border-medblue-200 dark:border-medblue-800 text-medblue-700 dark:text-medblue-300 text-xs font-semibold mb-6 shadow-sm">
        <Sparkles className="w-4 h-4 text-medblue-600" />
        Smart India Hackathon 2026 • Problem Statement SIH26047 (Ministry of Ayush)
      </div>

      {/* Hero Title */}
      <div className="text-center max-w-3xl space-y-4 mb-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-medgrey-900 dark:text-white">
          Intelligent Pre-Consultation <br />
          <span className="text-medblue-600 dark:text-medblue-400">Clinical Intake Engine</span>
        </h1>
        <p className="text-lg sm:text-xl text-medgrey-600 dark:text-medgrey-300 font-normal">
          Moves clinical history-taking from inside the doctor's 3-minute consultation to <em>before</em> the consultation.
        </p>
        <p className="text-sm text-medgrey-500 dark:text-medgrey-400 font-light max-w-2xl mx-auto">
          AI prepares the case; the physician owns the clinical decision. Built with a deterministic question graph, evidence-linked facts, real OCR document intelligence, and comprehensive AYUSH Dashavidha Pariksha.
        </p>
      </div>

      {/* Direct Action Entry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
        {/* Patient Portal Card */}
        <div className="health-card p-6 sm:p-8 flex flex-col justify-between health-card-hover border-medblue-200 dark:border-medgrey-700">
          <div>
            <div className="w-12 h-12 rounded-xl bg-medblue-100 dark:bg-medblue-900/40 text-medblue-600 dark:text-medblue-400 flex items-center justify-center mb-4">
              <UserCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-medgrey-900 dark:text-white mb-2">
              {t.patientPortal}
            </h2>
            <p className="text-xs text-medgrey-600 dark:text-medgrey-400 leading-relaxed mb-4">
              Select your treating doctor, complete clinical intake in your native language (English, Kannada, Tamil, Hindi), manage your medical records, and upload prescription scans with OCR.
            </p>
          </div>
          <Link
            href={user?.role === 'PATIENT' ? '/kiosk' : '/login'}
            className="w-full py-3 bg-medblue-600 hover:bg-medblue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-medblue-500/20"
          >
            {user?.role === 'PATIENT' ? 'Open Patient Workspace' : 'Patient Login & Intake'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Doctor Portal Card */}
        <div className="health-card p-6 sm:p-8 flex flex-col justify-between health-card-hover border-medblue-200 dark:border-medgrey-700">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-medgrey-900 dark:text-white mb-2">
              {t.doctorPortal}
            </h2>
            <p className="text-xs text-medgrey-600 dark:text-medgrey-400 leading-relaxed mb-4">
              Search real patient records in Supabase, review structured Chief Complaint & HPI timelines, inspect attached document evidence side-by-side, verify clinical facts, and sign off.
            </p>
          </div>
          <Link
            href={user?.role === 'DOCTOR' ? '/doctor' : '/login'}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
          >
            {user?.role === 'DOCTOR' ? 'Open Doctor Workspace' : 'Doctor Login & Queue'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Feature Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-5xl">
        <div className="health-card p-5">
          <div className="w-9 h-9 rounded-lg bg-medblue-50 dark:bg-medblue-950/40 text-medblue-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-medgrey-900 dark:text-white mb-1">Zero Dummy Data Guarantee</h3>
          <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
            All patient profiles, intake questions, and documents originate strictly from real user submissions stored dynamically.
          </p>
        </div>

        <div className="health-card p-5">
          <div className="w-9 h-9 rounded-lg bg-medblue-50 dark:bg-medblue-950/40 text-medblue-600 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-medgrey-900 dark:text-white mb-1">Quad-Lingual Interface</h3>
          <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
            Seamlessly toggle between English, ಕನ್ನಡ (Kannada), தமிழ் (Tamil), and हिंदी (Hindi) across forms, clinical graphs, and audio.
          </p>
        </div>

        <div className="health-card p-5">
          <div className="w-9 h-9 rounded-lg bg-medblue-50 dark:bg-medblue-950/40 text-medblue-600 flex items-center justify-center mb-3">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-medgrey-900 dark:text-white mb-1">Clinical Safety & Red Flags</h3>
          <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
            Deterministic rule engines intercept emergency symptoms (cardiovascular, dyspnea) in real-time before consultation.
          </p>
        </div>
      </div>

    </div>
  );
}
