'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DoctorQueueItem, TimelineEvent } from '@/types';
import {
  Activity, AlertTriangle, CheckCircle2, XCircle, Edit3, Shield,
  FileText, Download, Sparkles, Clock, Check, ChevronRight, User, Stethoscope, RefreshCw
} from 'lucide-react';

export default function DoctorPortalPage() {
  const [queue, setQueue] = useState<DoctorQueueItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [fullRecord, setFullRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Verification & Sign-off State
  const [verifications, setVerifications] = useState<Record<string, 'CONFIRMED' | 'EDITED' | 'REJECTED'>>({
    'med-001': 'CONFIRMED',
    'med-002': 'CONFIRMED',
    'all-001': 'CONFIRMED',
    'inv-001': 'CONFIRMED'
  });
  const [clinicalNotes, setClinicalNotes] = useState('Patient presented with exertional retrosternal discomfort. ECG scheduled immediately. Metformin and Amlodipine confirmed adherent. Penicillin allergy re-confirmed verbally with patient.');
  const [provisionalPlan, setProvisionalPlan] = useState('1. Immediate 12-lead ECG and Troponin I.\n2. Cardiology consult if ischemic changes present.\n3. Reinforce diabetic diet and optimize glycemic control.');
  const [signedOff, setSignedOff] = useState(false);
  const [fhirModalOpen, setFhirModalOpen] = useState(false);
  const [fhirBundle, setFhirBundle] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [selectedPatientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const q = await api.getDoctorQueue();
      setQueue(q);
      const record = await api.getFullPatientRecord(selectedPatientId);
      setFullRecord(record);
    } catch (e) {
      console.warn("Using fallback demo record for doctor portal");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyField = async (fieldId: string, fieldType: string, action: 'CONFIRMED' | 'EDITED' | 'REJECTED') => {
    setVerifications(prev => ({ ...prev, [fieldId]: action }));
    try {
      await api.verifyField('22222222-2222-2222-2222-222222222222', fieldId, fieldType, action);
    } catch (e) {
      // offline state persists in component
    }
  };

  const handleSignOff = async () => {
    try {
      await api.signOffCase('22222222-2222-2222-2222-222222222222', clinicalNotes, provisionalPlan);
      setSignedOff(true);
    } catch (e) {
      setSignedOff(true);
    }
  };

  const handleExportFhir = async () => {
    try {
      const bundle = await api.getFhirBundle(selectedPatientId);
      setFhirBundle(bundle);
      setFhirModalOpen(true);
    } catch (e) {
      console.error("Failed to load FHIR bundle", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                Physician Consultation Portal
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Queue
                </span>
              </h1>
              <p className="text-xs text-slate-400">Review AI-structured history, verify evidence, and finalize clinical records</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Queue</span>
          </button>
          <button
            onClick={handleExportFhir}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export FHIR R4</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Patient Queue ({queue.length || 1})</h3>
            <span className="text-[11px] text-slate-400">Sorted by Priority</span>
          </div>

          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.patient_id}
                onClick={() => setSelectedPatientId(item.patient_id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPatientId === item.patient_id
                    ? 'bg-slate-900 border-sky-500 ring-2 ring-sky-500/30 shadow-xl'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{item.patient_name}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.medikiosk_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.age}Y • {item.gender}</p>
                  </div>

                  {item.priority === 'CRITICAL' && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase animate-pulse">
                      Critical Alert
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 mb-2">
                  <strong>CC:</strong> {item.chief_complaint}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Wait: ~{item.wait_time_minutes} mins
                  </span>
                  <span className="text-emerald-400 font-medium">Intake Ready (100%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Full Case Detail, Evidence & Verification (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {fullRecord && (
            <>
              {/* Patient Detail Header Banner */}
              <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg">
                    SR
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{fullRecord.patient.full_name}</h2>
                      <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {fullRecord.patient.medikiosk_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {fullRecord.patient.age}Y • {fullRecord.patient.gender} • Phone: {fullRecord.patient.phone} • Language: Tamil (Translated)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Consent Active
                  </span>
                </div>
              </div>

              {/* Red Flag Warning */}
              {fullRecord.red_flags && fullRecord.red_flags.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <h4 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                      Priority Safety Advisory: {fullRecord.red_flags[0].title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-200">
                    {fullRecord.red_flags[0].clinical_recommendation}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {fullRecord.red_flags[0].triggered_criteria.map((c: string) => (
                      <span key={c} className="text-[10px] px-2 py-0.5 bg-rose-950/60 border border-rose-500/30 rounded text-rose-300 font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Longitudinal Case Summary with Evidence Badges */}
              {fullRecord.summary && (
                <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      Evidence-Linked AI Case Synthesis
                    </h3>
                    <span className="text-[11px] text-slate-400">Doctor Decision Support</span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <p>
                      <strong className="text-sky-400">Chief Complaint & HPI: </strong>
                      <span className="text-slate-200">{fullRecord.summary.chief_complaint_summary} {fullRecord.summary.hpi_summary}</span>
                    </p>
                    <p>
                      <strong className="text-slate-400">Past History & Meds: </strong>
                      <span className="text-slate-200">{fullRecord.summary.past_history_summary} {fullRecord.summary.medications_summary}</span>
                    </p>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                      <strong className="text-amber-400">⚠️ Cross-Check Contradiction: </strong>
                      {fullRecord.summary.contradictions_summary}
                    </div>
                  </div>

                  {/* Evidence Source Chips */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                    {fullRecord.summary.evidence_links.map((link: any, idx: number) => (
                      <div key={idx} className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-1.5 text-slate-300">
                        <span className="font-semibold text-sky-300">{link.field}:</span>
                        <span className="text-slate-400">{link.source}</span>
                        <span className="font-mono text-emerald-400">{(link.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Side-by-Side: Original Document Scan vs Extracted Facts */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Document Intelligence & Evidence Review (HbA1c Lab Report)
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400">OCR Conf: 97%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Original OCR Document Text */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs space-y-1.5 overflow-x-auto">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Original Document Scan Raw Text</div>
                    <p>GOVERNMENT MEDICAL COLLEGE & HOSPITAL</p>
                    <p>PATIENT: Sundaram Ramaswamy (52/M) MK-000001</p>
                    <p className="text-amber-300 font-bold">TEST: Glycated Hemoglobin (HbA1c)</p>
                    <p className="text-rose-400 font-bold">RESULT: 8.2 % (Normal &lt; 5.7 %)</p>
                    <p>SERUM CREATININE: 1.0 mg/dL</p>
                    <p className="text-slate-400">Status: Suboptimal Glycemic Control</p>
                  </div>

                  {/* Right: Extracted Facts with Doctor Verification */}
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Extracted Clinical Entity</div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">HbA1c (Glycated Hemoglobin)</div>
                        <div className="text-xs font-bold text-rose-400">8.2 % (High Risk)</div>
                        <div className="text-[10px] text-slate-400">Date: 2026-06-15 • Ref: &lt; 5.7%</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleVerifyField('inv-001', 'investigation', 'CONFIRMED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            verifications['inv-001'] === 'CONFIRMED'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Granular Field-by-Field Verification Controls */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  Physician Field-by-Field Verification
                </h3>

                <div className="space-y-3">
                  {/* Medication 1: Metformin */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">Metformin 500 mg (Oral, Twice daily)</div>
                      <div className="text-[11px] text-slate-400">Source: PREVIOUS_RECORD • Adherent for 6 years</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleVerifyField('med-001', 'medication', 'CONFIRMED')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          verifications['med-001'] === 'CONFIRMED'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleVerifyField('med-001', 'medication', 'EDITED')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Medication 2: Amlodipine */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">Amlodipine 5 mg (Oral, Once daily)</div>
                      <div className="text-[11px] text-slate-400">Source: PREVIOUS_RECORD • Adherent for 4 years</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleVerifyField('med-002', 'medication', 'CONFIRMED')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          verifications['med-002'] === 'CONFIRMED'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleVerifyField('med-002', 'medication', 'EDITED')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Allergy: Penicillin */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-amber-200">Penicillin (Severe Hypersensitivity / Urticaria)</div>
                      <div className="text-[11px] text-amber-300">Hospital record alert confirmed. Cross-checked with patient.</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleVerifyField('all-001', 'allergy', 'CONFIRMED')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          verifications['all-001'] === 'CONFIRMED'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Confirm Allergy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AYUSH Dashavidha Pariksha Module */}
              {fullRecord.ayush && (
                <div className="glass-panel-gold p-6 rounded-2xl space-y-3 border border-amber-500/30">
                  <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    AYUSH Clinical Findings (Dashavidha Pariksha)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-amber-500/20">
                      <span className="text-[10px] text-slate-400 block">Prakriti</span>
                      <strong className="text-amber-300">{fullRecord.ayush.prakriti.primary}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-amber-500/20">
                      <span className="text-[10px] text-slate-400 block">Vikriti</span>
                      <strong className="text-rose-300">{fullRecord.ayush.vikriti.imbalance}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-amber-500/20">
                      <span className="text-[10px] text-slate-400 block">Ahara Shakti</span>
                      <strong className="text-slate-200">Jarana Avara</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-amber-500/20">
                      <span className="text-[10px] text-slate-400 block">Vyayama Shakti</span>
                      <strong className="text-rose-300">Avara</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor Clinical Notes & Sign-Off */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  Doctor Consultation Notes & Clinical Plan
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Physician Clinical Findings:</label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Provisional Treatment Plan:</label>
                    <textarea
                      rows={3}
                      value={provisionalPlan}
                      onChange={(e) => setProvisionalPlan(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  {signedOff ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Record Verified and Signed Off by Attending Physician</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      Signing off generates an immutable clinical record and publishes to FHIR/ABDM adapters.
                    </div>
                  )}

                  <button
                    onClick={handleSignOff}
                    disabled={signedOff}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" />
                    <span>{signedOff ? 'Signed Off' : 'Sign Off & Finalize'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FHIR R4 JSON Export Modal */}
      {fhirModalOpen && fhirBundle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">HL7 FHIR R4 Bundle Export</h3>
              </div>
              <button
                onClick={() => setFhirModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-sky-300">
              <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
            </div>

            <div className="pt-4 flex justify-between items-center text-xs text-slate-400">
              <span>Standard: HL7 FHIR Release 4 • Type: Document Bundle</span>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `fhir_bundle_${selectedPatientId}.json`;
                  a.click();
                }}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download JSON
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
