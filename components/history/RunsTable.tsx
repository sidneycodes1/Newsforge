"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTime, truncateMiddle } from "@/lib/format";

function getRunNumber(run: any) {
  return run.runNumber ?? run.run_number ?? 0;
}

function getStepCount(run: any) {
  return run.step_count ?? run.stepCount ?? 0;
}

function getAceCost(run: any) {
  return Number(run.total_cost_ace ?? run.totalCostUsdc ?? 0);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") {
    return <Badge variant="success">Complete</Badge>;
  }

  if (status === "failed") {
    return <Badge variant="danger">Failed</Badge>;
  }

  return <Badge variant="warning">Running</Badge>;
}

export default function RunsTable({ runs }: { runs: any[] }) {
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const pageSize = 8;

  const topics = useMemo(
    () => ["all", ...Array.from(new Set(runs.map((run) => run.topic)))],
    [runs]
  );

  const filtered = useMemo(() => {
    return runs.filter((run) => {
      const runDate = new Date(run.started_at ?? run.startedAt ?? Date.now()).getTime();
      const topicMatch = topic === "all" || run.topic === topic;
      const statusMatch = status === "all" || run.status === status;
      const fromMatch = !fromDate || runDate >= new Date(fromDate).getTime();
      const toMatch = !toDate || runDate <= new Date(`${toDate}T23:59:59`).getTime();
      return topicMatch && statusMatch && fromMatch && toMatch;
    });
  }, [runs, topic, status, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTx = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedTx(hash);
    window.setTimeout(() => setCopiedTx(null), 1200);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
        <Select
          value={topic}
          onChange={(event) => {
            setTopic(event.target.value);
            setPage(1);
          }}
        >
          {topics.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All Topics" : item}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="complete">Complete</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
        </Select>
        <Input
          type="date"
          value={fromDate}
          onChange={(event) => {
            setFromDate(event.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          value={toDate}
          onChange={(event) => {
            setToDate(event.target.value);
            setPage(1);
          }}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setTopic("all");
            setStatus("all");
            setFromDate("");
            setToDate("");
            setPage(1);
          }}
        >
          Reset
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="border-b border-[#222222] bg-[#0F0F0F]">
              <tr className="text-left font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                <th className="px-4 py-3">Run #</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Steps</th>
                <th className="px-4 py-3">ACE Cost</th>
                <th className="px-4 py-3">Tx Hash</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((run, index) => {
                  const txHash = run.tx_hash ?? run.txHash ?? "";
                  return (
                    <tr
                      key={run.id}
                      className={[
                        "border-b border-[#1A1A1A] text-sm transition-colors hover:bg-[#1A1A1A]",
                        index % 2 === 0 ? "bg-[#0A0A0A]" : "bg-[#0F0F0F]",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 font-mono text-[#F0F0F0]">
                        <Link href={`/run/${run.id}`} className="hover:text-[#F5C518]">
                          #{getRunNumber(run)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#F0F0F0]">{run.topic}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[#666666]">
                        {getStepCount(run)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#F0F0F0]">
                        {getAceCost(run) > 0 ? `$${getAceCost(run).toFixed(4)}` : "Free"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => copyTx(txHash)}
                          className="relative font-mono text-[11px] text-[#666666] transition-colors hover:text-[#F5C518]"
                        >
                          {truncateMiddle(txHash, 8, 4)}
                          {copiedTx === txHash ? (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-[6px] border border-[#444444] bg-[#111111] px-2 py-1 text-[10px] text-[#F0F0F0]">
                              Copied!
                            </span>
                          ) : null}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#666666]">
                        {formatDateTime(
                          run.started_at ?? run.startedAt ?? new Date().toISOString()
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-[#666666]">
                    No runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[11px] text-[#666666]">
          Showing {visible.length} of {filtered.length} runs
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Prev
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map(
            (pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "primary" : "ghost"}
                size="sm"
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
