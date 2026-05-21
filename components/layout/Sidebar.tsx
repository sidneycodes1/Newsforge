"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Radio, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Live Feed", icon: Radio },
  { href: "/history", label: "Run History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[240px] border-r border-[#1A1A1A] bg-[#0D0D0D] px-4 py-5 md:flex md:flex-col">
      <div>
        <div className="font-mono text-[16px] font-bold tracking-[0.18em] text-[#F0F0F0]">
          NEWSFORGE
        </div>
        <div className="mt-3 flex items-center font-mono text-[11px] text-[#22C55E]">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
          Active
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 border-l-2 px-3 py-2 text-[14px] transition-colors",
                active
                  ? "border-[#F5C518] bg-[#1A1A1A] text-[#F5C518]"
                  : "border-transparent text-[#666666] hover:bg-[#1A1A1A] hover:text-[#F0F0F0]"
              )}
            >
              <item.icon size={14} />
              <span className="font-sans">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
