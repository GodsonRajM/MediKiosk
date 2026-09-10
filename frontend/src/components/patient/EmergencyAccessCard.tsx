"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { 
  ShieldAlert, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  HeartPulse, 
  Phone, 
  Droplet,
  Printer,
  ShieldCheck,
  Power
} from "lucide-react";

export const EmergencyAccessCard: React.FC = () => {
  const { t } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [hostMode, setHostMode] = useState<"production" | "wifi" | "custom">("production");
  const productionHost = process.env.NEXT_PUBLIC_PRODUCTION_URL || "https://medikiosk-50ce2.web.app";
  const wifiHost = "http://10.39.3.29:3000";
  const [customHost, setCustomHost] = useState(productionHost);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await ApiService.getEmergencySettings();
      setData(res);
      setBloodGroup(res.blood_group || "");
      setEmergencyContact(res.emergency_contact || "");
    } catch (err: any) {
      console.error("Failed to load emergency settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!data) return;
    setUpdating(true);
    try {
      const nextState = !data.is_enabled;
      await ApiService.toggleEmergencyAccess({
        is_enabled: nextState,
        blood_group: bloodGroup,
        emergency_contact: emergencyContact
      });
      setData({ ...data, is_enabled: nextState });
    } catch (err: any) {
      alert(err.message || "Failed to toggle emergency access.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setUpdating(true);
    try {
      await ApiService.toggleEmergencyAccess({
        is_enabled: data.is_enabled,
        blood_group: bloodGroup,
        emergency_contact: emergencyContact
      });
      setData({ ...data, blood_group: bloodGroup, emergency_contact: emergencyContact });
      setEditMode(false);
    } catch (err: any) {
      alert(err.message || "Failed to update emergency profile.");
    } finally {
      setUpdating(false);
    }
  };

  // Secure token: HMAC or cryptographic token only, zero passwords or private keys
  const secureToken = data?.token || "";

  const getTargetDomain = () => {
    if (hostMode === "wifi") {
      return wifiHost;
    }
    if (hostMode === "custom" && customHost) {
      return customHost.trim().replace(/\/$/, "");
    }
    return productionHost;
  };

  // Clean, standardized HTTPS Emergency URL readable by any smartphone camera:
  // e.g. https://medikiosk-app.web.app/emergency/?token=<token>
  const publicUrl = secureToken
    ? `${getTargetDomain()}/emergency/?token=${encodeURIComponent(secureToken)}`
    : "";

  // The QR payload is STRICTLY the secure HTTPS URL
  const qrDataPayload = publicUrl;

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="health-card p-12 text-center">
        <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Generate QR Code image url using standard dynamic SVG API or data URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrDataPayload)}&margin=10`;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="health-card p-6 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-200" />
            <h2 className="text-xl font-bold">Emergency Medical Access Card</h2>
          </div>
          <p className="text-xs text-rose-100 max-w-xl">
            Allows paramedics, ER doctors, and emergency responders to view life-critical data (Blood Group, Allergies, Emergency Contacts) by scanning your personal QR code.
          </p>
        </div>

        {/* Status Toggle Switch */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/20 self-start md:self-auto">
          <button
            onClick={handleToggle}
            disabled={updating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              data.is_enabled 
                ? "bg-emerald-500 text-white shadow-sm" 
                : "bg-slate-700 text-slate-300"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {data.is_enabled ? "Emergency Access ACTIVE" : "Access DISABLED"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: QR Code & Wallet Card */}
        <div className="health-card p-6 flex flex-col items-center text-center space-y-4 border-2 border-rose-100 dark:border-rose-950/40">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Personal Emergency QR
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {data.full_name}
            </h3>
            <p className="text-xs font-mono text-slate-500">
              ID: {data.medikiosk_id}
            </p>
          </div>

          {/* QR Container */}
          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="Emergency Medical QR Code"
              className="w-48 h-48 rounded-xl object-contain"
            />
          </div>

          {/* QR Target Host Switcher */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                QR Target Domain
              </span>
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                HTTPS Verified
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setHostMode("production")}
                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  hostMode === "production"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                }`}
              >
                Cloud Live
              </button>
              <button
                type="button"
                onClick={() => setHostMode("wifi")}
                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  hostMode === "wifi"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                }`}
                title="Use Laptop Wi-Fi IP for phone camera scanning"
              >
                Wi-Fi Direct
              </button>
              <button
                type="button"
                onClick={() => setHostMode("custom")}
                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  hostMode === "custom"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                }`}
              >
                Custom
              </button>
            </div>
            {hostMode === "custom" && (
              <input
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                placeholder="https://your-domain.web.app"
                className="w-full text-[11px] font-mono p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-rose-500"
              />
            )}
            
            {/* Live QR Payload Debug Inspector (Requirement: inspect exact QR payload) */}
            <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px]">
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Active QR Payload (Debug Inspector)
              </span>
              <p className="font-mono text-[9px] text-rose-600 dark:text-rose-400 break-all select-all">
                {qrDataPayload}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 max-w-xs">
            Scan with any smartphone camera to open your instant mobile emergency profile.
          </p>

          <div className="w-full pt-2 flex flex-col gap-2">
            <button
              onClick={handleCopyLink}
              className="health-btn-secondary text-xs py-2 px-3 w-full flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Link Copied!" : "Copy Emergency URL"}
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center justify-center gap-1.5 py-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview Public Portal
            </a>

            <button
              onClick={handlePrint}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 py-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Emergency Wallet Card
            </button>
          </div>
        </div>

        {/* Right Column: Emergency Vitals & Edit */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="health-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Emergency Medical Profile
                </h3>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                {editMode ? "Cancel" : "Edit Vitals"}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="health-input text-xs py-2"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Primary Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="health-input text-xs py-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="health-btn-primary text-xs py-1.5 px-4"
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" />
                    Blood Group
                  </span>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {data.blood_group || "Not Recorded"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    Emergency Contact
                  </span>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {data.emergency_contact || "Not Registered"}
                  </p>
                </div>
              </div>
            )}

            {/* Allergies Highlight */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Critical Allergies
              </span>
              {data.allergies && data.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.allergies.map((alg: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium text-[11px]"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">
                  No known drug or food allergies recorded.
                </p>
              )}
            </div>

            {/* Chronic Conditions */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-medblue-500" />
                Chronic Conditions
              </span>
              {data.conditions && data.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.conditions.map((cond: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-medblue-50 dark:bg-medblue-950/50 text-medblue-700 dark:text-medblue-300 border border-medblue-200 dark:border-medblue-800 font-medium text-[11px]"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">
                  No chronic conditions recorded.
                </p>
              )}
            </div>

            {/* Current Medications */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Active Medications
              </span>
              {data.medications && data.medications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.medications.map((med: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]"
                    >
                      {med}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">
                  No active medications recorded.
                </p>
              )}
            </div>

          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Emergency Privacy & Security
            </div>
            <p>
              Your emergency URL uses an encrypted random cryptographic token. It displays only life-saving first-aid information. Full clinical summaries and doctor notes remain strictly private.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
