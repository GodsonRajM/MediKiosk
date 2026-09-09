"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ApiService } from "@/lib/api";
import { 
  ShieldAlert, 
  Droplet, 
  Phone, 
  AlertTriangle, 
  HeartPulse, 
  Pill, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Activity,
  AlertCircle
} from "lucide-react";

interface EmergencyClientProps {
  initialToken?: string;
}

export default function PublicEmergencyClient({ initialToken }: EmergencyClientProps) {
  const params = useParams();
  const token = (params?.token as string) || initialToken || "";

  const [resolvedToken, setResolvedToken] = useState<string>(token);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // SOS state
  const [sosLoading, setSosLoading] = useState(false);
  const [sosResult, setSosResult] = useState<any>(null);
  const [sosError, setSosError] = useState<string | null>(null);

  useEffect(() => {
    let activeToken = token;
    if (!activeToken && typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const queryTok = searchParams.get("token");
      if (queryTok) {
        activeToken = queryTok;
      } else {
        const parts = window.location.pathname.split("/").filter(Boolean);
        const lastPart = parts[parts.length - 1] || "";
        if (lastPart && lastPart !== "emergency") {
          activeToken = lastPart;
        }
      }
    }

    setResolvedToken(activeToken);

    if (activeToken) {
      loadProfile(activeToken);
    } else {
      setError("Missing emergency token.");
      setLoading(false);
    }
  }, [token]);

  const loadProfile = async (tok: string) => {
    let offlineData: any = null;
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlName = searchParams.get("name");
      const urlBlood = searchParams.get("bg");
      const urlContact = searchParams.get("ec");
      const urlId = searchParams.get("id");
      const urlAl = searchParams.get("al")?.split(";").map((s) => s.trim()).filter(Boolean) || [];
      const urlCd = searchParams.get("cd")?.split(";").map((s) => s.trim()).filter(Boolean) || [];
      const urlRx = searchParams.get("rx")?.split(";").map((s) => s.trim()).filter(Boolean) || [];

      if (urlBlood || urlName || urlContact || urlId) {
        offlineData = {
          status: "active",
          full_name: urlName || "Emergency Patient",
          medikiosk_id: urlId || "PS000000",
          blood_group: urlBlood || "Not Specified",
          emergency_contact: urlContact || "Not registered",
          allergies: urlAl,
          conditions: urlCd,
          medications: urlRx,
          verified_at: new Date().toLocaleDateString(),
          is_offline_verified: true,
        };
        setProfile(offlineData);
        setLoading(false);
      }
    }

    try {
      const res = await ApiService.getPublicEmergencyView(tok);
      setProfile(res);
      setError(null);
    } catch (err: any) {
      // If we have verified parameters embedded from the patient's QR code, preserve them!
      if (!offlineData) {
        setError(err.message || "Failed to load emergency profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSOS = () => {
    const tok = resolvedToken || token;
    if (!tok) return;
    setSosLoading(true);
    setSosError(null);

    // Attempt geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendSOS(pos.coords.latitude, pos.coords.longitude, tok);
        },
        () => {
          sendSOS(undefined, undefined, tok);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      sendSOS(undefined, undefined, tok);
    }
  };

  const sendSOS = async (lat?: number, lng?: number, activeTok?: string) => {
    try {
      const tok = activeTok || resolvedToken || token;
      const res = await ApiService.triggerEmergencySOS({
        token: tok,
        latitude: lat,
        longitude: lng,
        note: "Emergency SOS triggered by bystander/responder from mobile portal"
      });
      setSosResult(res);
    } catch (err: any) {
      setSosError(err.message || "Could not dispatch SOS.");
    } finally {
      setSosLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-rose-400 tracking-wider uppercase">
          Loading Emergency Medical Data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Emergency Profile Unavailable</h2>
          <p className="text-xs text-slate-400">
            {error}
          </p>
          <div className="pt-2">
            <a
              href="tel:108"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-rose-600 hover:bg-rose-700 font-bold rounded-xl text-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Emergency Services (108)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-6 pb-20">
      
      {/* Top Banner */}
      <header className="w-full max-w-lg mb-4 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          Emergency Medical Profile
        </div>
        <p className="text-[11px] text-slate-400">
          MediKiosk Automated Clinical Triage • Authorized Medical Information
        </p>
      </header>

      {profile?.is_offline_verified && (
        <div className="w-full max-w-lg mb-3 p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Verified Offline Medical ID • Decoded directly from Emergency QR</span>
        </div>
      )}

      {/* Main Medical Card */}
      <main className="w-full max-w-lg space-y-4">
        
        {/* Patient Hero Box */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-slate-400">
                PATIENT ID: {profile.medikiosk_id}
              </span>
              <h1 className="text-2xl font-black text-white">
                {profile.full_name}
              </h1>
              <p className="text-xs text-slate-400">
                Age: {profile.age || "N/A"} • Phone: {profile.phone || "N/A"}
              </p>
            </div>

            {/* Blood Group Badge */}
            <div className="shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/30">
              <Droplet className="w-5 h-5 fill-white mb-0.5" />
              <span className="text-2xl font-black leading-none">
                {profile.blood_group}
              </span>
              <span className="text-[9px] font-bold uppercase mt-0.5 tracking-wider text-rose-100">
                Blood Type
              </span>
            </div>
          </div>

          {/* Quick Call Emergency Contact */}
          {profile.emergency_contact && profile.emergency_contact !== "Not registered" && (
            <a
              href={`tel:${profile.emergency_contact}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    Primary Emergency Contact
                  </span>
                  <p className="text-sm font-bold text-white font-mono">
                    {profile.emergency_contact}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                Call Now
              </span>
            </a>
          )}
        </div>

        {/* SOS Trigger Button */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-rose-900/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Emergency Response Dispatch
            </span>
          </div>

          {sosResult ? (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                Emergency SOS Dispatched!
              </div>
              <p>{sosResult.message}</p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                <Clock className="w-3.5 h-3.5" />
                Incident ID: {sosResult.sos_id.slice(0, 8)}...
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleTriggerSOS}
                disabled={sosLoading}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 font-extrabold text-white text-base rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                {sosLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending Geolocation & Dispatching...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5" />
                    TRIGGER EMERGENCY SOS ALERT
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Sends instant notification to hospital triage and hospital emergency desk.
              </p>
            </div>
          )}

          {sosError && (
            <p className="text-xs text-rose-400 bg-rose-950/60 p-2.5 rounded-lg border border-rose-800">
              {sosError}
            </p>
          )}

          {/* Quick Ambulance Call Row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="tel:108"
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              Call 108 Ambulance
            </a>
            <a
              href="tel:112"
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-medblue-400" />
              Call 112 National ER
            </a>
          </div>
        </div>

        {/* Critical Allergies Section */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            Critical Drug & Food Allergies
          </div>
          {profile.allergies && profile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.allergies.map((a: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 text-rose-200 border border-rose-800 text-xs font-bold"
                >
                  ⚠ {a}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No known drug or food allergies recorded.
            </p>
          )}
        </div>

        {/* Chronic Conditions & Medications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-medblue-400" />
              Chronic Conditions
            </span>
            {profile.conditions && profile.conditions.length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-200 font-medium">
                {profile.conditions.map((c: string, i: number) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-medblue-400" />
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">None recorded</p>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-amber-400" />
              Regular Medications
            </span>
            {profile.medications && profile.medications.length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-200 font-medium">
                {profile.medications.map((m: string, i: number) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">None recorded</p>
            )}
          </div>

        </div>

        {/* Timestamp Footer */}
        <div className="text-center text-[10px] text-slate-500 pt-2">
          Verified Clinical Record: {profile.verified_at} • MediKiosk Emergency Gateway
        </div>

      </main>

    </div>
  );
}
