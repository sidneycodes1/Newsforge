import type { HTMLAttributes } from "react";
import { cn } from "@shared/utils/cn";

type BadgeVariant = "outline" | "success" | "warning" | "danger" | "muted";

export function Badge({
  className,
  variant = "outline",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] border px-2 py-1 text-[11px] font-medium",
        variant === "outline" && "border-[#333333] bg-transparent text-[#D8D8D8]",
        variant === "success" && "border-[#1f3d2a] bg-[#0f1a12] text-[#22C55E]",
        variant === "warning" && "border-[#4d3d00] bg-[#1c1604] text-[#F5C518]",
        variant === "danger" && "border-[#4d1c1c] bg-[#1b0f0f] text-[#EF4444]",
        variant === "muted" && "border-[#222222] bg-[#0c0c0c] text-[#8a8a8a]",
        className
      )}
      {...props}
    />
  );
}
