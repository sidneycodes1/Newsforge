"use client";

import { Card } from "@/components/ui/card";
import { formatDateTime, formatUSDC } from "@/lib/format";

import PipelineStep from "./PipelineStep";

function getRunNumber(run: any) {
  return run.runNumber ?? run.run_number ?? 0;
}

function getTopic(run: any) {
  return run.topic ?? "";
}

function getStartedAt(run: any) {
  return run.startedAt ?? run.started_at ?? new Date().toISOString();
}

function getSteps(steps: any[]) {
  const base = steps ?? [];
  const byNumber = new Map(
    base.map((step) => [step.stepNumber ?? step.step_number, step])
  );
  const order = [
    { stepNumber: 1, stepName: "Fetch News", apiUsed: "ACE Search API" },
    { stepNumber: 2, stepName: "Write Article", apiUsed: "ACE Chat API" },
    { stepNumber: 3, stepName: "Generate Image", apiUsed: "ACE Flux API" },
    { stepNumber: 4, stepName: "Generate Audio", apiUsed: "ACE TTS API" },
  ];

  return order.map((template) => {
    const step = byNumber.get(template.stepNumber);
    if (step) {
      return {
        ...template,
        ...step,
        stepNumber: step.stepNumber ?? step.step_number ?? template.stepNumber,
        stepName: step.stepName ?? step.step_name ?? template.stepName,
        apiUsed: step.apiUsed ?? step.api_used ?? template.apiUsed,
      };
    }

    return {
      ...template,
      status: "pending",
      costUsdc: 0,
      txHash: "",
      durationMs: 0,
    };
  });
}

export default function ActiveRunCard({ run, steps }: { run: any; steps: any[] }) {
  const normalizedSteps = getSteps(steps);
  const aceTotal = normalizedSteps.reduce(
    (sum, step) => sum + Number(step.costUsdc ?? step.cost_usdc ?? 0),
    0
  );

  return (
    <Card className="border-[#222222] bg-[#111111] p-6 transition-colors hover:border-[#444444] hover:bg-[#1A1A1A]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F97316] animate-pulse" />
          <div className="font-mono text-[14px] text-[#F0F0F0]">
            Run #{getRunNumber(run)} - In Progress
          </div>
          <div className="rounded-[6px] border border-[#444444] px-2 py-1 font-mono text-[11px] text-[#666666]">
            {getTopic(run)}
          </div>
        </div>
        <div className="font-mono text-[11px] text-[#666666]">
          {formatDateTime(getStartedAt(run))}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[6px] border border-[#1A1A1A]">
        {normalizedSteps.map((step) => (
          <PipelineStep key={step.stepNumber ?? step.step_number} step={step} />
        ))}
      </div>

      <div className="mt-4 flex justify-end font-mono text-[12px] text-[#22C55E]">
        {aceTotal > 0
          ? `Total paid: ${formatUSDC(aceTotal)} (ACE free credits)`
          : "Total cost: Free credits"}
      </div>
    </Card>
  );
}
