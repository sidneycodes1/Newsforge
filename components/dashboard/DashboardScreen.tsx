"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCountdown } from "@shared/utils/format";

import ActiveRunCard from "./ActiveRunCard";
import CountdownTimer from "./CountdownTimer";
import OutputGrid from "./OutputGrid";

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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-5 h-[260px] w-full" />
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="h-[120px] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const activePollRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRun, setActiveRun] = useState<any | null>(null);
  const [activeSteps, setActiveSteps] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [schedule, setSchedule] = useState("*/30 * * * *");
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const nextRunAt = useMemo(() => getNextRunTime(schedule), [schedule]);

  // Pagination states
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(recentRuns.length / ITEMS_PER_PAGE);
  const paginatedRuns = recentRuns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [recentRuns]);

  const loadRuns = async () => {
    const response = await fetch("/api/runs?limit=50&page=1", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Failed to load runs");
    }
    return json.data ?? [];
  };

  const loadSettings = async () => {
    const response = await fetch("/api/settings", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Failed to load settings");
    }
    return json.data;
  };

  const loadActive = async () => {
    const response = await fetch("/api/runs/active", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Failed to load active run");
    }
    return json.data;
  };

  const refresh = async () => {
    try {
      setError(null);
      const [settingsData, runsData, activeData] = await Promise.all([
        loadSettings(),
        loadRuns(),
        loadActive(),
      ]);

      setSchedule(settingsData?.schedule ?? "*/30 * * * *");
      setRecentRuns(
        (runsData as any[]).filter((run) => String(run.status) === "complete")
      );
      setActiveRun(activeData?.run ?? null);
      setActiveSteps(activeData?.steps ?? []);

      if (!activeData?.run && activePollRef.current) {
        window.clearInterval(activePollRef.current);
        activePollRef.current = null;
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    activePollRef.current = window.setInterval(async () => {
      try {
        const activeData = await loadActive();
        setActiveRun(activeData?.run ?? null);
        setActiveSteps(activeData?.steps ?? []);

        if (!activeData?.run) {
          const runsData = await loadRuns();
          setRecentRuns(
            (runsData as any[]).filter((run) => String(run.status) === "complete")
          );
          if (activePollRef.current) {
            window.clearInterval(activePollRef.current);
            activePollRef.current = null;
          }
        }
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "Unknown error");
      }
    }, 3000);

    return () => {
      if (activePollRef.current) {
        window.clearInterval(activePollRef.current);
      }
    };
  }, []);

  const triggerNow = async () => {
    setTriggering(true);
    try {
      await fetch("/api/trigger", { method: "POST" });
    } catch {
      // stub endpoint for now
    } finally {
      setTriggering(false);
      router.refresh();
    }
  };

  const empty = !loading && !error && !activeRun && recentRuns.length === 0;

  return (
    <div className="min-h-screen">
      <div className="flex flex-col gap-3 border-b border-[#1A1A1A] px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="text-[20px] font-semibold text-[#F0F0F0]">Live Feed</div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <CountdownTimer schedule={schedule} />
          <Button
            variant="ghost"
            size="sm"
            className="w-full md:w-auto"
            onClick={triggerNow}
            disabled={triggering}
          >
            Trigger Now
          </Button>
        </div>
      </div>

      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <Card className="border-[#4d1c1c] bg-[#120D0D] p-5">
            <div className="font-mono text-[12px] text-[#EF4444]">Error State</div>
            <div className="mt-2 text-sm text-[#D8D8D8]">{error}</div>
            <Button className="mt-4 w-full sm:w-auto" variant="ghost" onClick={refresh}>
              Retry
            </Button>
          </Card>
        ) : empty ? (
          <Card className="flex min-h-[220px] items-center justify-center border-[#222222] bg-[#111111]">
            <div className="text-center">
              <div className="flex justify-center text-[#F5C518]">
                <Bot size={28} />
              </div>
              <div className="mt-3 text-sm text-[#F0F0F0]">No runs yet.</div>
              <div className="mt-1 text-sm text-[#666666]">
                Agent will trigger soon based on your schedule.
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {activeRun ? (
              <ActiveRunCard run={activeRun} steps={activeSteps} />
            ) : (
              <Card className="flex items-center justify-between border-[#222222] bg-[#111111] p-5">
                <div>
                  <div className="font-mono text-[12px] text-[#F5C518]">
                    Next run in{" "}
                    {formatCountdown(
                      Math.max(0, Math.floor((nextRunAt.getTime() - Date.now()) / 1000))
                    )}
                  </div>
                  <div className="mt-1 text-sm text-[#666666]">
                    Recent outputs are ready to inspect below.
                  </div>
                </div>
              </Card>
            )}

            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1A1A1A]">
                <h2 className="text-xs font-semibold tracking-widest text-[#666666] uppercase font-mono">
                  Recent Outputs
                </h2>
                <span className="text-xs text-[#666666] font-mono">
                  Showing {recentRuns.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(currentPage * ITEMS_PER_PAGE, recentRuns.length)} of {recentRuns.length}
                </span>
              </div>
              
              <OutputGrid runs={paginatedRuns} />

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#222222]">
                  <button
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0,0); }}
                    disabled={currentPage === 1}
                    className={`px-6 py-3 text-sm font-medium rounded border transition-all
                      ${currentPage === 1
                        ? 'border-[#333] text-[#444] cursor-not-allowed'
                        : 'border-[#F5C518] text-[#F5C518] hover:bg-[#F5C518]/10'
                      }`}
                  >
                    ← Back
                  </button>
                  <span className="text-sm text-[#666]">
                    Page <span className="text-white font-bold">{currentPage}</span> of{' '}
                    <span className="text-white font-bold">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0,0); }}
                    disabled={currentPage === totalPages}
                    className={`px-6 py-3 text-sm font-medium rounded border transition-all
                      ${currentPage === totalPages
                        ? 'border-[#333] text-[#444] cursor-not-allowed'
                        : 'border-[#F5C518] text-[#F5C518] hover:bg-[#F5C518]/10'
                      }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
