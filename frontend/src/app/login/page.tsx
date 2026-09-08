'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Stethoscope, Lock, Phone, KeyRound, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('MK-000001');
  const [password, setPassword] = useState('patient123');
  const [phone, setPhone] = useState('+919876543210');
  const [otpCode, setOtpCode] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(identifier, password);
      localStorage.setItem('medikiosk_token', res.access_token);
      localStorage.setItem('medikiosk_user', JSON.stringify(res.user));
      if (res.user.role === 'DOCTOR') router.push('/doctor');
      else if (res.user.role === 'TRIAGE_STAFF') router.push('/triage');
      else router.push('/kiosk');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone, otpCode);
      localStorage.setItem('medikiosk_token', res.access_token);
      localStorage.setItem('medikiosk_user', JSON.stringify(res.user));
      router.push('/kiosk');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoRole = (role: 'patient' | 'doctor' | 'triage' | 'admin') => {
    setTab('password');
    setError(null);
    if (role === 'patient') {
      setIdentifier('MK-000001');
      setPassword('patient123');
    } else if (role === 'doctor') {
      setIdentifier('doctor@medikiosk.local');
      setPassword('doctor123');
    } else if (role === 'triage') {
      setIdentifier('triage@medikiosk.local');
      setPassword('triage123');
    } else if (role === 'admin') {
      setIdentifier('admin@medikiosk.local');
      setPassword('admin123');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">MediKiosk Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to access kiosk, doctor, or triage workflows</p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mb-6 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Quick Demo Switcher</div>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={() => selectDemoRole('patient')}
              className="py-1.5 px-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/20 transition-colors"
            >
              Patient
            </button>
            <button
              onClick={() => selectDemoRole('doctor')}
              className="py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/20 transition-colors"
            >
              Doctor
            </button>
            <button
              onClick={() => selectDemoRole('triage')}
              className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/20 transition-colors"
            >
              Triage
            </button>
            <button
              onClick={() => selectDemoRole('admin')}
              className="py-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/20 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 mb-5">
          <button
            onClick={() => setTab('password')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'password'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Password Login
          </button>
          <button
            onClick={() => setTab('otp')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'otp'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Mock OTP (Kiosk)
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Password Form */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                MediKiosk ID / Email / Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. MK-000001 or doctor@medikiosk.local"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 text-sm flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* OTP Form */}
        {tab === 'otp' && (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Mobile Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Enter OTP
                </label>
                <span className="text-[11px] text-amber-400 font-medium">Demo Code: 123456</span>
              </div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                required
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 tracking-widest text-center font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 text-sm flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
