"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { ApiService, getApiBase } from "@/lib/api";
import { Header } from "@/components/common/Header";
import { ServerConfigModal } from "@/components/common/ServerConfigModal";
import { 
  Activity, 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  AlertCircle,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Server
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, t } = useApp();

  // If already logged in, redirect to portal
  useEffect(() => {
    if (user) {
      if (user.role === "doctor") {
        router.push("/portal/doctor");
      } else {
        router.push("/portal/patient");
      }
    }
  }, [user, router]);

  // Check for expired session redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "1") {
        setError("Your session has expired for your security. Please sign in again.");
      }
    }
  }, []);

  // Tab State: 'patient' | 'doctor'
  const [activeTab, setActiveTab] = useState<"patient" | "doctor">("patient");
  // Mode: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  // Login Form
  const [identifier, setIdentifier] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [password, setPassword] = useState("");

  // Signup Form Fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupAge, setSignupAge] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupBlood, setSignupBlood] = useState("");
  const [signupEmergency, setSignupEmergency] = useState("");
  const [signupSpec, setSignupSpec] = useState("General Medicine");
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Forgot Password Form
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [activeApiUrl, setActiveApiUrl] = useState("");

  useEffect(() => {
    setActiveApiUrl(getApiBase());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.login(identifier, password);
      login(res.access_token, res.user);
      if (res.user.role === "doctor") {
        router.push("/portal/doctor");
      } else {
        router.push("/portal/patient");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err.message || "";
      if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        setError(`Unable to connect to backend (${activeApiUrl || getApiBase()}). Tap "Configure Server" below to connect to your laptop Wi-Fi.`);
      } else {
        setError(msg || "Invalid credentials. Please verify your ID and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      setError(t.consentWarning);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === "patient") {
        const payload = {
          full_name: signupName,
          email: signupEmail,
          password: signupPassword,
          age: Number(signupAge),
          phone: signupPhone,
          address: signupAddress,
          blood_group: signupBlood || undefined,
          emergency_contact: signupEmergency,
          consent_accepted: consentAccepted,
        };
        const res = await ApiService.registerPatient(payload);
        setNewlyCreatedId(res.user.medikiosk_id);
        login(res.access_token, res.user);
        setTimeout(() => router.push("/portal/patient"), 2000);
      } else {
        const payload = {
          full_name: signupName,
          email: signupEmail,
          password: signupPassword,
          age: Number(signupAge),
          phone: signupPhone,
          address: signupAddress,
          specialization: signupSpec,
          blood_group: signupBlood || undefined,
          emergency_contact: signupEmergency,
          consent_accepted: consentAccepted,
        };
        const res = await ApiService.registerDoctor(payload);
        setNewlyCreatedId(res.user.doctor_id);
        login(res.access_token, res.user);
        setTimeout(() => router.push("/portal/doctor"), 2000);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      const msg = err.message || "";
      if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        setError(`Unable to connect to backend (${activeApiUrl || getApiBase()}). Tap "Configure Server" below to connect to your laptop Wi-Fi.`);
      } else {
        setError(msg || "Failed to create account. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.forgotPassword(forgotEmail);
      setForgotMessage(res.message);
    } catch (err: any) {
      setError(err.message || "Could not process password recovery.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl space-y-6">
          
          {/* MediKiosk Brand Emblem Card */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-medblue-700 to-medblue-500 text-white flex items-center justify-center mx-auto shadow-md shadow-medblue-500/20">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.appName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Pre-Consultation Clinical Intake & OPD Case Preparation
              <br />
              <span className="italic">&quot;AI prepares the case; the doctor owns the clinical decision.&quot;</span>
            </p>
          </div>

          {/* Dual Role Selector Tabs */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setActiveTab("patient");
                setMode("login");
                setError(null);
              }}
              className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === "patient"
                  ? "bg-white dark:bg-slate-900 text-medblue-600 dark:text-medblue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              {t.patientLogin}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("doctor");
                setMode("login");
                setError(null);
              }}
              className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === "doctor"
                  ? "bg-white dark:bg-slate-900 text-medblue-600 dark:text-medblue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              {t.doctorLogin}
            </button>
          </div>

          {/* Main Auth Container */}
          <div className="health-card p-6 sm:p-8 space-y-5">
            
            {/* Newly Created ID Success Notification */}
            {newlyCreatedId && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Account successfully created!
                </div>
                <p>
                  Your unique generated identifier is:{" "}
                  <strong className="font-mono text-sm underline">{newlyCreatedId}</strong>.
                  Redirecting to your portal...
                </p>
              </div>
            )}

            {/* Error Feedback */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{error}</span>
                </div>
                {(error.includes("backend") || error.includes("Server") || error.includes("connect") || error.includes("fetch")) && (
                  <button
                    type="button"
                    onClick={() => setServerModalOpen(true)}
                    className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Server className="w-3.5 h-3.5" />
                    Configure Backend Server IP
                  </button>
                )}
              </div>
            )}

            {/* 1. LOGIN MODE */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {activeTab === "patient" ? t.patientId : t.doctorId}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={activeTab === "patient" ? "e.g. PS123456 or Email" : "e.g. DR123456 or Email"}
                      className="health-input pl-10 text-xs py-2.5"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {t.fullName} (Optional verification)
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your registered name..."
                    className="health-input text-xs py-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      {t.password}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                      }}
                      className="text-medblue-600 dark:text-medblue-400 hover:underline text-[11px]"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="health-input pl-10 text-xs py-2.5"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full health-btn-primary py-3 text-sm font-semibold mt-2"
                >
                  {loading ? "Authenticating..." : t.signIn}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500 text-xs">
                    New to MediKiosk?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                      }}
                      className="text-medblue-600 dark:text-medblue-400 font-bold hover:underline"
                    >
                      {t.signUp}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 2. SIGNUP MODE */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">{t.fullName}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="health-input text-xs py-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">{t.email}</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@hospital.org"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="health-input text-xs py-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">{t.createPassword}</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="health-input text-xs py-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">{t.age}</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      placeholder="e.g. 45"
                      value={signupAge}
                      onChange={(e) => setSignupAge(e.target.value)}
                      className="health-input text-xs py-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">{t.phone}</label>
                    <input
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="health-input text-xs py-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">{t.emergencyContact}</label>
                    <input
                      type="tel"
                      required
                      placeholder="+919876543211"
                      value={signupEmergency}
                      onChange={(e) => setSignupEmergency(e.target.value)}
                      className="health-input text-xs py-2"
                    />
                  </div>

                  {activeTab === "doctor" ? (
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">{t.specialization}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. General Medicine, Cardiology, AYUSH OPD"
                        value={signupSpec}
                        onChange={(e) => setSignupSpec(e.target.value)}
                        className="health-input text-xs py-2"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">{t.bloodGroup}</label>
                      <input
                        type="text"
                        placeholder="e.g. B+, O-, AB+"
                        value={signupBlood}
                        onChange={(e) => setSignupBlood(e.target.value)}
                        className="health-input text-xs py-2"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">{t.address}</label>
                    <input
                      type="text"
                      required
                      placeholder="City, District, State"
                      value={signupAddress}
                      onChange={(e) => setSignupAddress(e.target.value)}
                      className="health-input text-xs py-2"
                    />
                  </div>
                </div>

                {/* Mandatory Consent Box */}
                <div className="p-3.5 rounded-xl bg-medblue-50/80 dark:bg-medblue-950/40 border border-medblue-200 dark:border-medblue-900 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="consent-check"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-medblue-600 rounded focus:ring-medblue-500 cursor-pointer"
                    />
                    <label htmlFor="consent-check" className="text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer leading-tight">
                      <strong>{t.mandatoryConsentTitle}</strong>: {t.mandatoryConsentText}
                    </label>
                  </div>
                  {!consentAccepted && (
                    <p className="text-[10px] text-rose-500 font-semibold pl-6">
                      * {t.consentWarning}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !consentAccepted}
                  className="w-full health-btn-primary py-3 text-sm font-semibold mt-2"
                >
                  {loading ? "Creating Account..." : `Register & Generate ${activeTab === "patient" ? "Patient" : "Doctor"} ID`}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="text-medblue-600 dark:text-medblue-400 font-semibold hover:underline text-xs"
                  >
                    ← Back to {activeTab === "patient" ? "Patient" : "Doctor"} Login
                  </button>
                </div>
              </form>
            )}

            {/* 3. FORGOT PASSWORD MODE */}
            {mode === "forgot" && (
              <form onSubmit={handleForgot} className="space-y-4 text-xs">
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t.forgotPassword}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Enter your registered email address to recover your account credentials.
                  </p>
                </div>

                {forgotMessage ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <p>{forgotMessage}</p>
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="health-btn-primary py-2 px-4 text-xs w-full"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        {t.email}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="your.email@hospital.org"
                          className="health-input pl-10 text-xs py-2.5"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full health-btn-primary py-2.5 text-xs font-semibold"
                    >
                      {loading ? "Sending..." : "Send Password Instructions"}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-medblue-600 dark:text-medblue-400 font-semibold hover:underline text-xs"
                      >
                        Cancel and return to login
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* Server Connection Status Bar */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-mono truncate max-w-[200px]" title={activeApiUrl}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="truncate">{activeApiUrl ? activeApiUrl.replace(/\/api\/v1\/?$/, "") : "http://192.168.1.179:8000"}</span>
              </span>
              <button
                type="button"
                onClick={() => setServerModalOpen(true)}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 shrink-0"
              >
                <Server className="w-3.5 h-3.5" />
                Configure IP
              </button>
            </div>

          </div>

        </div>
      </main>

      <ServerConfigModal
        isOpen={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
        onSaved={(url) => setActiveApiUrl(url)}
      />
    </div>
  );
}
