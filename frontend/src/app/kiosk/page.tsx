'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { api } from '@/lib/api';
import {
  Home, User, History, Settings as SettingsIcon, Menu, X, Stethoscope,
  ChevronRight, Mic, MicOff, Volume2, ArrowRight, ArrowLeft, CheckCircle2,
  AlertTriangle, Upload, Trash2, FileText, Activity, ShieldCheck, Search, Plus
} from 'lucide-react';

export default function KioskPage() {
  const router = useRouter();
  const { lang, setLang, t, theme, toggleTheme, user, setUser } = useApp();

  // Navigation Sidebar State
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'history' | 'settings'>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Patient Profile State
  const [patient, setPatient] = useState<any>(null);
  const [profileForm, setProfileForm] = useState<any>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Doctor Selection State
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [doctorSearching, setDoctorSearching] = useState(false);

  // Clinical Intake State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [intakeStep, setIntakeStep] = useState<'SELECT_DOCTOR' | 'INTAKE_ACTIVE' | 'SUMMARY_REVIEW'>('SELECT_DOCTOR');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [activeRedFlags, setActiveRedFlags] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Medical History State (CRUD)
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    recordType: 'PRESCRIPTION',
    title: '',
    description: '',
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Check user authentication
  useEffect(() => {
    const token = localStorage.getItem('medikiosk_token');
    const savedUserStr = localStorage.getItem('medikiosk_user');

    if (!token || !savedUserStr) {
      router.push('/login');
      return;
    }

    try {
      const u = JSON.parse(savedUserStr);
      setPatient(u);
      setProfileForm({
        full_name: u.full_name || '',
        phone: u.phone || '',
        email: u.email || '',
        age: u.age || '',
        gender: u.gender || 'Male',
        address: u.address || '',
        blood_group: u.blood_group || 'B+',
        emergency_contact_name: u.emergency_contact_name || '',
        emergency_contact_phone: u.emergency_contact_phone || '',
      });

      // Load doctors and medical history
      loadDoctors();
      if (u.patient_id || u.id) {
        loadHistory(u.patient_id || u.id);
      }
    } catch (e) {
      router.push('/login');
    }
  }, []);

  // Reload history and question if language changes
  useEffect(() => {
    if (sessionId && intakeStep === 'INTAKE_ACTIVE') {
      loadNextQuestion(sessionId);
    }
  }, [lang]);

  // Load available doctors from backend
  const loadDoctors = async () => {
    try {
      const docs = await api.getDoctors();
      setDoctorsList(docs);
      if (docs.length > 0 && !selectedDoctor) {
        setSelectedDoctor(docs[0]);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  const handleSearchDoctor = async (q: string) => {
    setDoctorSearchQuery(q);
    if (!q.trim()) {
      loadDoctors();
      return;
    }
    setDoctorSearching(true);
    try {
      const results = await api.searchDoctors(q.trim());
      setDoctorsList(results);
    } catch (err) {
      console.error(err);
    } finally {
      setDoctorSearching(false);
    }
  };

  // Start Clinical Intake
  const startClinicalIntake = async () => {
    if (!patient) return;
    if (!selectedDoctor) {
      alert('Please select a doctor to consult with before starting your intake.');
      return;
    }

    try {
      // 1. Connect patient with selected doctor
      const pId = patient.patient_id || patient.id;
      await api.connectDoctor(pId, selectedDoctor.id || selectedDoctor.doctor_id);

      // 2. Start intake session
      const session = await api.createSession(pId, 'AYUSH', lang);
      setSessionId(session.id);
      setIntakeStep('INTAKE_ACTIVE');
      loadNextQuestion(session.id);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize intake session.');
    }
  };

  // Load next question from Question Graph
  const loadNextQuestion = async (sessId: string) => {
    try {
      const res = await api.getNextQuestion(sessId);
      if (res.is_complete) {
        setIntakeStep('SUMMARY_REVIEW');
        fetchCaseSummary(sessId);
      } else {
        setCurrentQuestion(res.question);
        setUserAnswer('');
      }
    } catch (err: any) {
      console.error('Failed to fetch next question:', err);
    }
  };

  // Submit answer
  const handleSubmitAnswer = async (answerText?: string) => {
    const finalAnswer = (answerText !== undefined ? answerText : userAnswer).trim();
    if (!finalAnswer && currentQuestion?.is_required) {
      alert('Please provide a response before proceeding.');
      return;
    }

    if (!sessionId || !currentQuestion) return;

    setSubmittingAnswer(true);
    try {
      await api.submitAnswer(sessionId, currentQuestion.question_id, finalAnswer, 'touch');

      // Check red flags
      const flags = await api.getRedFlags(sessionId);
      setActiveRedFlags(flags);

      // Fetch next question
      await loadNextQuestion(sessionId);
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Fetch longitudinal summary
  const fetchCaseSummary = async (sessId: string) => {
    try {
      const summary = await api.getSummary(sessId);
      setSummaryData(summary);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  // Speech Recognition (Voice Input)
  const toggleVoiceInput = () => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    if (lang === 'kn') recognition.lang = 'kn-IN';
    else if (lang === 'ta') recognition.lang = 'ta-IN';
    else if (lang === 'hi') recognition.lang = 'hi-IN';
    else recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setUserAnswer(transcript);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const pId = patient.patient_id || patient.id;
      const updated = await api.updatePatient(pId, profileForm);
      setPatient({ ...patient, ...updated });
      setUser({ ...patient, ...updated });
      setProfileMsg(t.profileSavedSuccess);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Load Medical History Records
  const loadHistory = async (pId: string) => {
    setHistoryLoading(true);
    try {
      const records = await api.getPatientHistory(pId);
      setHistoryRecords(records);
    } catch (err) {
      console.error('Failed to load history records:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle Medical Record Upload
  const handleUploadRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.title.trim() || !uploadData.file) {
      setUploadMsg('Please specify a title and select a document file.');
      return;
    }

    setUploading(true);
    setUploadMsg(null);
    try {
      const pId = patient.patient_id || patient.id;
      await api.uploadDocumentFile(pId, uploadData.file, uploadData.recordType, sessionId || undefined);

      await loadHistory(pId);
      setShowUploadModal(false);
      setUploadData({ recordType: 'PRESCRIPTION', title: '', description: '', file: null });
      alert('Document uploaded and processed successfully with OCR!');
    } catch (err: any) {
      setUploadMsg(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Delete Medical Record
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this medical record?')) return;
    try {
      const pId = patient.patient_id || patient.id;
      await api.deletePatientHistory(pId, recordId);
      setHistoryRecords(historyRecords.filter((r) => r.id !== recordId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  return (
    <div className="flex-1 flex min-h-[calc(100vh-65px)] bg-medgrey-50 dark:bg-medgrey-900 transition-colors">
      
      {/* Sliding Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-medgrey-850 border-r border-medgrey-200 dark:border-medgrey-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-medgrey-200 dark:border-medgrey-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-medblue-600 text-white flex items-center justify-center font-bold text-xs">
              MK
            </div>
            <div>
              <div className="text-xs font-bold text-medgrey-900 dark:text-white">
                {patient?.full_name || 'Patient'}
              </div>
              <div className="text-[10px] text-medblue-600 dark:text-medblue-400 font-mono font-medium">
                {patient?.medikiosk_id || 'MK-P00000'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-medgrey-500 hover:text-medgrey-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-3 space-y-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'home'
                ? 'bg-medblue-600 text-white shadow-sm'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:bg-medgrey-100 dark:hover:bg-medgrey-800'
            }`}
          >
            <Home className="w-4 h-4" />
            {t.navHome}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-medblue-600 text-white shadow-sm'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:bg-medgrey-100 dark:hover:bg-medgrey-800'
            }`}
          >
            <User className="w-4 h-4" />
            {t.navProfile}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-medblue-600 text-white shadow-sm'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:bg-medgrey-100 dark:hover:bg-medgrey-800'
            }`}
          >
            <History className="w-4 h-4" />
            {t.navHistory}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-medblue-600 text-white shadow-sm'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:bg-medgrey-100 dark:hover:bg-medgrey-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            {t.navSettings}
          </button>
        </nav>

        {/* Doctor Status Badge in Sidebar */}
        {selectedDoctor && (
          <div className="m-3 p-3 bg-medblue-50/70 dark:bg-medgrey-800 border border-medblue-200 dark:border-medgrey-700 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-medblue-700 dark:text-medblue-300 mb-1">
              {t.assignedDoctor}
            </div>
            <div className="text-xs font-bold text-medgrey-900 dark:text-white">
              {selectedDoctor.full_name}
            </div>
            <div className="text-[11px] text-medgrey-500 dark:text-medgrey-400">
              {selectedDoctor.specialization}
            </div>
          </div>
        )}
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Mobile Header with Sidebar Toggle */}
        <div className="md:hidden flex items-center justify-between p-3 bg-white dark:bg-medgrey-850 border-b border-medgrey-200 dark:border-medgrey-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-700 dark:text-medgrey-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-medgrey-800 dark:text-white">
            {activeTab.toUpperCase()}
          </span>
          <div className="w-5" />
        </div>

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
          
          {/* ============================================================ */}
          {/* TAB 1: HOME (Doctor Selector & Pre-Consultation Intake)      */}
          {/* ============================================================ */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              
              {/* Doctor Selector Card (Always prompted before intake) */}
              <div className="health-card p-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <Stethoscope className="w-5 h-5 text-medblue-600" />
                  <h2 className="text-base font-bold text-medgrey-900 dark:text-white">
                    {t.selectDoctorPrompt}
                  </h2>
                </div>

                {/* Doctor Search & Live Selection */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-medgrey-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={doctorSearchQuery}
                      onChange={(e) => handleSearchDoctor(e.target.value)}
                      placeholder={t.selectDoctorPlaceholder}
                      className="w-full pl-9 pr-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs focus:ring-2 focus:ring-medblue-500"
                    />
                  </div>

                  <select
                    value={selectedDoctor?.id || selectedDoctor?.doctor_id || ''}
                    onChange={(e) => {
                      const doc = doctorsList.find((d) => (d.id === e.target.value || d.doctor_id === e.target.value));
                      if (doc) setSelectedDoctor(doc);
                    }}
                    className="px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs font-semibold"
                  >
                    {doctorsList.length === 0 ? (
                      <option value="">No registered doctors found</option>
                    ) : (
                      doctorsList.map((d) => (
                        <option key={d.id || d.doctor_id} value={d.id || d.doctor_id}>
                          {d.full_name} ({d.specialization}) - {d.doctor_id}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Action Button */}
                {intakeStep === 'SELECT_DOCTOR' && (
                  <button
                    onClick={startClinicalIntake}
                    className="w-full sm:w-auto px-6 py-3 bg-medblue-600 hover:bg-medblue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-medblue-500/20 flex items-center justify-center gap-2"
                  >
                    {t.startIntakeButton}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Safety Red Flag Banner if Triggered */}
              {activeRedFlags.length > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      Critical Safety Red Flag Triggered
                    </div>
                    <p className="text-xs mt-1">
                      {activeRedFlags[0]?.title}: Priority clinical assessment advised. Notification dispatched to triage desk.
                    </p>
                  </div>
                </div>
              )}

              {/* Active Questioning Graph Screen */}
              {intakeStep === 'INTAKE_ACTIVE' && currentQuestion && (
                <div className="health-card p-6 sm:p-8 space-y-6">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between border-b border-medgrey-200 dark:border-medgrey-700 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-medblue-600 dark:text-medblue-400 uppercase tracking-wider">
                        {currentQuestion.section}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-medgrey-900 dark:text-white mt-1">
                        {currentQuestion.question_text}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-medgrey-500">
                        {currentQuestion.current_index} / {currentQuestion.total_nodes}
                      </span>
                    </div>
                  </div>

                  {/* Input Types */}
                  {/* Type 1: Choice options */}
                  {currentQuestion.input_type === 'choice' && currentQuestion.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentQuestion.options.map((opt: string) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setUserAnswer(opt);
                            handleSubmitAnswer(opt);
                          }}
                          className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                            userAnswer === opt
                              ? 'bg-medblue-600 text-white border-medblue-600 shadow-sm'
                              : 'bg-medgrey-50 dark:bg-medgrey-800/80 border-medgrey-200 dark:border-medgrey-700 text-medgrey-800 dark:text-medgrey-200 hover:border-medblue-400'
                          }`}
                        >
                          <span>{opt}</span>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Type 2: 1-10 Scale */}
                  {currentQuestion.input_type === 'scale' && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[11px] font-bold text-medgrey-500">
                        <span>1 (Mild)</span>
                        <span>5 (Moderate)</span>
                        <span>10 (Severe)</span>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {['1','2','3','4','5','6','7','8','9','10'].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              setUserAnswer(num);
                              handleSubmitAnswer(num);
                            }}
                            className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                              userAnswer === num
                                ? 'bg-medblue-600 text-white border-medblue-600 shadow-md'
                                : 'bg-medgrey-50 dark:bg-medgrey-800 border-medgrey-200 dark:border-medgrey-700 text-medgrey-800 dark:text-medgrey-200 hover:border-medblue-400'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Type 3: Open Text / Voice */}
                  <div className="space-y-3 pt-2">
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder={t.typeYourAnswer}
                        className="w-full p-3 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs focus:ring-2 focus:ring-medblue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Voice Microphone Button */}
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                          isListening
                            ? 'bg-rose-500 text-white border-rose-600 animate-voice-pulse'
                            : 'bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-700 dark:text-medgrey-300 border-medgrey-300 dark:border-medgrey-600 hover:bg-medgrey-200'
                        }`}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-medblue-600" />}
                        <span>{isListening ? t.voiceListening : t.voiceInputButton}</span>
                      </button>

                      {/* Next Question Submission */}
                      <button
                        type="button"
                        disabled={submittingAnswer || !userAnswer.trim()}
                        onClick={() => handleSubmitAnswer()}
                        className="px-5 py-2.5 bg-medblue-600 hover:bg-medblue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {submittingAnswer ? 'Saving...' : t.submitAnswer}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Intake Completed & Summary Review */}
              {intakeStep === 'SUMMARY_REVIEW' && (
                <div className="health-card p-6 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                    <div>
                      <h3 className="text-lg font-bold text-medgrey-900 dark:text-white">
                        {t.intakeCompleted}
                      </h3>
                      <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
                        Your clinical answers have been synthesized into an evidence-linked longitudinal case file.
                      </p>
                    </div>
                  </div>

                  {summaryData && (
                    <div className="space-y-4 pt-4 border-t border-medgrey-200 dark:border-medgrey-700 text-xs">
                      <div className="p-4 bg-medgrey-50 dark:bg-medgrey-800/60 rounded-xl border border-medgrey-200 dark:border-medgrey-700 space-y-2">
                        <div className="font-bold text-medblue-700 dark:text-medblue-300 uppercase tracking-wider text-[11px]">
                          {t.chiefComplaint}
                        </div>
                        <p className="text-medgrey-800 dark:text-medgrey-200 font-medium">
                          {summaryData.chief_complaint_summary}
                        </p>
                      </div>

                      <div className="p-4 bg-medgrey-50 dark:bg-medgrey-800/60 rounded-xl border border-medgrey-200 dark:border-medgrey-700 space-y-2">
                        <div className="font-bold text-medblue-700 dark:text-medblue-300 uppercase tracking-wider text-[11px]">
                          {t.hpiTitle}
                        </div>
                        <p className="text-medgrey-800 dark:text-medgrey-200">
                          {summaryData.hpi_summary}
                        </p>
                      </div>

                      <div className="p-4 bg-medgrey-50 dark:bg-medgrey-800/60 rounded-xl border border-medgrey-200 dark:border-medgrey-700 space-y-2">
                        <div className="font-bold text-medblue-700 dark:text-medblue-300 uppercase tracking-wider text-[11px]">
                          {t.medicalHistorySection}
                        </div>
                        <p className="text-medgrey-800 dark:text-medgrey-200">
                          {summaryData.past_history_summary}
                        </p>
                        <p className="text-medgrey-800 dark:text-medgrey-200">
                          {summaryData.medications_summary}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-4">
                    <button
                      onClick={() => setActiveTab('history')}
                      className="px-4 py-2.5 bg-medblue-600 hover:bg-medblue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Attach Supporting Scans or Prescriptions
                    </button>
                    <button
                      onClick={() => {
                        setIntakeStep('SELECT_DOCTOR');
                        setSessionId(null);
                        setCurrentQuestion(null);
                      }}
                      className="px-4 py-2.5 bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-700 dark:text-white rounded-xl text-xs font-bold"
                    >
                      New Consultation
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: PROFILE (Real Demographics & Supabase Sync)          */}
          {/* ============================================================ */}
          {activeTab === 'profile' && (
            <div className="health-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-medgrey-200 dark:border-medgrey-700 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-medgrey-900 dark:text-white">
                    {t.profileTitle}
                  </h2>
                  <p className="text-xs text-medgrey-500 dark:text-medgrey-400 mt-0.5">
                    Your verified demographic details stored in MediKiosk EHR.
                  </p>
                </div>
                <div className="px-3 py-1 bg-medblue-50 dark:bg-medblue-950/50 border border-medblue-200 dark:border-medblue-800 rounded-lg text-xs font-mono font-bold text-medblue-700 dark:text-medblue-300">
                  {patient?.medikiosk_id || 'MK-P00000'}
                </div>
              </div>

              {profileMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{profileMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.fullName}
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.phoneNumber}
                    </label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.emailAddress}
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.age} / {t.gender}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={profileForm.age}
                        onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                        placeholder="Age"
                        className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                      />
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full px-2 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                      >
                        <option value="Male">{t.genderMale}</option>
                        <option value="Female">{t.genderFemale}</option>
                        <option value="Other">{t.genderOther}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.address}
                    </label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.bloodGroup}
                    </label>
                    <select
                      value={profileForm.blood_group}
                      onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.emergencyContactName}
                    </label>
                    <input
                      type="text"
                      value={profileForm.emergency_contact_name}
                      onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })}
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.emergencyContactPhone}
                    </label>
                    <input
                      type="tel"
                      value={profileForm.emergency_contact_phone}
                      onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 bg-medblue-600 hover:bg-medblue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    {profileSaving ? 'Saving...' : t.saveProfileChanges}
                  </button>
                </div>
              </form>

              {/* Explicit Consent Active Badge */}
              <div className="p-3.5 bg-medblue-50/50 dark:bg-medgrey-800 border border-medblue-200 dark:border-medgrey-700 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-medblue-700 dark:text-medblue-300 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.consentStatusActive}</span>
                </div>
                <span className="text-[11px] text-medgrey-500">
                  ABDM / DPDP Registered
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: MEDICAL HISTORY (Real CRUD & File Upload with OCR)    */}
          {/* ============================================================ */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-medgrey-900 dark:text-white">
                    {t.historyTitle}
                  </h2>
                  <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
                    Upload and manage your medical documents, prescriptions, and lab test reports.
                  </p>
                </div>

                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2.5 bg-medblue-600 hover:bg-medblue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  {t.uploadRecordButton}
                </button>
              </div>

              {/* Records List or Clean Empty State */}
              {historyLoading ? (
                <div className="health-card p-12 text-center text-xs text-medgrey-500">
                  Loading medical records...
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="health-card p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-medblue-50 dark:bg-medgrey-800 text-medblue-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-medgrey-800 dark:text-white">
                    {t.emptyHistoryTitle}
                  </h3>
                  <p className="text-xs text-medgrey-500 dark:text-medgrey-400 max-w-md mx-auto">
                    {t.emptyHistorySub}
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-2 px-5 py-2 bg-medblue-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-medblue-700 transition-all"
                  >
                    {t.uploadRecordButton}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {historyRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="health-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-medblue-300 dark:hover:border-medblue-700 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-medblue-50 dark:bg-medblue-950/50 text-medblue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-medgrey-900 dark:text-white">
                              {rec.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-700 dark:text-medgrey-300">
                              {rec.record_type}
                            </span>
                          </div>
                          {rec.description && (
                            <p className="text-xs text-medgrey-500 dark:text-medgrey-400 mt-0.5">
                              {rec.description}
                            </p>
                          )}
                          {rec.ocr_extracted_text && (
                            <div className="mt-2 p-2 bg-medgrey-50 dark:bg-medgrey-900 rounded-lg text-[11px] text-medgrey-600 dark:text-medgrey-300 max-w-xl">
                              <span className="font-bold text-medblue-600">OCR Findings: </span>
                              {rec.ocr_extracted_text.slice(0, 150)}...
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[11px] font-mono text-medgrey-400">
                          {rec.date_recorded}
                        </span>
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title={t.deleteRecord}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Document Modal */}
              {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-medgrey-800 p-6 rounded-2xl max-w-md w-full border border-medgrey-200 dark:border-medgrey-700 shadow-2xl">
                    <h3 className="text-base font-bold text-medgrey-900 dark:text-white mb-2">
                      {t.uploadModalTitle}
                    </h3>
                    <p className="text-xs text-medgrey-500 dark:text-medgrey-400 mb-4">
                      Upload your prescription scan or lab report for automated OCR extraction.
                    </p>

                    {uploadMsg && (
                      <div className="mb-3 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs">
                        {uploadMsg}
                      </div>
                    )}

                    <form onSubmit={handleUploadRecord} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                          {t.recordType}
                        </label>
                        <select
                          value={uploadData.recordType}
                          onChange={(e) => setUploadData({ ...uploadData, recordType: e.target.value })}
                          className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                        >
                          <option value="PRESCRIPTION">{t.recordTypePrescription}</option>
                          <option value="LAB_TEST">{t.recordTypeLabTest}</option>
                          <option value="SCAN_REPORT">{t.recordTypeScanReport}</option>
                          <option value="DISCHARGE_SUMMARY">{t.recordTypeDischarge}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                          {t.recordTitle} *
                        </label>
                        <input
                          type="text"
                          required
                          value={uploadData.title}
                          onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                          placeholder="e.g. Chest X-Ray / Dr. Mehta Prescription"
                          className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                          {t.recordDescription}
                        </label>
                        <input
                          type="text"
                          value={uploadData.description}
                          onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                          placeholder="Additional notes"
                          className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                          {t.selectFile} *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          required
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setUploadData({ ...uploadData, file: e.target.files[0] });
                            }
                          }}
                          className="w-full text-xs text-medgrey-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-medblue-50 file:text-medblue-700 hover:file:bg-medblue-100 cursor-pointer"
                        />
                      </div>

                      <div className="flex gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowUploadModal(false)}
                          className="flex-1 py-2 bg-medgrey-100 dark:bg-medgrey-700 text-medgrey-700 dark:text-white rounded-xl text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={uploading}
                          className="flex-1 py-2 bg-medblue-600 hover:bg-medblue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          {uploading ? 'Processing OCR...' : 'Upload & Extract'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: SETTINGS (Language & Theme)                          */}
          {/* ============================================================ */}
          {activeTab === 'settings' && (
            <div className="health-card p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold text-medgrey-900 dark:text-white">
                {t.settingsTitle}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-medgrey-700 dark:text-medgrey-300 mb-2">
                    {t.languageLabel}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
                      { code: 'ta', label: 'தமிழ் (Tamil)' },
                      { code: 'hi', label: 'हिंदी (Hindi)' },
                    ].map((item) => (
                      <button
                        key={item.code}
                        onClick={() => setLang(item.code as any)}
                        className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          lang === item.code
                            ? 'bg-medblue-600 text-white border-medblue-600 shadow-sm'
                            : 'bg-medgrey-50 dark:bg-medgrey-800 border-medgrey-200 dark:border-medgrey-700 text-medgrey-800 dark:text-medgrey-200 hover:border-medblue-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-medgrey-200 dark:border-medgrey-700">
                  <label className="block text-xs font-bold text-medgrey-700 dark:text-medgrey-300 mb-2">
                    {t.themeLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <button
                      onClick={() => { if (theme !== 'light') toggleTheme(); }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        theme === 'light'
                          ? 'bg-medblue-600 text-white border-medblue-600 shadow-sm'
                          : 'bg-medgrey-50 dark:bg-medgrey-800 border-medgrey-200 dark:border-medgrey-700 text-medgrey-800 dark:text-medgrey-200'
                      }`}
                    >
                      {t.themeLight}
                    </button>
                    <button
                      onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        theme === 'dark'
                          ? 'bg-medblue-600 text-white border-medblue-600 shadow-sm'
                          : 'bg-medgrey-50 dark:bg-medgrey-800 border-medgrey-200 dark:border-medgrey-700 text-medgrey-800 dark:text-medgrey-200'
                      }`}
                    >
                      {t.themeDark}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-medgrey-200 dark:border-medgrey-700">
                  <div className="p-4 bg-medgrey-50 dark:bg-medgrey-800/50 rounded-xl border border-medgrey-200 dark:border-medgrey-700 text-xs text-medgrey-600 dark:text-medgrey-400 space-y-1">
                    <div className="font-bold text-medgrey-800 dark:text-medgrey-200">
                      Statutory Compliance & Data Rights
                    </div>
                    <p>{t.privacyPolicyNotice}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
