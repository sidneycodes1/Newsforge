import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

import { cn } from "@shared/utils/cn";

type StepStatus = "pending" | "running" | "complete" | "failed";

function StatusIcon({ status }: { status: StepStatus }) {
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
  return step.stepName ?? step.step_name ?? "";
}

function getApiUsed(step: any) {
  return step.apiUsed ?? step.api_used ?? "";
}

function getStatus(step: any): StepStatus {
  return (step.status ?? "pending") as StepStatus;
}

export default function PipelineStep({ step }: { step: any }) {
  const status = getStatus(step);
  const costUsdc = step.costUsdc ?? step.cost_usdc ?? 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-[#1A1A1A] px-4 py-3 transition-colors last:border-b-0 md:h-12 md:flex-row md:items-center md:gap-0 md:py-0",
        status === "running" && "bg-[#1A1A1A]"
      )}
    >
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="w-8 font-mono text-[11px] text-[#666666]">
          {String(getStepNumber(step)).padStart(2, "0")}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StatusIcon status={status} />
          <div className="truncate text-[14px] text-[#F0F0F0]">{getStepName(step)}</div>
        </div>
        <div className="min-w-0 text-left font-mono text-[11px] text-[#666666] md:min-w-[120px] md:text-right">
          {getApiUsed(step)}
        </div>
        <div className="w-full text-left font-mono text-[11px] text-[#22C55E] md:w-[130px] md:text-right">
          {status === "complete" ? (costUsdc > 0 ? `$${costUsdc.toFixed(4)} USDC` : "Free") : ""}
        </div>
      </div>
    </div>
  );
}
