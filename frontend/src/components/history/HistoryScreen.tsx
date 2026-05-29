"use client";

import RunsTable from "./RunsTable";

export default function HistoryScreen() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-[#1A1A1A] px-6 py-4">
        <div className="text-[20px] font-semibold text-[#F0F0F0]">Run History</div>
      </div>

      <div className="px-6 pt-6">
        <RunsTable />
      </div>
    </div>
  );
}
