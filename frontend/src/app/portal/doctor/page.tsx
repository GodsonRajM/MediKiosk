"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { Header } from "@/components/common/Header";
import { PatientSearchBar } from "@/components/doctor/PatientSearchBar";
import { CaseSummaryViewer } from "@/components/doctor/CaseSummaryViewer";
import { EmptyState } from "@/components/common/EmptyState";
import { 
  Stethoscope, 
  Users, 
  Search, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock,
  Activity
} from "lucide-react";

export default function DoctorPortalPage() {
  const router = useRouter();
  const { user, t, isLoading } = useApp();

  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    } else if (!isLoading && user && user.role !== "doctor") {
      router.push("/portal/patient");
    } else if (user) {
      loadAssignedPatients();
    }
  }, [user, isLoading, router]);

  const loadAssignedPatients = async () => {
    try {
      const data = await ApiService.getAssignedPatients();
      setAssignedPatients(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* If a patient is selected for clinical review */}
        {selectedPatientId ? (
          <CaseSummaryViewer
            patientId={selectedPatientId}
            onBack={() => {
              setSelectedPatientId(null);
              loadAssignedPatients();
            }}
          />
        ) : (
          <div className="space-y-6">
            
            {/* Top Doctor Profile Card */}
            <div className="health-card p-6 bg-gradient-to-r from-medblue-800 to-medblue-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-medblue-200">
                    OPD Attending Physician Portal
                  </span>
                  <h1 className="text-2xl font-bold">
                    {user.name}
                  </h1>
                  <p className="text-xs text-medblue-100">
                    ID: <strong className="font-mono">{user.doctor_id}</strong> • Authoritative Clinical Review
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-right">
                  <span className="text-[10px] text-medblue-200 uppercase font-semibold">Active Queue</span>
                  <p className="text-lg font-bold">{assignedPatients.length} Patients</p>
                </div>
              </div>
            </div>

            {/* Live Patient Search */}
            <div className="health-card p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-medblue-600" />
                Search Supabase Patient Records
              </h3>
              <PatientSearchBar onSelectPatient={(id) => setSelectedPatientId(id)} />
            </div>

            {/* Assigned Patients Queue */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-medblue-600" />
                  {t.assignedPatients} ({assignedPatients.length})
                </h3>
                <button
                  onClick={loadAssignedPatients}
                  className="text-xs text-medblue-600 dark:text-medblue-400 font-semibold hover:underline"
                >
                  Refresh Queue
                </button>
              </div>

              {loading ? (
                <div className="health-card p-12 text-center">
                  <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : assignedPatients.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Patients Connected"
                  description="Patients who connect to your Doctor ID (DR123456) at the kiosk will appear in this real-time queue."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="health-card p-5 flex flex-col justify-between space-y-4 text-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {patient.full_name}
                            </h4>
                            <p className="text-slate-500 font-mono text-[11px]">
                              {patient.medikiosk_id} • Age {patient.age || "N/A"}
                            </p>
                          </div>
                          {patient.red_flags && patient.red_flags.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Red Flag
                            </span>
                          )}
                        </div>

                        {patient.has_summary ? (
                          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            AI Case Summary Prepared
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            Intake In Progress
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedPatientId(patient.id)}
                        className="w-full health-btn-primary py-2 text-xs"
                      >
                        {t.reviewCase}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
