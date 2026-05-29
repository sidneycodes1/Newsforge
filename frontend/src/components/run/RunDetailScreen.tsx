"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@frontend/components/ui/badge";
import { Card } from "@frontend/components/ui/card";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { formatDateTime } from "@shared/utils/format";

import ArticleView from "./ArticleView";
import AudioPlayer from "./AudioPlayer";
import ExecutionLog from "./ExecutionLog";

function DetailSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] lg:gap-5">
      <Card className="p-4 sm:p-5">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="mt-4 h-80 w-full" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
        </div>
      </Card>
      <Card className="p-4 sm:p-5">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    </div>
  );
}

export default function RunDetailScreen({ id }: { id: string }) {
  const [runData, setRunData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/runs/${id}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "Failed to load run");
        }
        setRunData(json.data ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const output = runData?.output ?? null;
  const run = runData?.run ?? null;
  const steps = runData?.steps ?? [];

  const displayTitle =
    output?.article_title?.trim() ||
    (run?.topic ? `${run.topic} \u2014 Run #${run?.run_number ?? run?.runNumber ?? ""}`.trim() : "") ||
    "NewsForge Report";

  if (loading) {
    return (
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <Card className="border-[#4d1c1c] bg-[#120D0D] p-5">
          <div className="font-mono text-[12px] text-[#EF4444]">Error State</div>
          <div className="mt-2 text-sm text-[#D8D8D8]">
            {error ?? "This run could not be found."}
          </div>
          <Link href="/history" className="mt-4 inline-block text-sm text-[#F5C518]">
            Back to history
          </Link>
        </Card>
      </div>
    );
  }

  const status = run.status ?? "running";
  const hasAudio =
    Boolean(output?.audio_path) &&
    !String(output?.audio_path).includes("skipped") &&
    !String(output?.audio_path).includes("stub") &&
    !String(output?.audio_path).includes("error");

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/history" className="font-mono text-[12px] text-[#666666] hover:text-[#F5C518]">
          {"<- Back to History"}
        </Link>
        <div className="font-mono text-[12px] text-[#666666]">
          Run #{run.run_number ?? run.runNumber} | {formatDateTime(run.started_at ?? run.startedAt)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)] lg:gap-5">
        <div className="space-y-5">
          <ArticleView runId={id} run={run} output={output} />
          {(() => {
            if (hasAudio) {
              return (
                <div className="mt-6">
                  <p className="mb-2 font-mono text-xs uppercase tracking-wider text-[#666666]">
                    Audio Summary
                  </p>
                  <p className="mb-2 text-sm text-[#666666]">{displayTitle}</p>
                  <AudioPlayer src={`/api/output/${id}/audio.mp3`} />
                </div>
              );
            }

            if (output?.audio_text) {
              return (
                <div className="mt-6 rounded-[6px] border border-[#222222] p-4">
                  <p className="mb-2 font-mono text-xs uppercase tracking-wider text-[#666666]">
                    Audio Summary (generated as text):
                  </p>
                  <p className="text-sm text-[#D8D8D8]">
                    {output.audio_text}
                  </p>
                </div>
              );
            }

            return (
              <div className="mt-6 rounded-[6px] border border-[#222222] p-4 text-sm italic text-[#666666]">
                Audio generation skipped (low tokens \u2014 focus on article content)
              </div>
            );
          })()}
        </div>

        <div className="space-y-4">
          <Card className="border-[#222222] bg-[#111111] p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[13px] uppercase tracking-[0.16em] text-[#666666]">
                Run Summary
              </div>
              <Badge
                variant={
                  status === "complete"
                    ? "success"
                    : status === "failed"
                      ? "danger"
                      : "warning"
                }
              >
                {status === "complete" ? "Complete" : status === "failed" ? "Failed" : "Running"}
              </Badge>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <span className="text-[#666666]">Topic</span>
                <span>{run.topic}</span>
              </div>
            </div>
          </Card>

          <ExecutionLog steps={steps} runId={id} />
        </div>
      </div>
    </div>
  );
}
