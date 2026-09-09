"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { ApiService } from "@/lib/api";
import { User, Save, CheckCircle2, Shield } from "lucide-react";

export const ProfileEditor: React.FC = () => {
  const { t, refreshUser } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await ApiService.getPatientProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || "Failed to load patient profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await ApiService.updatePatientProfile({
        full_name: profile.full_name,
        age: Number(profile.age),
        phone: profile.phone,
        address: profile.address,
        blood_group: profile.blood_group,
        emergency_contact: profile.emergency_contact,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="health-card p-12 text-center">
        <div className="w-8 h-8 border-3 border-medblue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="health-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-medgrey-100 dark:border-medgrey-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-medgrey-900 dark:text-white">
              {t.profile}
            </h2>
            <p className="text-xs text-medgrey-500">
              Personal demographics synchronized with hospital records
            </p>
          </div>
        </div>

        {profile?.medikiosk_id && (
          <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 border border-medblue-200 dark:border-medblue-800">
            {profile.medikiosk_id}
          </span>
        )}
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {t.profileUpdated}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
              {t.fullName}
            </label>
            <input
              type="text"
              required
              value={profile?.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="health-input text-xs py-2.5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
              {t.email}
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || ""}
              className="health-input text-xs py-2.5 bg-medgrey-100 dark:bg-medgrey-800 cursor-not-allowed text-medgrey-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
              {t.age}
            </label>
            <input
              type="number"
              required
              min={1}
              max={130}
              value={profile?.age || ""}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              className="health-input text-xs py-2.5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
              {t.phone}
            </label>
            <input
              type="tel"
              required
              value={profile?.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="health-input text-xs py-2.5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
              {t.bloodGroup}
            </label>
            <input
              type="text"
              placeholder="e.g. O+, B+, A-"
              value={profile?.blood_group || ""}
              onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
              className="health-input text-xs py-2.5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
              {t.emergencyContact}
            </label>
            <input
              type="tel"
              required
              value={profile?.emergency_contact || ""}
              onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
              className="health-input text-xs py-2.5"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-medgrey-700 dark:text-medgrey-300">
            {t.address}
          </label>
          <textarea
            rows={2}
            required
            value={profile?.address || ""}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            className="health-input text-xs py-2"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="health-btn-primary text-xs py-2.5 px-6"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : t.saveChanges}
          </button>
        </div>
      </form>
    </div>
  );
};
