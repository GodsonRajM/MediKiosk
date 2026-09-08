'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Sparkles, Download, CheckCircle2, ShieldCheck, Database, ArrowRight, RefreshCw } from 'lucide-react';

export default function IntegrationsPage() {
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [fhirLoading, setFhirLoading] = useState(false);

  // ABDM State
  const [abhaInput, setAbhaInput] = useState('91-4521-8890-1234');
  const [abdmResult, setAbdmResult] = useState<any>(null);
  const [abdmLoading, setAbdmLoading] = useState(false);

  const fetchFhirBundle = async () => {
    setFhirLoading(true);
    try {
      const data = await api.getFhirBundle('11111111-1111-1111-1111-111111111111');
      setFhirBundle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setFhirLoading(false);
    }
  };

  const verifyAbha = async () => {
    setAbdmLoading(true);
    try {
      const data = await api.verifyAbha(abhaInput);
      setAbdmResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAbdmLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Interoperability & Standards Console
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                FHIR R4 & ABDM
              </span>
            </h1>
            <p className="text-xs text-slate-400">HL7 FHIR R4 document bundle mapper & Ayushman Bharat Digital Mission mock adapters</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
            FHIR: Ready (R4)
          </span>
          <span className="px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold">
            ABDM: Mock Mode
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: HL7 FHIR R4 Bundle Explorer */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-white">HL7 FHIR R4 Bundle Explorer</h3>
            </div>
            <button
              onClick={fetchFhirBundle}
              disabled={fhirLoading}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fhirLoading ? 'animate-spin' : ''}`} />
              <span>Fetch Bundle (MK-000001)</span>
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Transforms the verified clinical case into an interoperable HL7 FHIR Document Bundle containing <code>Patient</code>, <code>Encounter</code>, <code>Condition</code>, <code>MedicationStatement</code>, <code>AllergyIntolerance</code>, and <code>Observation</code> resources.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 h-96 overflow-y-auto">
            {fhirBundle ? (
              <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Database className="w-8 h-8 mb-2 opacity-50" />
                <span>Click &quot;Fetch Bundle&quot; above to inspect generated FHIR R4 payload</span>
              </div>
            )}
          </div>

          {fhirBundle && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `fhir_bundle_MK-000001.json`;
                  a.click();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download JSON Bundle
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ABDM Mock Adapter Test Bench */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 border border-slate-800">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">ABDM Mock-First Adapter Test Bench</h3>
          </div>

          <p className="text-xs text-slate-300">
            Simulates Ayushman Bharat Digital Mission (ABDM) integration milestone flows: M1 (ABHA Verification), M2 (Consent Management), and M3 (Health Data Exchange).
          </p>

          {/* M1: ABHA Verification */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Milestone 1: ABHA Verification</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">M1 Ready</span>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={abhaInput}
                onChange={(e) => setAbhaInput(e.target.value)}
                placeholder="91-4521-8890-1234"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={verifyAbha}
                disabled={abdmLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                Verify ABHA
              </button>
            </div>

            {abdmResult && (
              <div className="p-3 bg-slate-950 rounded-lg border border-emerald-500/30 text-xs font-mono text-emerald-300 space-y-1">
                <div>Status: {abdmResult.status}</div>
                <div>Full Name: {abdmResult.full_name} ({abdmResult.gender}/{abdmResult.year_of_birth})</div>
                <div>ABHA Address: {abdmResult.abha_address}</div>
                <div>Source: {abdmResult.verification_source}</div>
              </div>
            )}
          </div>

          {/* M2 & M3 Simulation Info */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Milestone 2 & 3: Consent & Health Data</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              MediKiosk encapsulates consent artifacts inside <code>/api/v1/abdm/consent/request</code> and enables HIP/HIU health data queries for historical records (e.g. prior diagnoses, HbA1c lab tests) via standard gateways.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            <strong>ABDM Sandbox Compliance Note:</strong> Operating in <code>ABDM_MODE=mock</code> by default. Live credentials can be configured seamlessly in <code>.env</code> without altering frontend application code.
          </div>
        </div>

      </div>

    </div>
  );
}
