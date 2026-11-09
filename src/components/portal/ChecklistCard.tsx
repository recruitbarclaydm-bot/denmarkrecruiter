'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { CheckSquare, Square, CheckCircle2 } from 'lucide-react';

export const ChecklistCard: React.FC = () => {
  const { candidate, toggleChecklistItem } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  if (!candidate || !candidate.checklist || candidate.checklist.length === 0) return null;

  const total = candidate.checklist.length;
  const completed = candidate.checklist.filter((c) => c.checked).length;
  const pct = Math.round((completed / total) * 100);

  const handleToggle = (id: string, label: string, current: boolean) => {
    toggleChecklistItem(candidate.id, id);
    if (!current) {
      showToast(`Completed: ${label}`, 'success');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-brand-primary dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t('checklistTitle')}
          </h3>
        </div>
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {completed} of {total} Complete ({pct}%)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-5">
        <div
          className="bg-brand-primary h-full transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* List items */}
      <div className="space-y-2.5">
        {candidate.checklist.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggle(item.id, item.label, item.checked)}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
              item.checked
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <span className={`text-xs font-medium ${item.checked ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
