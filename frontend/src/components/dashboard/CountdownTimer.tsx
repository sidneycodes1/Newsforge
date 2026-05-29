"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  nextRunAt?: Date | null;
}

export default function CountdownTimer({ nextRunAt }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("--:--");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const tick = () => {
      if (!nextRunAt) {
        setTimeLeft("--:--");
        return;
      }

      const diff = nextRunAt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Running now...");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [mounted, nextRunAt]);

  if (!mounted) {
    return (
      <span className="font-mono text-sm text-[#F5C518]" suppressHydrationWarning>
        --:--
      </span>
    );
  }

  return (
    <span className="font-mono text-sm text-[#F5C518]" suppressHydrationWarning>
      {timeLeft.startsWith("Running") ? timeLeft : `Next run in ${timeLeft}`}
    </span>
  );
}
