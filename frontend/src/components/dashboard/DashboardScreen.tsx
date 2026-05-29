"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCountdown } from "@/lib/format";

import ActiveRunCard from "./ActiveRunCard";
import CountdownTimer from "./CountdownTimer";
import OutputGrid from "./OutputGrid";

function getScheduleMinutes(schedule: string) {
  if (schedule === "*/15 * * * *") return 15;
  if (schedule === "*/30 * * * *") return 30;
  if (schedule === "0 * * * *") return 60;
  if (schedule === "0 */6 * * *") return 360;
  return 30;
}

function getNextRunDate(schedule: string) {
  return new Date(Date.now() + getScheduleMinutes(schedule) * 60_000);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-5 h-[260px] w-full" />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

  const nextRunAt = useMemo(() => getNextRunDate(schedule), [schedule]);

  const loadRuns = async () => {
    const response = await fetch("/api/runs", { cache: "no-store" });
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
        (runsData as any[]).filter((run) => String(run.status) === "complete").slice(0, 6)
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
            (runsData as any[]).filter((run) => String(run.status) === "complete").slice(0, 6)
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
      <div className="flex items-center justify-between border-b border-[#1A1A1A] px-6 py-4">
        <div className="text-[20px] font-semibold text-[#F0F0F0]">Live Feed</div>
        <div className="flex items-center gap-3">
          <CountdownTimer nextRunAt={nextRunAt} />
          <Button variant="ghost" size="sm" onClick={triggerNow} disabled={triggering}>
            Trigger Now
          </Button>
        </div>
      </div>

      <div className="px-6 pt-6">
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <Card className="border-[#4d1c1c] bg-[#120D0D] p-5">
            <div className="font-mono text-[12px] text-[#EF4444]">Error State</div>
            <div className="mt-2 text-sm text-[#D8D8D8]">{error}</div>
            <Button className="mt-4" variant="ghost" onClick={refresh}>
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
              <div className="mb-4 text-[14px] uppercase tracking-[0.16em] text-[#666666]">
                Recent Outputs
              </div>
              <OutputGrid runs={recentRuns} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
