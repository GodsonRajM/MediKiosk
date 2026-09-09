"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { EmptyState } from "@/components/common/EmptyState";
import { 
  Clock, 
  Plus, 
  Trash2, 
  Activity, 
  AlertCircle, 
  Pill, 
  Scissors,
  Calendar
} from "lucide-react";

export const MedicalHistoryManager: React.FC = () => {
  const { t } = useApp();
  const [history, setHistory] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New record form state
  const [category, setCategory] = useState("condition");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [histData, timeData] = await Promise.all([
        ApiService.getPatientHistory(),
        ApiService.getPatientTimeline(),
      ]);
      setHistory(histData || []);
      setTimeline(timeData || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await ApiService.addPatientHistory({
        category,
        title,
        details: { notes: details },
      });
      setTitle("");
      setDetails("");
      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this medical record?")) return;
    try {
      await ApiService.deletePatientHistory(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to remove record.");
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "allergy": return AlertCircle;
      case "medication": return Pill;
      case "surgery": return Scissors;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-medgrey-900 dark:text-white">
            {t.history}
          </h2>
          <p className="text-xs text-medgrey-500">
            Chronological timeline of past medical conditions, surgeries, and prescriptions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="health-btn-primary text-xs py-2 px-4 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t.addRecord}
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-medgrey-800 rounded-2xl max-w-md w-full p-6 space-y-4 border border-medgrey-200 dark:border-medgrey-700 shadow-xl">
            <h3 className="text-base font-bold text-medgrey-900 dark:text-white">
              {t.addRecord}
            </h3>

            <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="health-input text-xs py-2"
                >
                  <option value="condition">Medical Condition (e.g. Hypertension)</option>
                  <option value="surgery">Past Surgery (e.g. Appendectomy)</option>
                  <option value="medication">Regular Medication (e.g. Metformin 500mg)</option>
                  <option value="allergy">Allergy (e.g. Penicillin, Peanuts)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
                  Title / Diagnosis Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Type 2 Diabetes Mellitus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="health-input text-xs py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
                  Notes / Additional Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Diagnosed in 2021, managed with diet and medication"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="health-input text-xs py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-medgrey-600 hover:bg-medgrey-100 dark:hover:bg-medgrey-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="health-btn-primary text-xs py-2 px-5"
                >
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content: Timeline or Empty State */}
      {loading ? (
        <div className="health-card p-12 text-center">
          <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : timeline.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={t.emptyHistoryTitle}
          description={t.emptyHistoryDesc}
          actionText={t.addRecord}
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="space-y-4">
          
          {/* Timeline List */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-medblue-200 dark:before:bg-medblue-900">
            {timeline.map((item, idx) => {
              const Icon = getCategoryIcon(item.event_type || "");
              return (
                <div key={idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-medblue-600 text-white flex items-center justify-center shadow-sm">
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Event Card */}
                  <div className="health-card p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-medblue-600 dark:text-medblue-400 uppercase tracking-wider">
                        {item.event_type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] text-medgrey-400">
                          <Calendar className="w-3 h-3" />
                          {item.event_date}
                        </span>
                        {item.source === "history" && (
                          <button
                            onClick={() => handleDelete(item.source_id)}
                            className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-medgrey-900 dark:text-white">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-medgrey-600 dark:text-medgrey-300">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
