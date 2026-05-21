import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[6px] border border-[#222222] bg-[#111111] px-3 py-2 text-sm text-[#F0F0F0] outline-none transition-colors focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]",
        className
      )}
      {...props}
    />
  );
}
