'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  schedule: string;
}

export default function CountdownTimer({ schedule }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState('--:--:--');
  const [nextTime, setNextTime] = useState('');

  useEffect(() => {
    const calculateNext = () => {
      try {
        const now = new Date();
        
        // Parse schedule: "0 9,18 * * *" → [9, 18]
        const parts = (schedule || '0 9,18 * * *').split(' ');
        const hourStr = parts[1];
        
        let hours: number[] = [];
        if (hourStr?.includes(',')) {
          hours = hourStr.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h));
        } else if (hourStr?.startsWith('*/')) {
          const interval = parseInt(hourStr.slice(2));
          for (let i = 0; i < 24; i += interval) hours.push(i);
        } else {
          hours = [parseInt(hourStr)];
        }
        
        // Find next run hour
        let nextRun = null;
        for (const h of hours) {
          if (isNaN(h)) continue;
          const candidate = new Date(now);
          candidate.setHours(h, 0, 0, 0);
          if (candidate > now) {
            nextRun = candidate;
            break;
          }
        }
        
        // If no run today, use first hour tomorrow
        if (!nextRun && hours.length > 0) {
          nextRun = new Date(now);
          nextRun.setDate(nextRun.getDate() + 1);
          nextRun.setHours(hours[0], 0, 0, 0);
        }
        
        if (!nextRun) {
          setCountdown('--:--:--');
          setNextTime('Error: Invalid schedule');
          return;
        }
        
        // Calculate countdown
        const diff = nextRun.getTime() - now.getTime();
        const hours_left = Math.max(0, Math.floor(diff / 3600000));
        const mins_left = Math.max(0, Math.floor((diff % 3600000) / 60000));
        const secs_left = Math.max(0, Math.floor((diff % 60000) / 1000));
        
        const h = String(hours_left).padStart(2, '0');
        const m = String(mins_left).padStart(2, '0');
        const s = String(secs_left).padStart(2, '0');
        
        setCountdown(`${h}:${m}:${s}`);
        
        const timeStr = nextRun.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        setNextTime(`Scheduled for ${timeStr}`);
        
      } catch (err) {
        console.error('Countdown error:', err);
        setCountdown('--:--:--');
        setNextTime('Calculation error');
      }
    };

    calculateNext();
    const interval = setInterval(calculateNext, 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-3xl font-bold text-[#F5C518] font-mono tracking-wider">
        {countdown}
      </div>
      <div className="text-xs text-[#666]">{nextTime}</div>
    </div>
  );
}
