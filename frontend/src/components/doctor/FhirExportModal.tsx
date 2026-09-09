"use client";

import React, { useState } from "react";
import { X, Copy, Check, Download, FileCode } from "lucide-react";

interface FhirExportModalProps {
  bundle: any;
  isOpen: boolean;
  onClose: () => void;
}

export const FhirExportModal: React.FC<FhirExportModalProps> = ({ bundle, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !bundle) return null;

  const jsonString = JSON.stringify(bundle, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fhir_bundle_${bundle.id || "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-medgrey-900 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-medgrey-200 dark:border-medgrey-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-medgrey-200 dark:border-medgrey-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-medgrey-900 dark:text-white">
                HL7 FHIR R4 JSON Bundle
              </h3>
              <p className="text-[11px] text-medgrey-500">
                Standard interoperable health record export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-medgrey-200 dark:border-medgrey-700 text-xs font-semibold text-medgrey-700 dark:text-medgrey-200 hover:bg-medgrey-50 dark:hover:bg-medgrey-800 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="health-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-medgrey-400 hover:text-medgrey-900 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* JSON Content */}
        <div className="p-4 overflow-auto flex-1 bg-medgrey-950 text-emerald-400 font-mono text-xs leading-relaxed">
          <pre>{jsonString}</pre>
        </div>

        <div className="p-3 bg-medgrey-50 dark:bg-medgrey-850 border-t border-medgrey-200 dark:border-medgrey-800 text-center text-[11px] text-medgrey-500">
          Interoperability profile: HL7 FHIR R4 Bundle (Resource types: Patient, Encounter, Observation)
        </div>

      </div>
    </div>
  );
};
