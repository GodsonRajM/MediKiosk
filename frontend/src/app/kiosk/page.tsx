'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Question, RedFlag, AyushAssessment } from '@/types';
import {
  Mic, MicOff, Volume2, CheckCircle2, AlertTriangle, FileUp, Sparkles,
  ArrowRight, ArrowLeft, HeartPulse, Shield, Globe, User, Clock, Check
} from 'lucide-react';

export default function KioskPage() {
  const router = useRouter();

  // Kiosk Flow Step
  const [step, setStep] = useState<
    'IDENTIFICATION' | 'LANGUAGE' | 'CONSENT' | 'CHIEF_COMPLAINT' |
    'INTERVIEW' | 'AYUSH' | 'DOCUMENTS' | 'SUMMARY_REVIEW' | 'COMPLETED'
  >('IDENTIFICATION');

  // Patient / Session State
  const [patientId, setPatientId] = useState('11111111-1111-1111-1111-111111111111');
  const [medikioskId, setMedikioskId] = useState('MK-000001');
  const [patientName, setPatientName] = useState('Sundaram Ramaswamy');
  const [selectedLanguage, setSelectedLanguage] = useState('ta');
  const [sessionId, setSessionId] = useState('22222222-2222-2222-2222-222222222222');
  
  // Consents State
  const [consents, setConsents] = useState<Record<string, boolean>>({
    CLINICAL_HISTORY: true,
    VOICE_PROCESSING: true,
    MEDICAL_DOCUMENTS: true,
    DOCTOR_SHARING: true,
    RESEARCH_ANALYTICS: false
  });

  // Clinical Interview State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeRedFlags, setActiveRedFlags] = useState<RedFlag[]>([]);
  const [interviewComplete, setInterviewComplete] = useState(false);

  // Document Upload State
  const [uploadedDoc, setUploadedDoc] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Case Summary State
  const [caseSummary, setCaseSummary] = useState<any>(null);

  // Initialize and load initial state
  useEffect(() => {
    // Pre-populate with demo patient data
    loadNextQuestion();
  }, [sessionId, selectedLanguage]);

  // Load next question from Clinical Question Graph
  const loadNextQuestion = async () => {
    try {
      const res = await api.getNextQuestion(sessionId);
      if (res.is_complete) {
        setInterviewComplete(true);
      } else {
        setCurrentQuestion(res.question);
        setUserAnswer('');
        // Optional voice prompt
        speakText(res.question.question_text);
      }
    } catch (e) {
      console.warn("Could not load next question from API, using fallback graph question");
    }
  };

  // Text-To-Speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Web Speech API or Fallback Voice Toggle
  const toggleVoiceRecording = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage === 'ta' ? 'ta-IN' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserAnswer(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    } else {
      // Demo Voice Simulation fallback for browsers without mic permission
      setIsListening(true);
      setTimeout(() => {
        if (currentQuestion?.question_id === 'CHIEF_COMPLAINT') {
          setUserAnswer("Retrosternal chest heaviness and breathlessness on exertion for past 2 days");
        } else {
          setUserAnswer("Pressure sensation, rated around 6 out of 10, worse when climbing stairs");
        }
        setIsListening(false);
      }, 1500);
    }
  };

  // Answer Submission handler
  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    try {
      const res = await api.submitAnswer(sessionId, currentQuestion.question_id, userAnswer, 'voice');
      // If red flags triggered
      if (res.active_red_flags_count > 0) {
        const flags = await api.getRedFlags(sessionId);
        setActiveRedFlags(flags);
      }
      await loadNextQuestion();
    } catch (e) {
      // Local progression fallback
      await loadNextQuestion();
    }
  };

  // Simulate Document Upload
  const handleSimulateDocUpload = async () => {
    setOcrLoading(true);
    setTimeout(() => {
      setUploadedDoc({
        file_name: "hba1c_lab_report_june2026.pdf",
        test_name: "HbA1c (Glycated Hemoglobin)",
        result_value: "8.2 %",
        reference_range: "< 5.7 %",
        is_abnormal: true,
        confidence: 0.97
      });
      setOcrLoading(false);
    }, 1200);
  };

  // Load Final Summary
  const handleFetchSummary = async () => {
    try {
      const summary = await api.getSummary(sessionId);
      setCaseSummary(summary);
    } catch (e) {
      setCaseSummary({
        chief_complaint_summary: "Patient presents with retrosternal chest heaviness and breathlessness for past 2 days.",
        hpi_summary: "Severity rated 6/10. Aggravated by walking/climbing stairs, relieved by rest. Associated with mild dyspnea.",
        past_history_summary: "Type 2 Diabetes Mellitus (2018), Essential Hypertension (2020).",
        medications_summary: "Metformin 500mg BD, Amlodipine 5mg OD (Good compliance).",
        allergies_summary: "Penicillin allergy documented in previous records. Contradiction flagged for physician review.",
        investigations_summary: "Uploaded lab report shows HbA1c: 8.2% (Uncontrolled). Creatinine normal (1.0 mg/dL).",
        ayush_summary: "Prakriti: Pitta-Kapha. Vikriti: Prana Vata and Sadhaka Pitta disturbance. Ahara Shakti: Sluggish digestion.",
        red_flags_summary: "CRITICAL: Priority clinical assessment recommended for exertional chest pain + dyspnea with cardiovascular risk factors.",
        evidence_links: [
          { field: "Chief Complaint", source: "PATIENT_INTERVIEW", confidence: 0.95, reference: "Voice Node CC_01" },
          { field: "HbA1c 8.2%", source: "OCR", confidence: 0.97, reference: "Uploaded Lab Document" }
        ]
      });
    }
    setStep('SUMMARY_REVIEW');
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      
      {/* Kiosk Header / Step Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Kiosk Station 01
            </span>
            <span className="text-xs text-slate-400">Patient: <strong className="text-white">{patientName} ({medikioskId})</strong></span>
          </div>
        </div>

        {/* Step Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs">
          {['IDENTIFICATION', 'LANGUAGE', 'CONSENT', 'INTERVIEW', 'AYUSH', 'DOCUMENTS', 'SUMMARY_REVIEW'].map((s, idx) => (
            <div
              key={s}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                step === s
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-500 bg-slate-900 border border-slate-800'
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Safety Red Flag Banner */}
      {activeRedFlags.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-200 flex items-start gap-3.5 shadow-lg shadow-rose-500/10 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-rose-300 uppercase tracking-wide">Safety Alert: Priority Clinical Assessment Recommended</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/30 text-rose-200">Non-Diagnostic Rule</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Exertional chest discomfort with shortness of breath detected. Hospital triage station has been notified for immediate doctor room priority.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: IDENTIFICATION & LOGIN CHECK */}
      {/* ========================================================================= */}
      {step === 'IDENTIFICATION' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
              <User className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Patient Identification</h2>
            <p className="text-sm text-slate-300">
              Welcome to the pre-consultation case-taking station. Please verify your identity details.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Internal MediKiosk ID</span>
              <span className="text-sm font-bold text-sky-400">{medikioskId}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Patient Name</span>
              <span className="text-sm font-semibold text-white">{patientName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Age & Gender</span>
              <span className="text-sm font-medium text-slate-200">52 Years, Male</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-slate-400">Linked ABHA Number</span>
              <span className="text-xs font-mono text-emerald-400">91-4521-8890-1234</span>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setStep('LANGUAGE')}
              className="px-8 py-3.5 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-sky-500/20 flex items-center gap-2.5 transition-all"
            >
              <span>Confirm & Select Language</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: LANGUAGE SELECTION */}
      {/* ========================================================================= */}
      {step === 'LANGUAGE' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Select Preferred Language</h2>
            <p className="text-sm text-slate-300">
              The kiosk will speak and display questions in your chosen language.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { code: 'ta', name: 'தமிழ் (Tamil)', desc: 'வணக்கம், உங்கள் மொழியில் உரையாடுங்கள்' },
              { code: 'en', name: 'English', desc: 'Pre-consultation clinical voice intake' },
              { code: 'hi', name: 'हिंदी (Hindi)', desc: 'नमस्ते, अपनी भाषा में परामर्श लें' }
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => setSelectedLanguage(l.code)}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedLanguage === l.code
                    ? 'bg-sky-500/20 border-sky-500 ring-2 ring-sky-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white">{l.name}</span>
                    {selectedLanguage === l.code && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
                  </div>
                  <p className="text-xs text-slate-400">{l.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center max-w-2xl mx-auto pt-4">
            <button
              onClick={() => setStep('IDENTIFICATION')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep('CONSENT')}
              className="px-8 py-3.5 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              Proceed to Consent <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: GRANULAR CONSENT */}
      {/* ========================================================================= */}
      {step === 'CONSENT' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Informed Patient Consent</h2>
            <p className="text-sm text-slate-300">
              MediKiosk collects and structures your clinical history to assist the physician. Your data is protected by strict privacy safeguards.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {[
              { id: 'CLINICAL_HISTORY', title: 'Clinical History Intake', desc: 'Allows recording of current symptoms and past conditions for doctor review.' },
              { id: 'VOICE_PROCESSING', title: 'Voice & Audio Processing', desc: 'Permits speech-to-text to transcribe your spoken answers into structured text.' },
              { id: 'MEDICAL_DOCUMENTS', title: 'Document Scanning & OCR', desc: 'Allows camera/file OCR to extract laboratory values and active prescriptions.' },
              { id: 'DOCTOR_SHARING', title: 'Doctor Dashboard Sharing', desc: 'Hands the verified clinical case summary directly to the consulting physician.' },
              { id: 'RESEARCH_ANALYTICS', title: 'Anonymized Research (Optional)', desc: 'Never mandatory for medical care. Fully de-identified research use only.' }
            ].map((c) => (
              <div
                key={c.id}
                onClick={() => setConsents(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  consents[c.id]
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!consents[c.id]}
                  onChange={() => {}}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-emerald-500 mt-0.5 shrink-0"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{c.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center max-w-2xl mx-auto pt-4">
            <button
              onClick={() => setStep('LANGUAGE')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep('INTERVIEW')}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              Record Consent & Start Interview <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: ADAPTIVE CLINICAL INTERVIEW (Voice + Touch fallback) */}
      {/* ========================================================================= */}
      {step === 'INTERVIEW' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          {/* Question Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {currentQuestion?.section || 'History of Present Illness'}
            </span>
            <span className="text-xs text-slate-400">
              Question {currentQuestion?.current_index || 1} of {currentQuestion?.total_nodes || 12}
            </span>
          </div>

          {/* Question Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-2xl text-center space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {currentQuestion?.question_text || "What is the primary medical issue or symptom bringing you in today?"}
            </h3>

            {/* Audio Button to re-listen */}
            <button
              onClick={() => speakText(currentQuestion?.question_text || '')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              Listen to question again
            </button>
          </div>

          {/* Input Modality: Voice Target + Touch Choices */}
          <div className="space-y-4">
            
            {/* Voice Button */}
            <div className="flex flex-col items-center justify-center p-4">
              <button
                onClick={toggleVoiceRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-voice-pulse ring-4 ring-rose-500/50'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-xl shadow-sky-500/30 hover:scale-105'
                }`}
                title="Tap to speak"
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
              <p className="text-xs font-semibold text-slate-400 mt-2">
                {isListening ? 'Listening to your voice... Speak now' : 'Tap to speak your answer'}
              </p>
            </div>

            {/* Answer Display & Typing Fallback */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Your Answer (Voice Transcript or Touch selection):
              </label>
              <textarea
                rows={2}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Spoken words will appear here, or you can type/select below..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Multi-Choice / Scale Touch Options */}
            {currentQuestion?.options && currentQuestion.options.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">Quick Touch Options:</span>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setUserAnswer(opt)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        userAnswer === opt
                          ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nav / Continue buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep('CONSENT')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('AYUSH')}
                className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-semibold rounded-xl"
              >
                Skip to AYUSH Mode
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={!userAnswer.trim()}
                className="px-8 py-3.5 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2 disabled:opacity-40"
              >
                Next Question <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: AYUSH MODE (Dashavidha Pariksha & Ahara-Vihara) */}
      {/* ========================================================================= */}
      {step === 'AYUSH' && (
        <div className="glass-panel-gold p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-100">AYUSH Clinical Assessment</h2>
            <p className="text-xs text-amber-200/80">
              Capturing classical Dashavidha Pariksha (Ten-fold examination) and Ahara-Vihara (Diet & Regimen) parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Prakriti & Vikriti Card */}
            <div className="bg-slate-950/80 border border-amber-500/30 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <span>1. Baseline Prakriti & Vikriti</span>
              </h3>
              <p className="text-xs text-slate-300">
                Preliminary estimation based on thermal sensitivity, physical frame, and sleep characteristics:
              </p>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex justify-between items-center">
                <span className="text-xs font-semibold text-amber-200">Constitutional Type (Prakriti)</span>
                <span className="text-xs font-bold text-white px-2.5 py-1 rounded bg-amber-600/30 border border-amber-500/40">
                  Pitta-Kapha (V25% P45% K30%)
                </span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-300">Doshic Imbalance (Vikriti)</span>
                <span className="text-xs font-bold text-rose-300">Prana Vata / Sadhaka Pitta</span>
              </div>
            </div>

            {/* Agni & Ahara Shakti */}
            <div className="bg-slate-950/80 border border-amber-500/30 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-amber-300">2. Ahara Shakti (Digestive Capacity)</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg">
                  <span className="text-slate-300">Abhyavaharana Shakti (Intake Power)</span>
                  <span className="font-semibold text-amber-300">Madhyama (Moderate)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg">
                  <span className="text-slate-300">Jarana Shakti (Digestion Speed)</span>
                  <span className="font-semibold text-rose-300">Avara (Sluggish / Heaviness)</span>
                </div>
              </div>
            </div>

            {/* Vyayama & Sara */}
            <div className="bg-slate-950/80 border border-amber-500/30 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-amber-300">3. Vyayama Shakti (Physical Stamina)</h3>
              <p className="text-xs text-slate-300">
                Patient reports fatigue and breathlessness upon climbing stairs or walking briskly.
              </p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                  Avara (Reduced Stamina)
                </span>
              </div>
            </div>

            {/* Ahara-Vihara Routine */}
            <div className="bg-slate-950/80 border border-amber-500/30 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-amber-300">4. Ahara-Vihara (Diet & Sleep)</h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>• <strong>Diet:</strong> Warm, cooked South Indian vegetarian meals; irregular lunch hours.</li>
                <li>• <strong>Sleep:</strong> 6 hours; disturbed past 2 nights by chest tightness.</li>
                <li>• <strong>Exercise:</strong> Walking 15 mins/day, recently discontinued due to dyspnea.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-amber-500/20">
            <button
              onClick={() => setStep('INTERVIEW')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Questions
            </button>
            <button
              onClick={() => setStep('DOCUMENTS')}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              Confirm AYUSH & Scan Documents <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: MEDICAL DOCUMENTS & OCR SCANNING */}
      {/* ========================================================================= */}
      {step === 'DOCUMENTS' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-2">
              <FileUp className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Upload / Scan Clinical Records</h2>
            <p className="text-xs text-slate-300">
              Hold previous prescriptions or laboratory reports up to the camera or upload a file. The OCR engine will extract clinical entities.
            </p>
          </div>

          {/* Scanner Simulation Card */}
          <div className="max-w-xl mx-auto border-2 border-dashed border-slate-700 hover:border-sky-500/50 p-6 rounded-2xl text-center space-y-3 bg-slate-900/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <FileUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Scan Prescription or Lab Report</p>
              <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG (Max 15MB)</p>
            </div>
            <button
              onClick={handleSimulateDocUpload}
              disabled={ocrLoading}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 transition-colors disabled:opacity-50"
            >
              {ocrLoading ? 'Processing OCR & Extracting Facts...' : 'Simulate Scan: Lab Report (HbA1c)'}
            </button>
          </div>

          {/* Extracted Document View */}
          {uploadedDoc && (
            <div className="max-w-xl mx-auto bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> OCR Extraction Successful
                </span>
                <span className="text-[11px] font-mono text-slate-400">Confidence: 97%</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex justify-between p-2 bg-slate-800 rounded-lg">
                  <span className="text-slate-400">Test Extracted:</span>
                  <span className="font-semibold">{uploadedDoc.test_name}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-800 rounded-lg">
                  <span className="text-slate-400">Result Value:</span>
                  <span className="font-bold text-rose-400">{uploadedDoc.result_value} (Abnormal / High Risk)</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-800 rounded-lg">
                  <span className="text-slate-400">Reference Range:</span>
                  <span>{uploadedDoc.reference_range}</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-300">
                ⚠️ Handwriting/OCR extracted values carry a confidence score and are subject to final doctor verification.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center max-w-xl mx-auto pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep('AYUSH')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleFetchSummary}
              className="px-8 py-3.5 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              Generate Case Summary <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: LONGITUDINAL AI CASE SUMMARY REVIEW */}
      {/* ========================================================================= */}
      {step === 'SUMMARY_REVIEW' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Pre-Consultation Case Summary</h2>
            <p className="text-xs text-slate-300">
              Please review the case summary prepared by AI for your doctor. You may request corrections if needed.
            </p>
          </div>

          {caseSummary && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Chief Complaint & HPI */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Chief Complaint & Present History</h4>
                <p className="text-sm font-medium text-white">{caseSummary.chief_complaint_summary}</p>
                <p className="text-xs text-slate-300">{caseSummary.hpi_summary}</p>
              </div>

              {/* Past History & Meds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Long-Term Medical History</h4>
                  <p className="text-xs text-slate-200">{caseSummary.past_history_summary}</p>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Active Medications</h4>
                  <p className="text-xs text-slate-200">{caseSummary.medications_summary}</p>
                </div>
              </div>

              {/* Allergy Contradiction Alert */}
              <div className="bg-amber-500/10 border border-amber-500/40 p-4 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Cross-Check Alert: Documented Allergy
                </h4>
                <p className="text-xs text-amber-100">
                  {caseSummary.allergies_summary}
                </p>
              </div>

              {/* AYUSH Overview */}
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-amber-400 uppercase">AYUSH Dashavidha Pariksha Findings</h4>
                <p className="text-xs text-slate-300">{caseSummary.ayush_summary}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center max-w-3xl mx-auto pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep('DOCUMENTS')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep('COMPLETED')}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              Submit to Doctor & Get Token <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 8: QUEUE TOKEN GENERATED & COMPLETED */}
      {/* ========================================================================= */}
      {step === 'COMPLETED' && (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center max-w-xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
            <Check className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              Intake Transferred to OPD Doctor
            </span>
            <h2 className="text-3xl font-extrabold text-white">You Are All Set!</h2>
            <p className="text-xs text-slate-300">
              Your clinical history, AYUSH assessment, and lab documents have been handed over to the physician.
            </p>
          </div>

          {/* Queue Token Card */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl space-y-3">
            <div className="text-xs text-slate-400 uppercase font-semibold">Your Consultation Queue Token</div>
            <div className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
              OPD-12
            </div>
            <div className="flex justify-center items-center gap-4 text-xs text-slate-300 pt-2">
              <span>Patient: <strong>{patientName}</strong></span>
              <span>•</span>
              <span>ID: <strong>{medikioskId}</strong></span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              Priority Priority: High (Due to Red Flag Alert)
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => router.push('/doctor')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              Open Doctor Portal (Review Case) <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setStep('IDENTIFICATION');
                setActiveRedFlags([]);
              }}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl border border-slate-800"
            >
              Start Another Patient
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
