'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Video, Clock, ExternalLink } from 'lucide-react';

export const LiveBriefingCard: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 2,
    minutes: 24,
    seconds: 15,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Target: 10:00 CET = 09:00 UTC today or next day
      const target = new Date();
      target.setUTCHours(9, 0, 0, 0);

      if (now.getTime() > target.getTime()) {
        target.setUTCDate(target.getUTCDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinZoom = () => {
    showToast('Connecting to encrypted SIRI Zoom Briefing room...', 'info');
    window.open('https://zoom.us/j/test-siri-briefing-kathmandu', '_blank', 'noopener,noreferrer');
  };

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-xl p-6 shadow-md border border-emerald-700/60 relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-[11px] font-bold tracking-wide uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>MANDATORY PRE-DEPARTURE BRIEFING</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold">
            {t('briefingTitle')}
          </h3>
          <p className="text-xs text-emerald-200 mt-1">
            {t('briefingHost')}
          </p>
        </div>

        {/* Countdown & Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          {/* Timer Display */}
          <div className="flex items-center gap-2 bg-emerald-950/60 px-4 py-2.5 rounded-lg border border-emerald-600/50">
            <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex items-center gap-1 text-center font-mono font-bold text-sm sm:text-base">
              <div>
                <span>{pad(timeLeft.hours)}</span>
                <span className="text-[9px] block text-emerald-300 -mt-1 font-sans">{t('hours')}</span>
              </div>
              <span className="text-emerald-400 -mt-2">:</span>
              <div>
                <span>{pad(timeLeft.minutes)}</span>
                <span className="text-[9px] block text-emerald-300 -mt-1 font-sans">{t('minutes')}</span>
              </div>
              <span className="text-emerald-400 -mt-2">:</span>
              <div>
                <span>{pad(timeLeft.seconds)}</span>
                <span className="text-[9px] block text-emerald-300 -mt-1 font-sans">{t('seconds')}</span>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinZoom}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-transform active:scale-95 whitespace-nowrap"
          >
            <Video className="w-4 h-4" />
            <span>{t('joinZoom')}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
