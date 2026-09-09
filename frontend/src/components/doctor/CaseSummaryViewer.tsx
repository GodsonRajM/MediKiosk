"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { RedFlagBanner } from "@/components/common/RedFlagBanner";
import { FhirExportModal } from "./FhirExportModal";
import { 
  User, 
  CheckCircle2, 
  Clock, 
  FileText, 
  FileCode, 
  ArrowLeft,
  Calendar,
  AlertCircle,
  Pill,
  Activity
} from "lucide-react";

interface CaseSummaryViewerProps {
  patientId: string;
  onBack: () => void;
}

export const CaseSummaryViewer: React.FC<CaseSummaryViewerProps> = ({ patientId, onBack }) => {
  const { t } = useApp();
  const [caseData, setCaseData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showFhir, setShowFhir] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCase();
  }, [patientId]);

  const loadCase = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getPatientCase(patientId);
      setCaseData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load patient clinical case.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!caseData?.summary?.id) return;
    setVerifying(true);
    try {
      await ApiService.verifySummary(
        patientId,
        caseData.summary.id,
        "Reviewed and verified by attending OPD physician."
      );
      setVerified(true);
    } catch (err: any) {
      alert(err.message || "Failed to record verification.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="health-card p-12 text-center">
        <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-medgrey-500 mt-3">Loading authorized clinical case...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="health-card p-8 space-y-4 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-medgrey-900 dark:text-white">
          Access Denied or Not Found
        </h3>
        <p className="text-xs text-medgrey-500 max-w-sm mx-auto">
          {error || "Could not retrieve clinical records."}
        </p>
        <button onClick={onBack} className="health-btn-secondary text-xs py-2 px-4 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const { patient, summary, red_flags, history, timeline, documents, fhir_bundle } = caseData;
  const summaryJson = summary?.summary_json || {};

  return (
    <div className="space-y-6">
      
      {/* Top Nav & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-medgrey-600 dark:text-medgrey-300 hover:text-medblue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patient Queue
        </button>

        <div className="flex items-center gap-2">
          {fhir_bundle && (
            <button
              onClick={() => setShowFhir(true)}
              className="health-btn-secondary text-xs py-2 px-3.5"
            >
              <FileCode className="w-4 h-4 text-medblue-600" />
              {t.exportFhir}
            </button>
          )}

          <button
            onClick={handleVerify}
            disabled={verifying || verified}
            className={`text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition-all ${
              verified
                ? "bg-emerald-600 text-white shadow-sm"
                : "health-btn-primary"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {verified ? t.verifiedByDoctor : t.markVerified}
          </button>
        </div>
      </div>

      {/* Patient Demographic Banner */}
      <div className="health-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-medblue-600 text-white flex items-center justify-center font-bold text-lg">
            {patient.full_name?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-medgrey-900 dark:text-white">
                {patient.full_name}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 font-semibold border border-medblue-200 dark:border-medblue-800">
                {patient.medikiosk_id}
              </span>
            </div>
            <p className="text-xs text-medgrey-500 mt-0.5">
              Age {patient.age || "N/A"} • Phone: {patient.phone || "N/A"} • Blood: {patient.blood_group || "N/A"}
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-medgrey-200 dark:sm:border-medgrey-700 sm:pl-4">
          <span className="text-[10px] uppercase font-bold text-medgrey-400">Clinical Status</span>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Case Intake Ready
          </p>
        </div>
      </div>

      {/* Red Flags Banner */}
      <RedFlagBanner alerts={red_flags} />

      {/* AI Pre-Consultation Summary Card */}
      <div className="health-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-medgrey-100 dark:border-medgrey-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-medgrey-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-medblue-600" />
            AI-Prepared Pre-Consultation Summary
          </h3>
          <span className="text-[11px] text-medgrey-400 italic">
            Doctor owns clinical decision
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-medgrey-50 dark:bg-medgrey-900 border border-medgrey-200/70 dark:border-medgrey-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-medgrey-400">Chief Complaint</span>
            <p className="font-bold text-medgrey-900 dark:text-white text-sm">
              {summaryJson.chief_complaint || "None recorded"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-medgrey-50 dark:bg-medgrey-900 border border-medgrey-200/70 dark:border-medgrey-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-medgrey-400">Current Medications</span>
            <p className="font-medium text-medgrey-800 dark:text-medgrey-200">
              {summaryJson.current_medications?.join(", ") || "None reported"}
            </p>
          </div>

          <div className="md:col-span-2 p-3.5 rounded-xl bg-medgrey-50 dark:bg-medgrey-900 border border-medgrey-200/70 dark:border-medgrey-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-medgrey-400">History of Present Illness (HPI)</span>
            <p className="text-medgrey-700 dark:text-medgrey-300 leading-relaxed">
              {summaryJson.history_of_present_illness || "No detailed narrative recorded."}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-medgrey-50 dark:bg-medgrey-900 border border-medgrey-200/70 dark:border-medgrey-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-medgrey-400">Past Medical Conditions</span>
            <p className="font-medium text-medgrey-800 dark:text-medgrey-200">
              {summaryJson.past_medical_history?.join(", ") || "None recorded"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-medgrey-50 dark:bg-medgrey-900 border border-medgrey-200/70 dark:border-medgrey-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-medgrey-400">Allergies</span>
            <p className="font-medium text-rose-600 dark:text-rose-400">
              {summaryJson.allergies?.join(", ") || "No known drug allergies"}
            </p>
          </div>
        </div>
      </div>

      {/* Unified Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="health-card p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-medgrey-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-medblue-600" />
            Patient Medical Timeline ({timeline.length} Events)
          </h3>

          <div className="space-y-3">
            {timeline.map((item: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-medgrey-50 dark:bg-medgrey-900 border border-medgrey-200 dark:border-medgrey-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-medgrey-900 dark:text-white">
                    {item.title}
                  </span>
                  <p className="text-medgrey-500 mt-0.5">{item.description}</p>
                </div>
                <span className="text-[11px] text-medgrey-400 font-mono shrink-0">
                  {item.event_date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Documents */}
      {documents && documents.length > 0 && (
        <div className="health-card p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-medgrey-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-medblue-600" />
            Uploaded Documents & OCR Insights ({documents.length})
          </h3>

          <div className="space-y-3">
            {documents.map((doc: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-medgrey-50 dark:bg-medgrey-900 border border-medgrey-200 dark:border-medgrey-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-medgrey-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-medblue-600" />
                    {doc.file_name}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    OCR Completed ({Math.round((doc.ocr_confidence || 0.95) * 100)}%)
                  </span>
                </div>
                {doc.ocr_text && (
                  <p className="text-medgrey-600 dark:text-medgrey-300 bg-white dark:bg-medgrey-800 p-2.5 rounded-lg border border-medgrey-200 dark:border-medgrey-700">
                    {doc.ocr_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FHIR Export Modal */}
      <FhirExportModal
        bundle={fhir_bundle}
        isOpen={showFhir}
        onClose={() => setShowFhir(false)}
      />

    </div>
  );
};
