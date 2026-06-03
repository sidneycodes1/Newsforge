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
      {/* Warning banner removed */}
      <DashboardScreen />
    </div>
  );
}
