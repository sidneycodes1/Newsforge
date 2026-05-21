"use client";

import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import RunsTable from "./RunsTable";

function HistorySkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <Skeleton className="h-10 w-full" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function HistoryScreen() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const response = await fetch("/api/runs", { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "Failed to load run history");
        }
        setRuns(json.data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const empty = useMemo(() => !loading && !error && runs.length === 0, [loading, error, runs.length]);

  return (
    <div className="min-h-screen">
      <div className="border-b border-[#1A1A1A] px-6 py-4">
        <div className="text-[20px] font-semibold text-[#F0F0F0]">Run History</div>
      </div>

      <div className="px-6 pt-6">
        {loading ? (
          <HistorySkeleton />
        ) : error ? (
          <Card className="border-[#4d1c1c] bg-[#120D0D] p-5">
            <div className="font-mono text-[12px] text-[#EF4444]">Error State</div>
            <div className="mt-2 text-sm text-[#D8D8D8]">{error}</div>
          </Card>
        ) : empty ? (
          <Card className="flex min-h-[220px] items-center justify-center border-[#222222] bg-[#111111]">
            <div className="text-center">
              <div className="text-[28px]">🗂</div>
              <div className="mt-2 text-[#666666]">No runs yet.</div>
            </div>
          </Card>
        ) : (
          <RunsTable runs={runs} />
        )}
      </div>
    </div>
  );
}
