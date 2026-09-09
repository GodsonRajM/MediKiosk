"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { Search, User, Lock, ArrowRight, AlertCircle } from "lucide-react";

interface PatientSearchBarProps {
  onSelectPatient: (patientId: string) => void;
}

export const PatientSearchBar: React.FC<PatientSearchBarProps> = ({ onSelectPatient }) => {
  const { t } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await ApiService.searchPatients(query);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Failed to search patient records.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-medgrey-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPatientPlaceholder}
            className="health-input pl-11"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="health-btn-primary px-6 shrink-0 text-sm"
        >
          {loading ? "Searching..." : "Search Patient"}
        </button>
      </form>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-medgrey-500">
            Search Results ({results.length})
          </span>

          {results.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-medgrey-800 text-center text-xs text-medgrey-500 border border-medgrey-200 dark:border-medgrey-700">
              No patients found matching &quot;{query}&quot;. Verify Patient Name or PS123456 ID.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((p) => (
                <div
                  key={p.id}
                  className="health-card p-4 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-medgrey-900 dark:text-white truncate">
                        {p.full_name}
                      </h4>
                      <p className="text-medgrey-500 font-mono">
                        {p.medikiosk_id} • Age {p.age || "N/A"}
                      </p>
                    </div>
                  </div>

                  {p.is_authorized ? (
                    <button
                      onClick={() => onSelectPatient(p.id)}
                      className="health-btn-primary text-xs py-2 px-3.5 shrink-0"
                    >
                      {t.reviewCase}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div
                      className="px-3 py-1.5 rounded-lg bg-medgrey-100 dark:bg-medgrey-800 text-medgrey-500 flex items-center gap-1.5 font-medium shrink-0 cursor-not-allowed"
                      title="Doctor-Patient connection required to view clinical data"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Unauthorized
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
