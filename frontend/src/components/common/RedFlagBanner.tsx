"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/AppContext";

interface RedFlagAlertItem {
  rule_id: string;
  level: string;
  message: string;
  triage_recommendation: string;
  symptoms: string[];
}

interface RedFlagBannerProps {
  alerts: RedFlagAlertItem[];
}

export const RedFlagBanner: React.FC<RedFlagBannerProps> = ({ alerts }) => {
  const { t } = useApp();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400">
        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-300" />
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-tight uppercase">
            {t.redFlagAlert}
          </h4>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Deterministic triage rule engine flagged urgent clinical indications
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-1 border-t border-rose-200/60 dark:border-rose-900/60">
        {alerts.map((alert, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-white/80 dark:bg-medgrey-900/80 border border-rose-100 dark:border-rose-900/40 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-900 dark:text-rose-200">
                {alert.message}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                {alert.level}
              </span>
            </div>
            <p className="text-medgrey-600 dark:text-medgrey-300 font-medium">
              👉 {alert.triage_recommendation}
            </p>
            {alert.symptoms && (
              <p className="text-[11px] text-medgrey-500">
                Triggered symptoms: {alert.symptoms.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
