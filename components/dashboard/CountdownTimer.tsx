"use client";

import { useEffect, useState } from "react";

function getNextRunTime(schedule: string): Date {
  const now = new Date();
  const parts = (schedule || '0 9,18 * * *').split(' ');
  const hourPart = parts[1] || '9,18';
  
  let hours: number[] = [];
  if (hourPart.includes(',')) {
    hours = hourPart.split(',').map(Number).sort((a,b) => a-b);
  } else if (hourPart.startsWith('*/')) {
    const interval = parseInt(hourPart.slice(2));
    hours = Array.from({length: Math.floor(24/interval)}, (_,i) => i*interval);
  } else {
    hours = [parseInt(hourPart)];
  }

  for (const h of hours) {
    const candidate = new Date(now);
    candidate.setHours(h, 0, 0, 0);
    if (candidate > now) return candidate;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours[0], 0, 0, 0);
  return tomorrow;
}

export default function CountdownTimer({ schedule }: { schedule: string }) {
  const [timeStr, setTimeStr] = useState('');
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      const next = getNextRunTime(schedule);
      setNextRunTime(next);
      const diff = next.getTime() - Date.now();
      const h = Math.max(0, Math.floor(diff / 3600000));
      const m = Math.max(0, Math.floor((diff % 3600000) / 60000));
      const s = Math.max(0, Math.floor((diff % 60000) / 1000));
      setTimeStr(
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
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
        Next run in {timeStr}
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
