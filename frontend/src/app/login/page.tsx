'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { api } from '@/lib/api';
import { Stethoscope, Lock, Mail, Phone, KeyRound, UserCheck, ShieldCheck, ArrowRight, UserPlus, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setUser } = useApp();

  // Mode: Patient or Doctor login
  const [roleMode, setRoleMode] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sign Up Modal
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [regRole, setRegRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'Male',
    address: '',
    bloodGroup: 'B+',
    emergencyContactName: '',
    emergencyContactPhone: '',
    specialization: 'General Medicine',
    licenseNumber: '',
    preferredLanguage: lang,
    consentGranted: false,
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Consent Terms Modal
  const [showConsentTermsModal, setShowConsentTermsModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your credentials to sign in.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(identifier.trim(), password.trim(), roleMode);
      localStorage.setItem('medikiosk_token', res.access_token);
      localStorage.setItem('medikiosk_user', JSON.stringify(res.user));
      setUser(res.user);

      if (res.user.role === 'DOCTOR') {
        router.push('/doctor');
      } else {
        router.push('/kiosk');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials or register for an account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    if (!forgotId.trim() || !newPassword.trim()) {
      setForgotMsg({ type: 'error', text: 'Please fill in both fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setForgotMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotId.trim(), newPassword.trim());
      setForgotMsg({ type: 'success', text: res.message || t.resetSuccess });
      setIdentifier(forgotId.trim());
      setPassword('');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotMsg(null);
      }, 2000);
    } catch (err: any) {
      setForgotMsg({ type: 'error', text: err.message || 'Failed to reset password.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    // Validate Mandatory Consent Gatekeeper
    if (!regData.consentGranted) {
      setRegError('Mandatory consent required: You must explicitly agree to the clinical data collection terms to proceed.');
      return;
    }

    if (!regData.fullName.trim() || !regData.phone.trim() || !regData.password.trim()) {
      setRegError('Please provide full name, mobile number, and password.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    setRegLoading(true);
    try {
      let res;
      if (regRole === 'PATIENT') {
        res = await api.registerPatient({
          full_name: regData.fullName.trim(),
          phone: regData.phone.trim(),
          email: regData.email.trim() || undefined,
          password: regData.password.trim(),
          age: regData.age ? parseInt(regData.age) : undefined,
          gender: regData.gender,
          address: regData.address.trim() || undefined,
          blood_group: regData.bloodGroup || undefined,
          emergency_contact_name: regData.emergencyContactName.trim() || undefined,
          emergency_contact_phone: regData.emergencyContactPhone.trim() || undefined,
          preferred_language: lang,
          consent_granted: true,
        });
      } else {
        res = await api.registerDoctor({
          full_name: regData.fullName.trim(),
          email: regData.email.trim(),
          phone: regData.phone.trim(),
          password: regData.password.trim(),
          specialization: regData.specialization.trim(),
          license_number: regData.licenseNumber.trim() || undefined,
          address: regData.address.trim() || undefined,
          blood_group: regData.bloodGroup || undefined,
          consent_granted: true,
        });
      }

      localStorage.setItem('medikiosk_token', res.access_token);
      localStorage.setItem('medikiosk_user', JSON.stringify(res.user));
      setUser(res.user);
      setShowSignUpModal(false);

      if (regRole === 'DOCTOR') {
        router.push('/doctor');
      } else {
        router.push('/kiosk');
      }
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Generate simulated Google OAuth profile or connect to Supabase
    const email = prompt('Enter your Google account email to sign in:');
    if (!email || !email.includes('@')) return;

    setLoading(true);
    try {
      const res = await api.googleAuth({
        email: email.trim(),
        name: email.split('@')[0],
        role: roleMode,
      });
      localStorage.setItem('medikiosk_token', res.access_token);
      localStorage.setItem('medikiosk_user', JSON.stringify(res.user));
      setUser(res.user);
      if (roleMode === 'DOCTOR') router.push('/doctor');
      else router.push('/kiosk');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-medgrey-100/50 to-medblue-50/30 dark:from-medgrey-900 dark:to-medgrey-950">
      <div className="w-full max-w-md bg-white dark:bg-medgrey-800 rounded-2xl shadow-xl border border-medgrey-200 dark:border-medgrey-700 p-6 sm:p-8 transition-all">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-medblue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-medblue-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-medgrey-900 dark:text-white">
            {t.brandName}
          </h1>
          <p className="text-xs text-medgrey-500 dark:text-medgrey-400 mt-1">
            {t.brandTagline}
          </p>
        </div>

        {/* Top Tabs: PATIENT LOGIN | DOCTOR LOGIN */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-medgrey-100 dark:bg-medgrey-700/60 rounded-xl mb-6 border border-medgrey-200 dark:border-medgrey-700">
          <button
            type="button"
            onClick={() => { setRoleMode('PATIENT'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              roleMode === 'PATIENT'
                ? 'bg-medblue-600 text-white shadow-sm'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:text-medblue-600 dark:hover:text-white'
            }`}
          >
            {t.patientLoginTab}
          </button>
          <button
            type="button"
            onClick={() => { setRoleMode('DOCTOR'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              roleMode === 'DOCTOR'
                ? 'bg-medblue-600 text-white shadow-sm'
                : 'text-medgrey-600 dark:text-medgrey-300 hover:text-medblue-600 dark:hover:text-white'
            }`}
          >
            {t.doctorLoginTab}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1.5">
              {roleMode === 'PATIENT' ? t.patientIdOrEmail : t.doctorIdOrEmail}
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={roleMode === 'PATIENT' ? "MK-P10001 or +91..." : "MK-D10001 or doctor@hospital.com"}
                required
                className="w-full pl-3.5 pr-4 py-2.5 rounded-xl border border-medgrey-300 dark:border-medgrey-600 bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-medblue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-medgrey-700 dark:text-medgrey-300">
                {t.password}
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotId(identifier); }}
                className="text-xs text-medblue-600 dark:text-medblue-400 hover:underline font-medium"
              >
                {t.forgotPasswordButton}
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-3.5 pr-4 py-2.5 rounded-xl border border-medgrey-300 dark:border-medgrey-600 bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-medblue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-medblue-600 hover:bg-medblue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-medblue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : t.signInButton}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-medgrey-200 dark:bg-medgrey-700" />
          <span className="text-[11px] uppercase tracking-wider text-medgrey-400 font-semibold">{t.orContinueWith}</span>
          <div className="h-px flex-1 bg-medgrey-200 dark:bg-medgrey-700" />
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 bg-white dark:bg-medgrey-900 hover:bg-medgrey-50 dark:hover:bg-medgrey-750 border border-medgrey-300 dark:border-medgrey-600 text-medgrey-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {t.signInWithGoogle}
        </button>

        {/* Sign Up Section */}
        <div className="mt-6 pt-5 border-t border-medgrey-200 dark:border-medgrey-700 text-center">
          <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
            {t.dontHaveAccount}{' '}
            <button
              type="button"
              onClick={() => {
                setRegRole(roleMode);
                setShowSignUpModal(true);
              }}
              className="text-medblue-600 dark:text-medblue-400 font-bold hover:underline ml-1"
            >
              {t.signUpButton}
            </button>
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-medgrey-800 p-6 rounded-2xl max-w-md w-full border border-medgrey-200 dark:border-medgrey-700 shadow-2xl">
            <h3 className="text-lg font-bold text-medgrey-900 dark:text-white mb-2">
              {t.forgotPasswordModalTitle}
            </h3>
            <p className="text-xs text-medgrey-500 dark:text-medgrey-400 mb-4">
              Enter your MediKiosk ID, registered phone, or email to set a new password.
            </p>

            {forgotMsg && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                forgotMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200'
              }`}>
                {forgotMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                  MediKiosk ID / Phone / Email
                </label>
                <input
                  type="text"
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)}
                  placeholder="MK-P10001 or +91..."
                  required
                  className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs focus:ring-2 focus:ring-medblue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                  {t.newPassword}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs focus:ring-2 focus:ring-medblue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(false); setForgotMsg(null); }}
                  className="flex-1 py-2 bg-medgrey-100 dark:bg-medgrey-700 text-medgrey-700 dark:text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2 bg-medblue-600 hover:bg-medblue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {forgotLoading ? 'Updating...' : t.resetPasswordSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Up Modal with Mandatory Explicit Consent Gatekeeper */}
      {showSignUpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-medgrey-800 p-6 sm:p-8 rounded-2xl max-w-xl w-full border border-medgrey-200 dark:border-medgrey-700 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-medgrey-900 dark:text-white">
                  {t.registerTitle}
                </h3>
                <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
                  Fill in your details to generate your verified healthcare credentials.
                </p>
              </div>
              <button
                onClick={() => setShowSignUpModal(false)}
                className="text-medgrey-400 hover:text-medgrey-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Role Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-medgrey-100 dark:bg-medgrey-700 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRegRole('PATIENT')}
                className={`py-2 rounded-lg transition-all ${
                  regRole === 'PATIENT' ? 'bg-medblue-600 text-white shadow-sm' : 'text-medgrey-600 dark:text-medgrey-300'
                }`}
              >
                {t.registerAsPatient}
              </button>
              <button
                type="button"
                onClick={() => setRegRole('DOCTOR')}
                className={`py-2 rounded-lg transition-all ${
                  regRole === 'DOCTOR' ? 'bg-medblue-600 text-white shadow-sm' : 'text-medgrey-600 dark:text-medgrey-300'
                }`}
              >
                {t.registerAsDoctor}
              </button>
            </div>

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.fullName}
                    onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                    {t.phoneNumber} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                    {t.emailAddress} {regRole === 'DOCTOR' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="email"
                    required={regRole === 'DOCTOR'}
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="user@domain.com"
                    className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                  />
                </div>

                {regRole === 'PATIENT' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.age} / {t.gender}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={regData.age}
                        onChange={(e) => setRegData({ ...regData, age: e.target.value })}
                        placeholder="Age"
                        className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                      />
                      <select
                        value={regData.gender}
                        onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                        className="w-full px-2 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                      >
                        <option value="Male">{t.genderMale}</option>
                        <option value="Female">{t.genderFemale}</option>
                        <option value="Other">{t.genderOther}</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.specialization} *
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.specialization}
                      onChange={(e) => setRegData({ ...regData, specialization: e.target.value })}
                      placeholder="e.g. Cardiologist, AYUSH Vaidya"
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                    {t.address}
                  </label>
                  <input
                    type="text"
                    value={regData.address}
                    onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                    placeholder="City, State"
                    className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                    {t.bloodGroup}
                  </label>
                  <select
                    value={regData.bloodGroup}
                    onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
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

                {regRole === 'PATIENT' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                        {t.emergencyContactName}
                      </label>
                      <input
                        type="text"
                        value={regData.emergencyContactName}
                        onChange={(e) => setRegData({ ...regData, emergencyContactName: e.target.value })}
                        placeholder="Relative Name"
                        className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                        {t.emergencyContactPhone}
                      </label>
                      <input
                        type="tel"
                        value={regData.emergencyContactPhone}
                        onChange={(e) => setRegData({ ...regData, emergencyContactPhone: e.target.value })}
                        placeholder="+91..."
                        className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                      />
                    </div>
                  </>
                )}

                {regRole === 'DOCTOR' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                      {t.licenseNumber}
                    </label>
                    <input
                      type="text"
                      value={regData.licenseNumber}
                      onChange={(e) => setRegData({ ...regData, licenseNumber: e.target.value })}
                      placeholder="e.g. KMC-12345"
                      className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                    {t.password} *
                  </label>
                  <input
                    type="password"
                    required
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-medgrey-700 dark:text-medgrey-300 mb-1">
                    {t.confirmPassword} *
                  </label>
                  <input
                    type="password"
                    required
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 border border-medgrey-300 dark:border-medgrey-600 rounded-xl bg-white dark:bg-medgrey-900 text-medgrey-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* MANDATORY EXPLICIT CONSENT GATEKEEPER */}
              <div className="mt-4 p-3.5 bg-medblue-50/60 dark:bg-medgrey-900 border border-medblue-200 dark:border-medblue-900 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regData.consentGranted}
                    onChange={(e) => setRegData({ ...regData, consentGranted: e.target.checked })}
                    className="mt-1 w-4 h-4 text-medblue-600 border-medgrey-300 rounded focus:ring-medblue-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-medgrey-700 dark:text-medgrey-300 leading-snug">
                    <span className="font-bold text-medblue-800 dark:text-medblue-300">[Mandatory Consent] </span>
                    {t.mandatoryConsentLabel}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setShowConsentTermsModal(true); }}
                      className="block text-medblue-600 dark:text-medblue-400 font-bold hover:underline mt-1"
                    >
                      {t.consentAgreementLink}
                    </button>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSignUpModal(false)}
                  className="flex-1 py-2.5 bg-medgrey-100 dark:bg-medgrey-700 text-medgrey-700 dark:text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading || !regData.consentGranted}
                  className="flex-1 py-2.5 bg-medblue-600 hover:bg-medblue-700 disabled:bg-medgrey-300 dark:disabled:bg-medgrey-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-medblue-500/20 disabled:cursor-not-allowed"
                >
                  {regLoading ? 'Registering...' : t.signUpButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Consent Agreement Terms Modal */}
      {showConsentTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-medgrey-800 p-6 rounded-2xl max-w-lg w-full border border-medgrey-200 dark:border-medgrey-700 shadow-2xl">
            <div className="flex items-center gap-2 mb-3 text-medblue-600 dark:text-medblue-400">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-lg font-bold text-medgrey-900 dark:text-white">
                {t.consentAgreementModalTitle}
              </h3>
            </div>
            <div className="max-h-72 overflow-y-auto text-xs text-medgrey-600 dark:text-medgrey-300 space-y-2.5 pr-2">
              <p className="font-semibold text-medgrey-800 dark:text-medgrey-200">
                Statutory Notice under Digital Personal Data Protection (DPDP) Act 2023 & Ayushman Bharat Digital Mission (ABDM):
              </p>
              <p>
                {t.consentAgreementBody}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-medgrey-500 dark:text-medgrey-400">
                <li>Your data is used solely to generate clinical intake summaries for licensed doctors.</li>
                <li>MediKiosk does NOT sell or distribute your personal health information to third-party commercial entities.</li>
                <li>All medical records and scans you upload are encrypted and stored in your private record vault.</li>
                <li>You maintain the legal right to view, download, update, or revoke access at any time in Profile Settings.</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setRegData({ ...regData, consentGranted: true });
                setShowConsentTermsModal(false);
              }}
              className="mt-5 w-full py-2.5 bg-medblue-600 hover:bg-medblue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              {t.agreeAndClose}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
