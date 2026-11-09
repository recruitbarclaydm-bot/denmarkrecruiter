'use client';

import React from 'react';
import { CandidateRecord } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface StepperProps {
  candidate: CandidateRecord;
}

export const Stepper: React.FC<StepperProps> = ({ candidate }) => {
  const { t } = useLanguage();

  const stages = [
    { num: 1, title: t('stage1Title'), desc: t('stage1Desc') },
    { num: 2, title: t('stage2Title'), desc: t('stage2Desc') },
    { num: 3, title: t('stage3Title'), desc: t('stage3Desc') },
    { num: 4, title: t('stage4Title'), desc: t('stage4Desc') },
    { num: 5, title: t('stage5Title'), desc: t('stage5Desc') },
    { num: 6, title: t('stage6Title'), desc: t('stage6Desc') },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          SIRI Statutory Application Workflow
        </div>
        <div className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          Stage {candidate.currentStage} of 6
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((st) => {
          const isCompleted = st.num < candidate.currentStage;
          const isActive = st.num === candidate.currentStage;
          const isPending = st.num > candidate.currentStage;

          return (
            <div
              key={st.num}
              className={`relative flex flex-col justify-between p-3 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : isActive
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 shadow-sm ring-1 ring-blue-400'
                  : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-slate-500">0{st.num}</span>
                <span className="flex items-center">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse">
                      <AlertCircle className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center">
                      <Clock className="w-3 h-3" />
                    </div>
                  )}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                  {st.title}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                  {st.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
