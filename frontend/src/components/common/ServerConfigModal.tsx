"use client";

import React, { useState, useEffect } from "react";
import { getApiBase, setApiBase, testApiConnection, isCapacitorApp } from "@/lib/api";
import { 
  Server, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  SlidersHorizontal,
  Check,
  Smartphone
} from "lucide-react";

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newUrl: string) => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [currentUrl, setCurrentUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getApiBase();
      setCurrentUrl(active);
      setInputUrl(active);
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async (urlToTest = inputUrl) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testApiConnection(urlToTest);
      if (res.success) {
        setTestResult({
          success: true,
          message: "Backend Connected Successfully!",
          details: `Supabase: ${res.data?.supabase_connected ? "Online" : "Offline"} • Gemini AI: ${res.data?.gemini_connected ? "Online" : "Offline"}`
        });
      } else {
        setTestResult({
          success: false,
          message: "Connection Failed",
          details: res.error || "Cannot reach server. Ensure phone & laptop are on the same Wi-Fi network."
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Connection Failed",
        details: err.message || "Network request failed"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    let clean = inputUrl.trim().replace(/\/$/, "");
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `http://${clean}`;
    }
    if (!clean.endsWith("/api/v1") && !clean.includes("/api/v1")) {
      clean = `${clean}/api/v1`;
    }
    setApiBase(clean);
    setCurrentUrl(clean);
    setSavedSuccess(true);
    if (onSaved) {
      onSaved(clean);
    }
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handlePreset = (url: string) => {
    setInputUrl(url);
    setTestResult(null);
    handleTest(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Backend Server Setup
                {isCapacitorApp() && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> APK Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your API target host
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Current Active Endpoint
            </label>
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
              {currentUrl}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Quick Connect Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePreset("http://192.168.1.179:8000/api/v1")}
                className="flex items-center gap-2 p-2 rounded-xl text-left border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 transition-all text-xs group"
              >
                <Wifi className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Laptop Wi-Fi</div>
                  <div className="text-[10px] text-slate-400 truncate">192.168.1.179:8000</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset("http://localhost:8000/api/v1")}
                className="flex items-center gap-2 p-2 rounded-xl text-left border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 transition-all text-xs group"
              >
                <Server className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Localhost</div>
                  <div className="text-[10px] text-slate-400 truncate">localhost:8000</div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom URL input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Server URL / IP Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://192.168.1.179:8000/api/v1"
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleTest()}
                disabled={testing || !inputUrl.trim()}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                )}
                Test
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isCapacitorApp()
                ? "Phone & laptop must be connected to the same Wi-Fi network."
                : "Enter backend host IP or cloud URL."}
            </p>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs animate-in fade-in duration-200 ${
                testResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.details && (
                <p className="text-[11px] mt-1 pl-6 opacity-90">{testResult.details}</p>
              )}
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Settings saved! Reconnecting to new endpoint...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};
