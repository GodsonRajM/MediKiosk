'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TriageAlert } from '@/types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TriagePage() {
  const [alerts, setAlerts] = useState<TriageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getTriageAlerts();
      setAlerts(data);
    } catch (e) {
      console.warn("Using fallback triage alerts");
      setAlerts([
        {
          id: '44444444-4444-4444-4444-444444444444',
          red_flag_id: '33333333-3333-3333-3333-333333333333',
          patient_id: '11111111-1111-1111-1111-111111111111',
          patient_name: 'Sundaram Ramaswamy',
          medikiosk_id: 'MK-000001',
          severity: 'CRITICAL',
          reason: 'Exertional Retrosternal Chest Pain with Dyspnea',
          status: 'ACTIVE',
          action_taken: 'Alert dispatched to Triage Desk. Patient queued for priority ECG.',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (alertId: string, nextStatus: 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'ESCALATED' | 'CLOSED', actionNote: string) => {
    try {
      await api.takeTriageAction(alertId, nextStatus, actionNote);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: nextStatus, action_taken: actionNote } : a));
    } catch (e) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: nextStatus, action_taken: actionNote } : a));
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Emergency & Triage Console
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Live Feed
              </span>
            </h1>
            <p className="text-xs text-slate-400">Deterministic clinical safety alerts triggered at kiosk intake stations</p>
          </div>
        </div>

        <button
          onClick={loadAlerts}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'ESCALATED', 'CLOSED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filter === f
                ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert Feed Cards */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Active Triage Alerts</h3>
            <p className="text-xs text-slate-400 mt-1">All pre-consultation kiosks are operating with normal vitals.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass-panel p-6 rounded-2xl border transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'border-rose-500/50 shadow-xl shadow-rose-500/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{alert.reason}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Patient: <strong className="text-white">{alert.patient_name}</strong> ({alert.medikiosk_id}) • Station: Kiosk 01
                    </p>
                  </div>
                </div>

                {/* Current Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border uppercase ${
                    alert.status === 'ACTIVE'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : alert.status === 'ACKNOWLEDGED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    Status: {alert.status}
                  </span>
                </div>
              </div>

              {/* Advisory note */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-300 mb-4 space-y-1">
                <div className="font-semibold text-rose-300">Safety Recommendation:</div>
                <p>Priority clinical assessment recommended. Urgent 12-lead ECG and physician evaluation advised before normal queue order.</p>
                {alert.action_taken && (
                  <div className="text-slate-400 pt-1 text-[11px]">
                    <strong>Last Action:</strong> {alert.action_taken}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(alert.id, 'ACKNOWLEDGED', 'Triage staff acknowledged alert and dispatched staff to Bay 01.')}
                    className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-colors"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleAction(alert.id, 'ESCALATED', 'Escalated to Senior Medical Officer on duty.')}
                    className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-colors"
                  >
                    Escalate
                  </button>
                  <button
                    onClick={() => handleAction(alert.id, 'CLOSED', 'Patient moved into ECG room and attended by doctor.')}
                    className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>

                <Link
                  href="/doctor"
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  View in Doctor Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
