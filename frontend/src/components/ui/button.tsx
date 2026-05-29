"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@shared/utils/cn";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[6px] border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-2.5 text-xs",
        variant === "primary" &&
          "border-[#F5C518] bg-[#F5C518] text-black hover:bg-[#e8b90c]",
        variant === "ghost" &&
          "border-[#F0F0F0] bg-transparent text-[#F0F0F0] hover:bg-[#1A1A1A]",
        className
      )}
      {...props}
    />
  );
}
