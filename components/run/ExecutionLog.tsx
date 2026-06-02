"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatUSDC, truncateMiddle } from "@shared/utils/format";

function StatusMark({ status }: { status: string }) {
  if (status === "complete") {
    return <CheckCircle2 size={14} className="text-[#22C55E]" />;
  }

  if (status === "running") {
    return <Loader2 size={14} className="animate-spin text-[#F5C518]" />;
  }

  if (status === "failed") {
    return <XCircle size={14} className="text-[#EF4444]" />;
  }

  return <Circle size={14} className="text-[#666666]" />;
}

function getStepNumber(step: any) {
  return step.stepNumber ?? step.step_number ?? 0;
}

function getStepName(step: any) {
  return step.stepName ?? step.step_name ?? "Step";
}

function getApiUsed(step: any) {
  return step.apiUsed ?? step.api_used ?? "";
}

function getDuration(step: any) {
  return step.durationMs ?? step.duration_ms ?? 0;
}

function getCostUsdc(step: any) {
  return Number(step.costUsdc ?? step.cost_usdc ?? 0);
}

function getTxHash(step: any) {
  return step.txHash ?? step.tx_hash ?? "";
}

export default function ExecutionLog({
  steps,
  runId,
}: {
  steps: any[];
  runId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isExpandable = steps.length > 2;

  return (
    <Card className="border-[#222222] bg-[#111111] p-4" data-run-id={runId}>
      <div className="mb-4 font-mono text-[13px] uppercase tracking-[0.16em] text-[#666666]">
        Execution Log
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <details
            key={step.id}
            className={[
              "group rounded-[6px] border border-[#222222] bg-[#0D0D0D]",
              index >= 2 && !expanded ? "hidden md:block" : "block",
            ].join(" ")}
            open={step.status === "running"}
          >
            <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="font-mono text-[11px] text-[#666666]">
                  {String(getStepNumber(step)).padStart(2, "0")}
                </div>
                <StatusMark status={step.status ?? "pending"} />
                <div className="truncate text-[13px] text-[#F0F0F0]">{getStepName(step)}</div>
              </div>
              <div className="font-mono text-[11px] text-[#666666]">{getApiUsed(step)}</div>
            </summary>

            <div className="border-t border-[#1A1A1A] px-4 py-3 text-sm text-[#F0F0F0]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                    API Called
                  </div>
                  <div>{getApiUsed(step)}</div>
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                    Duration
                  </div>
                  <div className="font-mono text-[#666666]">{getDuration(step)}ms</div>
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                    Cost
                  </div>
                  <div className="font-mono text-[#22C55E]">
                    {getCostUsdc(step) > 0 ? formatUSDC(getCostUsdc(step)) : "Free credits"}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                    Tx Hash
                  </div>
                  <div className="break-all font-mono text-[#666666]">
                    {truncateMiddle(getTxHash(step), 8, 4)}
                  </div>
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>

      {isExpandable ? (
        <Button
          variant="ghost"
          className="mt-3 w-full md:hidden"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Collapse" : "Expand"}
        </Button>
      ) : null}
    </Card>
  );
}
