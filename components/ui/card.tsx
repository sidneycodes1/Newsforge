import type { HTMLAttributes } from "react";
import { cn } from "@shared/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[6px] border border-[#222222] bg-[#111111]",
        className
      )}
      {...props}
    />
  );
}
