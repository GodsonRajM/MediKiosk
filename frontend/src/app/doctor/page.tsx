'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { api } from '@/lib/api';
import {
  Activity, AlertTriangle, CheckCircle2, ShieldCheck, FileText, Download,
  Sparkles, Clock, Check, ChevronRight, User, Stethoscope, Search, FileUp, X, RefreshCw
} from 'lucide-react';

export default function DoctorPortalPage() {
  const router = useRouter();
  const { t, lang, user } = useApp();

  const [queue, setQueue] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [fullRecord, setFullRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Verification & Sign-off State
  const [verifications, setVerifications] = useState<Record<string, 'CONFIRMED' | 'FLAGGED_CONTRADICTION'>>({});
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [provisionalPlan, setProvisionalPlan] = useState('');
  const [signedOff, setSignedOff] = useState(false);
  const [signingOff, setSigningOff] = useState(false);

  // FHIR Export Modal State
  const [fhirModalOpen, setFhirModalOpen] = useState(false);
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [fhirLoading, setFhirLoading] = useState(false);

  // Active Tab in Doctor Portal
  const [docTab, setDocTab] = useState<'queue' | 'reviewed'>('queue');
  const [reviewedCases, setReviewedCases] = useState<any[]>([]);

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientDetails(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const q = await api.getDoctorQueue();
      setQueue(q);
      if (q.length > 0 && !selectedPatientId) {
        setSelectedPatientId(q[0].patient_id);
        setSelectedSessionId(q[0].session_id);
      }
    } catch (e) {
      console.error('Failed to load doctor queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSearch = async (query: string) => {
    setPatientSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await api.searchPatients(query.trim());
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const selectPatient = (patientId: string, sessId?: string) => {
    setSelectedPatientId(patientId);
    setSelectedSessionId(sessId || patientId);
    setSignedOff(false);
    setClinicalNotes('');
    setProvisionalPlan('');
    setSearchResults([]);
    setPatientSearchQuery('');
  };

  const loadPatientDetails = async (patientId: string) => {
    try {
      const record = await api.getPatientFullRecord(patientId);
      setFullRecord(record);
      if (record.session) {
        setSelectedSessionId(record.session.id);
      }
    } catch (err) {
      console.error('Failed to load patient full record:', err);
    }
  };

  const handleVerifyField = async (fieldId: string, fieldType: string, action: 'CONFIRMED' | 'FLAGGED_CONTRADICTION') => {
    setVerifications((prev) => ({ ...prev, [fieldId]: action }));
    if (selectedSessionId) {
      try {
        await api.verifyField(selectedSessionId, fieldId, fieldType, action);
      } catch (e) {
        // Local state persists
      }
    }
  };

  const handleSignOff = async () => {
    if (!clinicalNotes.trim() && !provisionalPlan.trim()) {
      alert('Please enter clinical notes and provisional care plan before signing off.');
      return;
    }
    if (!selectedSessionId) return;

    setSigningOff(true);
    try {
      await api.signOffCase(selectedSessionId, clinicalNotes, provisionalPlan);
      setSignedOff(true);
      setReviewedCases((prev) => [
        {
          patient_id: selectedPatientId,
          patient_name: fullRecord?.patient?.full_name || 'Patient',
          medikiosk_id: fullRecord?.patient?.medikiosk_id || 'MK-P00000',
          clinical_notes: clinicalNotes,
          provisional_plan: provisionalPlan,
          signed_at: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to sign off case.');
    } finally {
      setSigningOff(false);
    }
  };

  const handleExportFhir = async () => {
    if (!selectedPatientId) return;
    setFhirLoading(true);
    setFhirModalOpen(true);
    try {
      const bundle = await api.getFhirBundle(selectedPatientId);
      setFhirBundle(bundle);
    } catch (err: any) {
      alert(err.message || 'Failed to export FHIR bundle.');
    } finally {
      setFhirLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full bg-medgrey-50 dark:bg-medgrey-900 transition-colors">
      
      {/* Header & Sub-Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-medgrey-900 dark:text-white">
              {t.doctorQueueTitle}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
              Live Verified EHR
            </span>
          </div>
          <p className="text-xs text-medgrey-500 dark:text-medgrey-400 mt-0.5">
            Real-time pre-consultation intake summaries, longitudinal history, and clinical sign-off.
          </p>
        </div>

        {/* Doctor Tabs & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDocTab('queue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              docTab === 'queue'
                ? 'bg-medblue-600 text-white shadow-sm'
                : 'bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-700 dark:text-medgrey-300'
            }`}
          >
            Active Queue ({queue.length})
          </button>
          <button
            onClick={() => setDocTab('reviewed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              docTab === 'reviewed'
                ? 'bg-medblue-600 text-white shadow-sm'
                : 'bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-700 dark:text-medgrey-300'
            }`}
          >
            {t.doctorHistoryTab} ({reviewedCases.length})
          </button>
          <button
            onClick={loadQueue}
            className="p-2 bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-700 dark:text-medgrey-300 hover:bg-medgrey-200 rounded-xl"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patient Search in Supabase */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-medgrey-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={patientSearchQuery}
          onChange={(e) => handlePatientSearch(e.target.value)}
          placeholder={t.searchPatientPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-medgrey-300 dark:border-medgrey-700 bg-white dark:bg-medgrey-800 text-medgrey-900 dark:text-white text-xs focus:ring-2 focus:ring-medblue-500 focus:outline-none"
        />

        {/* Live Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-12 left-0 right-0 z-30 bg-white dark:bg-medgrey-800 border border-medgrey-200 dark:border-medgrey-700 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1">
            {searchResults.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPatient(p.id)}
                className="w-full p-2.5 rounded-lg text-left text-xs hover:bg-medblue-50 dark:hover:bg-medgrey-700 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-medgrey-900 dark:text-white">{p.full_name}</span>
                  <span className="ml-2 font-mono text-medblue-600 dark:text-medblue-400">{p.medikiosk_id}</span>
                </div>
                <span className="text-[11px] text-medgrey-400">{p.gender}, {p.age}y</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Doctor History View */}
      {docTab === 'reviewed' ? (
        <div className="health-card p-6 space-y-4">
          <h2 className="text-base font-bold text-medgrey-900 dark:text-white">
            {t.doctorHistoryTab}
          </h2>
          {reviewedCases.length === 0 ? (
            <p className="text-xs text-medgrey-500 py-6 text-center">
              No cases signed off in this session yet.
            </p>
          ) : (
            <div className="space-y-3">
              {reviewedCases.map((rc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-medgrey-200 dark:border-medgrey-700 bg-medgrey-50 dark:bg-medgrey-800/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-medgrey-900 dark:text-white">{rc.patient_name} ({rc.medikiosk_id})</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signed at {rc.signed_at}
                    </span>
                  </div>
                  <p className="text-medgrey-700 dark:text-medgrey-300"><strong>Notes:</strong> {rc.clinical_notes}</p>
                  <p className="text-medgrey-700 dark:text-medgrey-300"><strong>Care Plan:</strong> {rc.provisional_plan}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Active Queue & Case Review View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Queue List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-medgrey-500">
              Patients Awaiting Verification
            </h2>

            {loading ? (
              <div className="health-card p-8 text-center text-xs text-medgrey-400">
                Loading queue...
              </div>
            ) : queue.length === 0 ? (
              <div className="health-card p-8 text-center space-y-2">
                <User className="w-8 h-8 text-medgrey-300 mx-auto" />
                <div className="text-xs font-bold text-medgrey-700 dark:text-medgrey-300">
                  {t.emptyQueueTitle}
                </div>
                <p className="text-[11px] text-medgrey-400">
                  {t.emptyQueueSub}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((item) => (
                  <button
                    key={item.patient_id + item.session_id}
                    type="button"
                    onClick={() => selectPatient(item.patient_id, item.session_id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      selectedPatientId === item.patient_id
                        ? 'bg-medblue-50/80 dark:bg-medblue-950/40 border-medblue-500 shadow-sm'
                        : 'health-card hover:border-medblue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-medgrey-900 dark:text-white">
                        {item.patient_name}
                      </span>
                      {item.has_red_flags && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300">
                          RED FLAG
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-medblue-600 dark:text-medblue-400 font-medium">
                      {item.medikiosk_id} • {item.gender}, {item.age}y
                    </div>
                    <p className="text-[11px] text-medgrey-500 dark:text-medgrey-400 mt-1 line-clamp-1">
                      {item.chief_complaint}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Case Review Workspace (8 cols) */}
          <div className="lg:col-span-8">
            {!fullRecord ? (
              <div className="health-card p-12 text-center text-xs text-medgrey-400">
                Select a patient from the queue or search by ID to review clinical intake.
              </div>
            ) : (
              <div className="health-card p-6 sm:p-8 space-y-6">
                
                {/* Patient Case Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-medgrey-200 dark:border-medgrey-700 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-medgrey-900 dark:text-white">
                        {fullRecord.patient?.full_name}
                      </h2>
                      <span className="text-xs font-mono font-bold text-medblue-600 dark:text-medblue-400 px-2 py-0.5 bg-medblue-50 dark:bg-medblue-950/60 rounded">
                        {fullRecord.patient?.medikiosk_id}
                      </span>
                    </div>
                    <p className="text-xs text-medgrey-500 mt-0.5">
                      {fullRecord.patient?.age} yrs • {fullRecord.patient?.gender} • Blood Group: {fullRecord.patient?.blood_group || 'N/A'} • {fullRecord.patient?.phone}
                    </p>
                  </div>

                  {/* FHIR Export Button */}
                  <button
                    onClick={handleExportFhir}
                    className="px-3.5 py-2 bg-medgrey-100 dark:bg-medgrey-800 hover:bg-medgrey-200 dark:hover:bg-medgrey-700 text-medgrey-800 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto border border-medgrey-200 dark:border-medgrey-700"
                  >
                    <Download className="w-3.5 h-3.5 text-medblue-600" />
                    {t.exportFhirButton}
                  </button>
                </div>

                {/* Red Flags Alert if Present */}
                {fullRecord.red_flags && fullRecord.red_flags.length > 0 && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <span className="font-bold">Clinical Red Flag: </span>
                      {fullRecord.red_flags.map((rf: any) => rf.title).join(', ')}
                    </div>
                  </div>
                )}

                {/* Longitudinal AI Summary Box */}
                {fullRecord.summary && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-medblue-700 dark:text-medblue-400 uppercase tracking-wider">
                      {t.caseReviewTitle}
                    </div>

                    <div className="p-4 rounded-xl bg-medblue-50/40 dark:bg-medgrey-800/60 border border-medblue-200 dark:border-medgrey-700 space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-medgrey-800 dark:text-medgrey-200">{t.chiefComplaint}: </span>
                        <span className="text-medgrey-900 dark:text-white">{fullRecord.summary.chief_complaint_summary}</span>
                      </div>
                      <div>
                        <span className="font-bold text-medgrey-800 dark:text-medgrey-200">{t.hpiTitle}: </span>
                        <span className="text-medgrey-700 dark:text-medgrey-300">{fullRecord.summary.hpi_summary}</span>
                      </div>
                      <div>
                        <span className="font-bold text-medgrey-800 dark:text-medgrey-200">{t.medicalHistorySection}: </span>
                        <span className="text-medgrey-700 dark:text-medgrey-300">{fullRecord.summary.past_history_summary} {fullRecord.summary.medications_summary}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attached Document Evidence Section */}
                <div>
                  <div className="text-xs font-bold text-medgrey-800 dark:text-medgrey-200 uppercase tracking-wider mb-2">
                    {t.documentsEvidenceSection}
                  </div>

                  {(!fullRecord.medical_history || fullRecord.medical_history.length === 0) && (!fullRecord.documents || fullRecord.documents.length === 0) ? (
                    <div className="p-4 text-center text-xs text-medgrey-400 bg-medgrey-50 dark:bg-medgrey-800/40 rounded-xl border border-medgrey-200 dark:border-medgrey-700">
                      No documents or lab scans attached to this intake.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fullRecord.medical_history?.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-xl border border-medgrey-200 dark:border-medgrey-700 bg-medgrey-50 dark:bg-medgrey-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-medblue-600 shrink-0" />
                            <div>
                              <span className="font-bold text-medgrey-900 dark:text-white">{doc.title}</span>
                              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-medgrey-200 dark:bg-medgrey-700">
                                {doc.record_type}
                              </span>
                              {doc.ocr_extracted_text && (
                                <p className="text-[11px] text-medgrey-500 dark:text-medgrey-400 mt-0.5">
                                  {doc.ocr_extracted_text.slice(0, 100)}...
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-medgrey-400">
                            {doc.date_recorded}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clinical Verification Checkboxes */}
                {fullRecord.medications && fullRecord.medications.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-medgrey-800 dark:text-medgrey-200 uppercase tracking-wider">
                      Verify Active Medications
                    </div>
                    <div className="space-y-1.5">
                      {fullRecord.medications.map((med: any) => (
                        <div
                          key={med.id}
                          className="p-2.5 rounded-xl border border-medgrey-200 dark:border-medgrey-700 bg-white dark:bg-medgrey-900 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-medgrey-900 dark:text-white">{med.drug_name}</span>
                            <span className="text-medgrey-500 ml-1">({med.dosage}, {med.frequency})</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {verifications[med.id] === 'CONFIRMED' || med.doctor_verified ? (
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-full flex items-center gap-1 border border-emerald-300">
                                <Check className="w-3 h-3" /> {t.verifiedBadge}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleVerifyField(med.id, 'medication', 'CONFIRMED')}
                                className="px-2.5 py-1 bg-medblue-50 dark:bg-medblue-950 text-medblue-600 dark:text-medblue-300 rounded-lg text-[11px] font-bold border border-medblue-200 hover:bg-medblue-100 transition-colors"
                              >
                                {t.verifyFieldButton}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Notes & Provisional Treatment Plan */}
                <div className="space-y-3 pt-2 border-t border-medgrey-200 dark:border-medgrey-700">
                  <div>
                    <label className="block text-xs font-bold text-medgrey-800 dark:text-medgrey-200 mb-1">
                      {t.clinicalNotesLabel} *
                    </label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Enter physician assessment, clinical observations, or confirmed diagnosis..."
                      className="w-full p-3 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs focus:ring-2 focus:ring-medblue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-medgrey-800 dark:text-medgrey-200 mb-1">
                      {t.prescriptionPlanLabel} *
                    </label>
                    <textarea
                      rows={3}
                      value={provisionalPlan}
                      onChange={(e) => setProvisionalPlan(e.target.value)}
                      placeholder="1. Prescribe medications / dosages...&#10;2. Order follow-up diagnostic investigations...&#10;3. Lifestyle / dietary recommendations..."
                      className="w-full p-3 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs focus:ring-2 focus:ring-medblue-500 focus:outline-none"
                    />
                  </div>

                  {signedOff && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t.signOffSuccess}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSignOff}
                    disabled={signingOff || signedOff}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {signingOff ? 'Signing off...' : signedOff ? 'Case Signed Off' : t.signOffCaseButton}
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* FHIR R4 Bundle Modal */}
      {fhirModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-medgrey-800 p-6 rounded-2xl max-w-2xl w-full border border-medgrey-200 dark:border-medgrey-700 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-medgrey-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-medblue-600" />
                Interoperable FHIR R4 Clinical Bundle
              </h3>
              <button
                onClick={() => setFhirModalOpen(false)}
                className="text-medgrey-400 hover:text-medgrey-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
              Standards-compliant HL7 FHIR R4 JSON document containing Patient, Encounter, Condition, and Observation resources for ABDM Health Information Exchange.
            </p>

            <div className="bg-medgrey-900 text-emerald-400 font-mono text-[11px] p-4 rounded-xl max-h-80 overflow-y-auto">
              {fhirLoading ? (
                'Generating FHIR bundle...'
              ) : (
                <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setFhirModalOpen(false)}
                className="px-5 py-2 bg-medgrey-200 dark:bg-medgrey-700 text-medgrey-800 dark:text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
