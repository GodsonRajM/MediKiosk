"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { 
  FileUp, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  ShieldCheck,
  AlertCircle 
} from "lucide-react";

interface DocumentUploaderProps {
  onUploadSuccess?: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUploadSuccess }) => {
  const { t } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await ApiService.uploadDocument(formData);
      setResult(res);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to upload and process document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="health-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 flex items-center justify-center">
          <FileUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-medgrey-900 dark:text-white">
            {t.uploadDocument}
          </h3>
          <p className="text-xs text-medgrey-500">
            {t.uploadDesc}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Drag and drop upload box */}
      <div className="border-2 border-dashed border-medgrey-300 dark:border-medgrey-700 rounded-2xl p-6 sm:p-8 text-center space-y-3 bg-medgrey-50/50 dark:bg-medgrey-800/30 hover:border-medblue-400 transition-colors">
        <FileText className="w-8 h-8 text-medgrey-400 mx-auto" />
        <div>
          <label className="cursor-pointer font-semibold text-xs text-medblue-600 dark:text-medblue-400 hover:underline">
            Choose a file
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <span className="text-xs text-medgrey-500"> or drag and drop</span>
          <p className="text-[11px] text-medgrey-400 mt-1">PDF, JPG, PNG up to 25MB</p>
        </div>

        {file && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-medblue-50 dark:bg-medblue-950/60 text-medblue-700 dark:text-medblue-300 text-xs font-medium border border-medblue-200 dark:border-medblue-800">
            <FileText className="w-4 h-4" />
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="health-btn-primary text-xs py-2.5 px-6"
        >
          {uploading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running Gemini Vision OCR...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Upload & Process OCR
            </>
          )}
        </button>
      </div>

      {/* OCR Result Presentation */}
      {result && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              OCR Extraction Succeeded
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              Confidence: {Math.round(result.ocr_confidence * 100)}%
            </span>
          </div>

          {result.extracted_text && (
            <div className="p-3 rounded-xl bg-white dark:bg-medgrey-900 border border-emerald-100 dark:border-emerald-900/40 text-medgrey-700 dark:text-medgrey-200">
              <span className="text-[10px] uppercase font-semibold text-medgrey-400">Extracted Text</span>
              <p className="mt-0.5 whitespace-pre-wrap">{result.extracted_text}</p>
            </div>
          )}

          {result.entities && result.entities.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-medgrey-400">
                Extracted Clinical Entities ({result.entities.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {result.entities.map((ent: any, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-medgrey-900 border border-emerald-200 dark:border-emerald-900 text-[11px] font-medium text-emerald-900 dark:text-emerald-200"
                  >
                    <strong>{ent.entity_name}:</strong> {ent.entity_value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
