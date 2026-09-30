import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  deadline: string;
  startDate?: string;
  size?: 'large' | 'compact' | 'badge' | 'banner';
  onDeadlinePassed?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isUpcoming: boolean;
  isPassed: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  startDate,
  size = 'large',
  onDeadlinePassed,
}) => {
  const calculate = (): TimeRemaining => {
    const now = new Date().getTime();
    const target = new Date(deadline).getTime();
    const start = startDate ? new Date(startDate).getTime() : 0;

    if (start && now < start) {
      const diffUpcoming = Math.max(0, start - now);
      const s = Math.floor(diffUpcoming / 1000);
      return {
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        minutes: Math.floor((s % 3600) / 60),
        seconds: s % 60,
        totalSeconds: s,
        isUpcoming: true,
        isPassed: false,
      };
    }

    const diff = target - now;
    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isUpcoming: false,
        isPassed: true,
      };
    }

    const s = Math.floor(diff / 1000);
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
      totalSeconds: s,
      isUpcoming: false,
      isPassed: false,
    };
  };

  const [time, setTime] = useState<TimeRemaining>(calculate);

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculate();
      setTime(updated);
      if (updated.isPassed && onDeadlinePassed) {
        onDeadlinePassed();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, startDate]);

  // Format numbers with leading zeros
  const pad = (n: number) => String(n).padStart(2, '0');

  if (time.isPassed) {
    if (size === 'badge') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-700">
          <Clock className="w-3.5 h-3.5" />
          CHALLENGE CLOSED
        </span>
      );
    }
    if (size === 'banner') {
      return (
        <div className="bg-black/35 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-stone-700/60 w-full sm:w-auto text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-end gap-1.5 text-xs font-black text-stone-200">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>CHALLENGE ENDED</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-0.5">Submission deadline passed</p>
        </div>
      );
    }
    return (
      <div className="bg-stone-100 border border-stone-300 rounded-2xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-stone-700 font-bold text-base">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>CHALLENGE ENDED</span>
        </div>
        <p className="text-xs text-stone-700 mt-1 font-medium">Submission deadline has passed</p>
      </div>
    );
  }

  if (time.isUpcoming) {
    if (size === 'badge') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <Clock className="w-3.5 h-3.5" />
          STARTS IN {time.days}D {pad(time.hours)}H
        </span>
      );
    }
    if (size === 'banner') {
      return (
        <div className="bg-black/35 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-amber-500/30 w-full sm:w-auto text-center sm:text-right shadow-inner">
          <div className="flex items-center justify-between sm:justify-end gap-2 mb-1.5 px-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>STARTS IN</span>
            </span>
            <span className="text-[9px] font-bold text-amber-200/80 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/40">
              WIB
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center min-w-[210px]">
            <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/10">
              <div className="text-base sm:text-lg font-black font-mono leading-tight text-amber-200">
                {time.days}
              </div>
              <div className="text-[8px] font-bold text-amber-400/90 uppercase tracking-wider">
                DAYS
              </div>
            </div>
            <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/10">
              <div className="text-base sm:text-lg font-black font-mono leading-tight text-amber-200">
                {pad(time.hours)}
              </div>
              <div className="text-[8px] font-bold text-amber-400/90 uppercase tracking-wider">
                HRS
              </div>
            </div>
            <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/10">
              <div className="text-base sm:text-lg font-black font-mono leading-tight text-amber-200">
                {pad(time.minutes)}
              </div>
              <div className="text-[8px] font-bold text-amber-400/90 uppercase tracking-wider">
                MIN
              </div>
            </div>
            <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/10">
              <div className="text-base sm:text-lg font-black font-mono leading-tight text-amber-200">
                {pad(time.seconds)}
              </div>
              <div className="text-[8px] font-bold text-amber-400/90 uppercase tracking-wider">
                SEC
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
          CHALLENGE STARTS IN
        </span>
        <div className="text-2xl font-black text-amber-900 font-mono tracking-tight">
          {time.days} DAYS {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
        </div>
      </div>
    );
  }

  // Active Countdown - Banner style for Top Hero
  if (size === 'banner') {
    return (
      <div className="bg-black/35 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-emerald-500/30 w-full sm:w-auto shadow-inner">
        <div className="flex items-center justify-between gap-3 mb-1.5 px-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>ENDS IN</span>
          </span>
          <span className="text-[9px] font-bold text-emerald-200/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/40">
            WIB (GMT+7)
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center min-w-[210px]">
          <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/10">
            <div className="text-base sm:text-lg font-black font-mono leading-tight text-white">
              {time.days}
            </div>
            <div className="text-[8px] font-bold text-emerald-300 uppercase tracking-wider">
              DAYS
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/10">
            <div className="text-base sm:text-lg font-black font-mono leading-tight text-white">
              {pad(time.hours)}
            </div>
            <div className="text-[8px] font-bold text-emerald-300 uppercase tracking-wider">
              HRS
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/10">
            <div className="text-base sm:text-lg font-black font-mono leading-tight text-white">
              {pad(time.minutes)}
            </div>
            <div className="text-[8px] font-bold text-emerald-300 uppercase tracking-wider">
              MIN
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/10">
            <div className="text-base sm:text-lg font-black font-mono leading-tight text-white">
              {pad(time.seconds)}
            </div>
            <div className="text-[8px] font-bold text-emerald-300 uppercase tracking-wider">
              SEC
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Countdown - Badge style
  if (size === 'badge') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
        <Clock className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
        ⏳ {time.days > 0 ? `${time.days} DAYS LEFT` : `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)}`}
      </span>
    );
  }

  // Active Countdown - Compact style
  if (size === 'compact') {
    return (
      <div className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-100">
        <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
        <span>
          {time.days > 0 && <span className="mr-1">{time.days}d</span>}
          {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
        </span>
      </div>
    );
  }

  // Active Countdown - Large Prominent style (Rule 9 & 20)
  return (
    <div className="bg-gradient-to-br from-emerald-900 to-stone-900 text-white rounded-2xl p-5 shadow-md border border-emerald-800/40 relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-300/90 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          CHALLENGE ENDS IN
        </span>
        <span className="text-[11px] font-medium text-emerald-200/70 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
          WIB (GMT+7)
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            {time.days}
          </div>
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mt-0.5">
            DAYS
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            {pad(time.hours)}
          </div>
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mt-0.5">
            HOURS
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            {pad(time.minutes)}
          </div>
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mt-0.5">
            MINS
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            {pad(time.seconds)}
          </div>
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mt-0.5">
            SECS
          </div>
        </div>
      </div>
    </div>
  );
};
