"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { RedFlagBanner } from "@/components/common/RedFlagBanner";
import { GeminiLiveVoiceClient, VoiceState } from "@/lib/geminiLiveClient";
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare,
  FileCheck2,
  Volume2,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface ClinicalIntakeGraphProps {
  onIntakeCompleted?: () => void;
}

export const ClinicalIntakeGraph: React.FC<ClinicalIntakeGraphProps> = ({ onIntakeCompleted }) => {
  const { language, t } = useApp();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [redFlags, setRedFlags] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Real Gemini Live Voice Assistant state
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceMessage, setVoiceMessage] = useState<string>("");
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);
  const voiceClientRef = useRef<GeminiLiveVoiceClient | null>(null);

  useEffect(() => {
    // Initialize Voice Client with real callbacks
    voiceClientRef.current = new GeminiLiveVoiceClient({
      onStateChange: (state, message) => {
        setVoiceState(state);
        if (message) setVoiceMessage(message);
      },
      onTranscription: (transcript) => {
        setTextAnswer(transcript);
      },
      onAnswerExtracted: (answer) => {
        setTextAnswer(answer);
        setSelectedOption(answer);
      },
      onError: (err) => {
        setError(err);
      },
    });

    initializeIntake();

    return () => {
      voiceClientRef.current?.stop();
    };
  }, [language]);

  const initializeIntake = async () => {
    setLoading(true);
    setError(null);
    try {
      const conn = await ApiService.getCurrentConnection();
      const docId = conn?.doctor?.id;
      const res = await ApiService.startInterview(undefined, docId, language);
      setSessionId(res.session_id);
      setCurrentQuestion(res.question);
    } catch (err: any) {
      setError(err.message || "Failed to start clinical interview.");
    } finally {
      setLoading(false);
    }
  };

  const handleReadQuestion = async () => {
    if (!currentQuestion || isSpeakingQuestion) return;
    const qText = currentQuestion?.text?.[language] || currentQuestion?.text?.["en"] || "";
    if (!qText) return;

    setIsSpeakingQuestion(true);
    try {
      await voiceClientRef.current?.readQuestionAloud(qText, language);
    } finally {
      setIsSpeakingQuestion(false);
    }
  };

  const handleToggleVoice = async () => {
    setError(null);
    if (!voiceClientRef.current) return;

    if (voiceState === "listening") {
      // User tapped Stop -> Process recorded audio with Gemini AI
      try {
        const result = await voiceClientRef.current.stopAndSubmit();
        if (result.answer) {
          // Submit structured answer to adaptive graph and Supabase
          await handleSubmit(result.answer);
        }
      } catch {
        // Handled in callback
      }
      return;
    }

    if (voiceState === "connecting" || voiceState === "processing") {
      voiceClientRef.current.stop();
      return;
    }

    // Start Voice Intake
    const qText = currentQuestion?.text?.[language] || currentQuestion?.text?.["en"] || "Clinical Question";
    const qField = currentQuestion?.clinical_field || "chief_complaint";

    await voiceClientRef.current.startVoiceIntake(qText, qField, language);
  };

  const handleSubmit = async (answerVal?: string) => {
    const finalAnswer = answerVal || selectedOption || textAnswer;
    if (!finalAnswer.trim() || !sessionId || !currentQuestion) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await ApiService.submitAnswer(
        sessionId,
        currentQuestion.id,
        finalAnswer,
        language
      );

      if (res.red_flags && res.red_flags.length > 0) {
        setRedFlags(res.red_flags);
      }

      if (res.is_completed) {
        setIsCompleted(true);
        setSummary(res.summary);
        if (onIntakeCompleted) onIntakeCompleted();
      } else {
        setCurrentQuestion(res.question);
        setSelectedOption("");
        setTextAnswer("");
        setVoiceState("idle");
        setVoiceMessage("");
      }
    } catch (err: any) {
      setError(err.message || "Error submitting answer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="health-card p-12 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-medblue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-medgrey-600 dark:text-medgrey-300">
          Preparing Clinical Question Graph...
        </p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="health-card p-6 sm:p-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-medgrey-900 dark:text-white">
            {t.intakeComplete}
          </h2>
          <p className="text-sm text-medgrey-600 dark:text-medgrey-400 max-w-md mx-auto">
            {t.summaryPrepared}
          </p>
        </div>

        {/* Red Flags Banner */}
        <RedFlagBanner alerts={redFlags} />

        {/* Structured Summary Preview */}
        {summary && summary.summary_json && (
          <div className="p-5 rounded-2xl bg-medgrey-50 dark:bg-medgrey-900 border border-medgrey-200 dark:border-medgrey-800 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-medblue-600 dark:text-medblue-400 font-bold uppercase tracking-wider text-[11px]">
              <FileCheck2 className="w-4 h-4" />
              Pre-Consultation Case Record
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-medgrey-800 dark:text-medgrey-200">
              <div className="p-3 rounded-xl bg-white dark:bg-medgrey-800 border border-medgrey-200/70 dark:border-medgrey-700">
                <span className="text-[10px] text-medgrey-400 uppercase font-semibold">Chief Complaint</span>
                <p className="font-bold mt-0.5">{summary.summary_json.chief_complaint || "Recorded"}</p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-medgrey-800 border border-medgrey-200/70 dark:border-medgrey-700">
                <span className="text-[10px] text-medgrey-400 uppercase font-semibold">Attending Physician</span>
                <p className="font-bold mt-0.5">OPD Doctor Review Queue</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-medgrey-800 border border-medgrey-200/70 dark:border-medgrey-700">
              <span className="text-[10px] text-medgrey-400 uppercase font-semibold">Clinical Narrative</span>
              <p className="mt-1 leading-relaxed">{summary.summary_json.history_of_present_illness}</p>
            </div>

            <p className="text-[11px] text-medgrey-400 italic text-center">
              *"AI prepares the case; the doctor owns the clinical decision."*
            </p>
          </div>
        )}
      </div>
    );
  }

  // Active Question Display
  const questionText = currentQuestion?.text?.[language] || currentQuestion?.text?.["en"] || "Clinical Question";

  return (
    <div className="health-card p-6 sm:p-8 space-y-6">
      
      {/* Top Banner & Progress Header */}
      <div className="flex items-center justify-between pb-4 border-b border-medgrey-100 dark:border-medgrey-800">
        <div className="flex items-center gap-2 text-medblue-600 dark:text-medblue-400">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {currentQuestion?.section || "Clinical Intake"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReadQuestion}
            disabled={isSpeakingQuestion}
            title="Listen to question"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeakingQuestion ? "text-medblue-600 animate-pulse" : ""}`} />
            <span className="hidden sm:inline text-[11px]">Read Aloud</span>
          </button>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 border border-medblue-200 dark:border-medblue-800">
            Gemini Live AI
          </span>
        </div>
      </div>

      {/* Red Flags Banner */}
      <RedFlagBanner alerts={redFlags} />

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[11px] underline font-semibold ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Question Prompt */}
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-medgrey-900 dark:text-white leading-snug">
          {questionText}
        </h2>
        <p className="text-xs text-medgrey-500">
          Touch an option below, speak via Voice Assistant, or type your response.
        </p>
      </div>

      {/* Gemini Voice Assistant Live State Banner */}
      {voiceState !== "idle" && (
        <div className={`p-4 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 ${
          voiceState === "listening"
            ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse"
            : voiceState === "connecting"
            ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
            : voiceState === "processing"
            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300"
            : voiceState === "answered"
            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
            : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        }`}>
          <div className="flex items-center gap-2.5">
            {voiceState === "listening" ? (
              <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            ) : voiceState === "processing" || voiceState === "connecting" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span className="font-semibold">{voiceMessage || `State: ${voiceState}`}</span>
          </div>

          {voiceState === "listening" && (
            <button
              onClick={handleToggleVoice}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-rose-700"
            >
              Done Speaking
            </button>
          )}
        </div>
      )}

      {/* Dynamic Options or Text Input */}
      {currentQuestion?.options && currentQuestion.options.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {currentQuestion.options.map((opt: any) => {
            const optLabel = opt.label?.[language] || opt.label?.["en"] || opt.value;
            const isSelected = selectedOption === opt.value;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedOption(opt.value);
                  handleSubmit(opt.value);
                }}
                disabled={submitting}
                className={`p-4 rounded-xl border text-left font-medium text-sm transition-all duration-150 flex items-center justify-between ${
                  isSelected
                    ? "border-medblue-600 bg-medblue-50/80 dark:bg-medblue-950/60 text-medblue-700 dark:text-medblue-300 ring-2 ring-medblue-500"
                    : "border-medgrey-200 dark:border-medgrey-700 hover:border-medblue-400 hover:bg-medgrey-50 dark:hover:bg-medgrey-800 text-medgrey-800 dark:text-medgrey-100"
                }`}
              >
                <span>{optLabel}</span>
                <ArrowRight className="w-4 h-4 text-medgrey-400 opacity-60" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your medical answer here or tap Speak..."
            rows={3}
            className="health-input"
          />
        </div>
      )}

      {/* Voice & Manual Submit Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-medgrey-100 dark:border-medgrey-800">
        <button
          onClick={handleToggleVoice}
          disabled={voiceState === "processing"}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            voiceState === "listening"
              ? "bg-rose-600 text-white border-rose-700 shadow-md animate-pulse"
              : voiceState === "connecting"
              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300"
              : "bg-white dark:bg-medgrey-800 border-medgrey-300 dark:border-medgrey-700 text-medgrey-700 dark:text-medgrey-200 hover:bg-medgrey-50"
          }`}
        >
          {voiceState === "listening" ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4 text-medblue-600" />
          )}
          {voiceState === "listening"
            ? "Stop & Submit Voice"
            : voiceState === "connecting"
            ? "Connecting..."
            : voiceState === "processing"
            ? "Processing Voice..."
            : "Gemini Voice Assistant"}
        </button>

        <button
          onClick={() => handleSubmit()}
          disabled={submitting || (!selectedOption && !textAnswer.trim())}
          className="w-full sm:w-auto health-btn-primary py-2.5 px-6 text-sm"
        >
          {submitting ? "Processing..." : t.nextQuestion}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
