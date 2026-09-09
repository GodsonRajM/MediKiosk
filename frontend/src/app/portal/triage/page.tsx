"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { Header } from "@/components/common/Header";
import { 
  ShieldAlert, 
  Activity, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  UserCheck, 
  Ambulance, 
  BellRing,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function TriagePortalPage() {
  const router = useRouter();
  const { user, isLoading } = useApp();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  // Protect page: require user
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setRefreshing(true);
      const data = await ApiService.getTriageAlerts();
      setAlerts(data || []);
    } catch (err) {
      console.error("Failed to load triage alerts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => new Set(prev).add(id));
  };

  const criticalCount = alerts.filter(
    (a) => a.severity === "CRITICAL" && !acknowledgedIds.has(a.id)
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm shadow-rose-600/30">
                <BellRing className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Emergency & Clinical Triage Queue
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Live monitoring of real-time emergency SOS triggers and automated clinical red flags
            </p>
          </div>

          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                {criticalCount} Active Critical Alert{criticalCount > 1 ? "s" : ""}
              </span>
            )}

            <button
              onClick={loadAlerts}
              disabled={refreshing}
              className="health-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts Grid */}
        {loading ? (
          <div className="health-card p-12 text-center">
            <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="health-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">All Triage Queues Clear</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No active SOS dispatches or unresolved clinical red flags recorded in Supabase.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const isAcknowledged = acknowledgedIds.has(alert.id);
              const isCritical = alert.severity === "CRITICAL";

              return (
                <div
                  key={alert.id}
                  className={`health-card p-5 border-l-4 transition-all ${
                    isAcknowledged
                      ? "opacity-60 border-l-slate-400 dark:border-l-slate-600"
                      : isCritical
                      ? "border-l-rose-600 bg-rose-50/20 dark:bg-rose-950/10 shadow-md"
                      : "border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Alert Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            isCritical
                              ? "bg-rose-600 text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {alert.severity} • {alert.type === "emergency_sos" ? "EMERGENCY SOS" : "CLINICAL RED FLAG"}
                        </span>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : "Recent"}
                        </span>
                        {isAcknowledged && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Acknowledged
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {alert.patient_name}
                          <span className="text-xs font-mono text-medblue-600 dark:text-medblue-400 font-normal">
                            ({alert.medikiosk_id})
                          </span>
                        </h3>
                        {alert.chief_complaint && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            Complaint: {alert.chief_complaint}
                          </p>
                        )}
                        {alert.note && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                            Note: {alert.note}
                          </p>
                        )}
                      </div>

                      {/* Red flag items */}
                      {alert.red_flags && alert.red_flags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {alert.red_flags.map((rf: any, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {typeof rf === "string" ? rf : rf.message || rf.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Coordinates */}
                      {alert.location && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          GPS: {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {alert.emergency_contact && (
                        <a
                          href={`tel:${alert.emergency_contact}`}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          Call Contact
                        </a>
                      )}

                      {!isAcknowledged ? (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="health-btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Acknowledge
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold cursor-not-allowed"
                        >
                          Dispatched
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
