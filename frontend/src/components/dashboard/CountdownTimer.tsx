"use client";

import { useEffect, useState } from "react";

function getNextRunTime(schedule: string): Date {
  const now = new Date();
  
  // Parse schedule to get run hours
  // Default: 0 9,18 * * * (9 AM and 6 PM)
  let runHours = [9, 18]; // defaults
  
  try {
    const parts = schedule.split(' ');
    if (parts.length >= 2) {
      const hourPart = parts[1];
      if (hourPart.includes(',')) {
        runHours = hourPart.split(',').map(Number);
      } else if (hourPart === '*') {
        runHours = Array.from({length: 24}, (_, i) => i);
      } else if (hourPart.includes('*/')) {
        const interval = parseInt(hourPart.replace('*/', ''));
        runHours = Array.from({length: Math.floor(24/interval)}, (_, i) => i * interval);
      } else {
        runHours = [parseInt(hourPart)];
      }
    }
  } catch {
    runHours = [9, 18];
  }

  // Find next run time
  const nextRun = new Date(now);
  
  for (const hour of runHours.sort((a, b) => a - b)) {
    nextRun.setHours(hour, 0, 0, 0);
    if (nextRun > now) {
      return nextRun;
    }
  }
  
  // No more runs today, next is first run tomorrow
  nextRun.setDate(nextRun.getDate() + 1);
  nextRun.setHours(runHours[0], 0, 0, 0);
  return nextRun;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

export default function CountdownTimer({ schedule }: { schedule: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    function update() {
      const next = getNextRunTime(schedule || '0 9,18 * * *');
      setNextRunTime(next);
      const ms = next.getTime() - Date.now();
      setTimeLeft(formatCountdown(ms));
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [schedule, mounted]);

  if (!mounted) {
    return (
      <span className="font-mono text-sm text-[#F5C518]" suppressHydrationWarning>
        --:--:--
      </span>
    );
  }

  return (
    <div className="text-right md:text-right text-left flex flex-col justify-center">
      <p className="text-[#F5C518] text-sm font-mono font-bold">
        Next run in {timeLeft}
      </p>
      {nextRunTime && (
        <p className="text-[11px] text-[#666666] mt-0.5 font-mono">
          Scheduled for {nextRunTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      )}
    </div>
  );
}
