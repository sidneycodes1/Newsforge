"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { History, Radio, Settings, X } from "lucide-react";

import { cn } from "@shared/utils/cn";

const navItems = [
  { href: "/", label: "Live Feed", icon: Radio },
  { href: "/history", label: "Run History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

function navLabelClasses() {
  return "inline";
}

export default function Sidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setSidebarOpen((value) => !value)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 min-h-12 min-w-12 bg-[#111111] border border-[#222222] rounded flex items-center justify-center text-[#F0F0F0]"
      >
        <span className="text-[18px] leading-none">{sidebarOpen ? "\u00d7" : "\u2630"}</span>
      </button>

      {sidebarOpen ? (
        <div
          role="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30"
        />
      ) : null}

      <aside
        className={`fixed md:static w-64 h-screen bg-[#0A0A0A] border-r border-[#222222] flex flex-col px-4 py-5 transition-all duration-300 z-40 ${
          sidebarOpen ? "left-0" : "-left-64 md:left-0"
        }`}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 flex min-h-12 min-w-12 items-center justify-center rounded-[6px] border border-[#222222] bg-[#111111] text-[#F0F0F0] transition-colors hover:bg-[#1A1A1A] md:hidden"
        >
          <X size={16} />
        </button>

        <div className="mt-2 md:mt-0">
          <div className="min-w-0 md:text-center lg:text-left">
            <div className="hidden font-mono text-[16px] font-bold tracking-[0.18em] text-[#F0F0F0] lg:block">
              NEWSFORGE
            </div>
            <div className="mt-2 hidden items-center font-mono text-[11px] text-[#22C55E] lg:flex">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
              Active
            </div>
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
                  "flex min-h-12 items-center gap-3 border-l-2 px-3 py-2 text-[14px] transition-colors md:justify-start md:px-3",
                  active
                    ? "border-[#F5C518] bg-[#1A1A1A] text-[#F5C518]"
                    : "border-transparent text-[#666666] hover:bg-[#1A1A1A] hover:text-[#F0F0F0]"
                )}
              >
                <item.icon size={14} />
                <span className={navLabelClasses()}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
