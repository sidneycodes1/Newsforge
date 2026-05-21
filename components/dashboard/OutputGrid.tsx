"use client";

import Link from "next/link";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { formatDateOnly } from "@/lib/format";

function getRunId(run: any) {
  return run.id;
}

function getTitle(run: any) {
  const cardTitle =
    (run as any).article_title ||
    (run as any).output_title ||
    `${run.topic} \u2014 Run #${run.run_number}`;

  return cardTitle || "Untitled run";
}

function getDate(run: any) {
  return run.completedAt ?? run.completed_at ?? run.startedAt ?? run.started_at ?? new Date().toISOString();
}

function OutputImage({ src, title }: { src: string; title: string }) {
  const [error, setError] = useState(false);

  return (
    <div className="w-full h-[120px] bg-[#1A1A1A] rounded-t-[6px] overflow-hidden">
      {!error ? (
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            setError(true);
          }}
        />
      ) : null}
    </div>
  );
}

export default function OutputGrid({ runs }: { runs: any[] }) {
  if (!runs.length) {
    return (
      <Card className="flex min-h-[180px] items-center justify-center border-[#222222] bg-[#111111]">
        <div className="text-center font-sans text-sm text-[#666666]">
          No completed runs yet.
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {runs.map((run) => {
        const cardTitle = getTitle(run);

        return (
          <Link key={getRunId(run)} href={`/run/${getRunId(run)}`}>
            <Card className="overflow-hidden transition-colors hover:border-[#444444] hover:bg-[#1A1A1A]">
              <OutputImage src={`/api/output/${getRunId(run)}/cover.png`} title={cardTitle} />
              <div className="space-y-2 p-3">
                <div
                  className="min-h-[34px] text-[13px] font-medium leading-4 text-[#F0F0F0]"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {cardTitle}
                </div>
                <div className="font-mono text-[11px] text-[#666666]">
                  {formatDateOnly(getDate(run))}
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
