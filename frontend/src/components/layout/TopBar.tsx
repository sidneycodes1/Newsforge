import type { ReactNode } from "react";
import { cn } from "@shared/utils/cn";

export default function TopBar({
  title,
  right,
  subtitle,
  className,
}: {
  title: string;
  right?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 border-b border-[#222222] pb-4 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="font-mono text-[20px] font-semibold tracking-tight text-[#F0F0F0]">
          {title}
        </h1>
        {subtitle ? <div className="text-sm text-[#666666]">{subtitle}</div> : null}
      </div>
      {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  );
}
