"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-white dark:bg-medgrey-800/60 border border-dashed border-medgrey-300 dark:border-medgrey-700">
      <div className="w-14 h-14 rounded-2xl bg-medblue-50 dark:bg-medblue-950/60 text-medblue-600 dark:text-medblue-400 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-medgrey-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-medgrey-500 dark:text-medgrey-400 max-w-sm mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="health-btn-primary text-sm py-2 px-4">
          {actionText}
        </button>
      )}
    </div>
  );
};
