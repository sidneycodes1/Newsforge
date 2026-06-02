"use client";

import { useEffect, useState } from "react";

import DashboardScreen from "@/components/dashboard/DashboardScreen";

type TokenStatus = {
  total_tokens_used?: number;
  tokens_remaining?: number;
  estimated_runs_remaining?: number;
  warning?: boolean;
  message?: string;
};

export default function Page() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);

  useEffect(() => {
    fetch("/api/token-status")
      .then((response) => response.json())
      .then((data) => setTokenStatus(data))
      .catch((error) => console.error("Token status error:", error));
  }, []);

  return (
    <div className="space-y-6 overflow-x-hidden">
      {tokenStatus?.warning ? (
        <div className="rounded-[6px] border border-[#7f1d1d] bg-[#3a1010] p-4 text-[#FCA5A5]">
          <div className="font-semibold">{tokenStatus.message}</div>
          <div className="mt-1 text-sm text-[#FECACA]">
            {tokenStatus.estimated_runs_remaining ?? 0} runs remaining before credits exhaust
          </div>
        </div>
      ) : null}

      <DashboardScreen />
    </div>
  );
}
