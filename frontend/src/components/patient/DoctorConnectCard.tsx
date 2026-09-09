"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { Stethoscope, UserCheck, Search, ArrowRight } from "lucide-react";

interface DoctorConnectCardProps {
  onStartIntake: () => void;
  hasActiveIntake?: boolean;
}

export const DoctorConnectCard: React.FC<DoctorConnectCardProps> = ({ onStartIntake }) => {
  const { t } = useApp();
  const [connection, setConnection] = useState<any>(null);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnection();
    loadDoctors();
  }, []);

  const loadConnection = async () => {
    try {
      const res = await ApiService.getCurrentConnection();
      if (res.connected) {
        setConnection(res.doctor);
      }
    } catch {
      // ignore
    }
  };

  const loadDoctors = async () => {
    try {
      const docs = await ApiService.getAvailableDoctors();
      setAvailableDoctors(docs);
    } catch {
      // ignore
    }
  };

  const handleConnect = async (doctorId?: string, docName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const cleanInput = searchInput.trim();
      const isId = cleanInput.toUpperCase().startsWith("DR") || cleanInput.toUpperCase().startsWith("DK-");
      const targetId = doctorId || (isId ? cleanInput.toUpperCase() : undefined);
      const targetName = docName || (!isId ? cleanInput : undefined);

      const res = await ApiService.connectDoctor(targetId, targetName);
      setConnection(res.doctor);
      setSearchInput("");
    } catch (err: any) {
      setError(err.message || "Could not connect to doctor. Verify Doctor ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="health-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 flex items-center justify-center shrink-0">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-medgrey-900 dark:text-white">
            {t.connectDoctor}
          </h2>
          <p className="text-xs text-medgrey-500 dark:text-medgrey-400">
            {t.intakeSubtitle}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      )}

      {connection ? (
        <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  {t.connectedTo}
                </span>
                <h3 className="text-base font-bold text-medgrey-900 dark:text-white">
                  {connection.name}
                </h3>
                <p className="text-xs text-medgrey-600 dark:text-medgrey-300">
                  {connection.specialization} • <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{connection.doctor_id}</span>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              Active Connection
            </span>
          </div>

          <button
            onClick={onStartIntake}
            className="w-full health-btn-primary py-3.5 text-base flex items-center justify-center gap-2"
          >
            {t.startIntakeBtn}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-medgrey-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.searchDoctorPlaceholder}
                className="health-input pl-11"
              />
            </div>
            <button
              onClick={() => handleConnect()}
              disabled={loading || !searchInput.trim()}
              className="health-btn-primary shrink-0 px-6"
            >
              {loading ? "Connecting..." : t.connectBtn}
            </button>
          </div>

          {availableDoctors.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-xs font-semibold text-medgrey-500 uppercase tracking-wider">
                Available OPD Doctors
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableDoctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleConnect(doc.doctor_id, doc.name)}
                    className="p-3 text-left rounded-xl border border-medgrey-200 dark:border-medgrey-700 hover:border-medblue-500 hover:bg-medblue-50/40 dark:hover:bg-medblue-950/20 transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-medgrey-900 dark:text-white">
                        {doc.name}
                      </p>
                      <p className="text-[11px] text-medgrey-500">
                        {doc.specialization}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-medgrey-100 dark:bg-medgrey-800 text-medblue-600 dark:text-medblue-400 font-semibold">
                      {doc.doctor_id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
