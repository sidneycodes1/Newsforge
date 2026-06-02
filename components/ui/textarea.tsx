import type { TextareaHTMLAttributes } from "react";
import { cn } from "@shared/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[6px] border border-[#222222] bg-[#111111] px-3 py-2 text-sm text-[#F0F0F0] outline-none transition-colors placeholder:text-[#666666] focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]",
        className
      )}
      {...props}
    />
  );
}
