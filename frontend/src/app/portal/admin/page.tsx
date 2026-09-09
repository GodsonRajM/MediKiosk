"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { Header } from "@/components/common/Header";
import { 
  BarChart3, 
  Users, 
  Stethoscope, 
  FileText, 
  ShieldAlert, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Database,
  ExternalLink,
  Lock
} from "lucide-react";

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, isLoading } = useApp();

  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setRefreshing(true);
    try {
      const [met, audit] = await Promise.all([
        ApiService.getSystemMetrics(),
        ApiService.getAuditLogs(),
      ]);
      setMetrics(met);
      setLogs(audit || []);
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-medblue-600 text-white flex items-center justify-center shadow-sm shadow-medblue-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                MediKiosk Hospital Administration & Operations
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Authoritative Supabase database statistics, audit records, and kiosk metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              disabled={refreshing}
              className="health-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        {loading ? (
          <div className="health-card p-12 text-center">
            <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="health-card p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Patients Registered</span>
                <Users className="w-4 h-4 text-medblue-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics.total_patients}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Real Supabase Profiles</p>
            </div>

            <div className="health-card p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">OPD Physicians</span>
                <Stethoscope className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics.total_doctors}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Active Attending Doctors</p>
            </div>

            <div className="health-card p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Completed Cases</span>
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics.completed_intakes}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Of {metrics.total_clinical_sessions} Total Sessions</p>
            </div>

            <div className="health-card p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Emergency SOS Events</span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {metrics.emergency_sos_triggered}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Triage Alerts Dispatched</p>
            </div>

          </div>
        ) : null}

        {/* Quick Portal Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/portal/doctor")}
            className="health-card p-4 hover:border-medblue-500 transition-colors flex items-center justify-between text-left"
          >
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Doctor OPD Dashboard
              </h4>
              <p className="text-xs text-slate-500">
                Patient queues, clinical case inspection & FHIR R4 export
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-medblue-600 shrink-0 ml-2" />
          </button>

          <button
            onClick={() => router.push("/portal/triage")}
            className="health-card p-4 hover:border-rose-500 transition-colors flex items-center justify-between text-left"
          >
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Emergency Triage Queue
              </h4>
              <p className="text-xs text-slate-500">
                Real-time red-flag alerts, SOS GPS locations & actions
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
          </button>

          <button
            onClick={() => router.push("/portal/patient")}
            className="health-card p-4 hover:border-emerald-500 transition-colors flex items-center justify-between text-left"
          >
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Patient Kiosk Mode
              </h4>
              <p className="text-xs text-slate-500">
                Interactive self-service intake, history timeline & QR card
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
          </button>
        </div>

        {/* Security & Audit Logs Table */}
        <div className="health-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-medblue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Security & Compliance Audit Logs
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Live from Supabase `audit_logs` table
            </span>
          </div>

          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No audit log entries recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Timestamp</th>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">Resource</th>
                    <th className="p-2.5">IP Address</th>
                    <th className="p-2.5 rounded-r-lg">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 whitespace-nowrap text-slate-500">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}
                      </td>
                      <td className="p-2.5 font-bold text-medblue-600 dark:text-medblue-400">
                        {log.action}
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300">
                        {log.resource_type || "system"}
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {log.ip_address || "local"}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {typeof log.details === "object" ? JSON.stringify(log.details) : log.details || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
