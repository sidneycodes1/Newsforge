"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@frontend/components/ui/badge";
import { Button } from "@frontend/components/ui/button";
import { Card } from "@frontend/components/ui/card";
import { Input } from "@frontend/components/ui/input";
import { Select } from "@frontend/components/ui/select";
import { formatDateTime, truncateMiddle } from "@shared/utils/format";

type RunRow = {
  id: string;
  run_number?: number;
  runNumber?: number;
  topic?: string;
  article_title?: string | null;
  output_title?: string | null;
  status?: string;
  step_count?: number;
  stepCount?: number;
  total_cost_ace?: number;
  totalCostUsdc?: number;
  tx_hash?: string | null;
  txHash?: string | null;
  started_at?: string;
  startedAt?: string;
};

type RunsResponse = {
  data?: RunRow[];
  total?: number;
  page?: number;
  limit?: number;
  topics?: string[];
  error?: string | null;
};

const PAGE_SIZE = 10;

function getRunNumber(run: RunRow) {
  return run.runNumber ?? run.run_number ?? 0;
}

function getStepCount(run: RunRow) {
  return run.step_count ?? run.stepCount ?? 0;
}

function getAceCost(run: RunRow) {
  return Number(run.total_cost_ace ?? run.totalCostUsdc ?? 0);
}

function getArticleTitle(run: RunRow) {
  return (
    run.article_title?.trim() ||
    run.output_title?.trim() ||
    run.topic?.trim() ||
    "Untitled run"
  );
}

function getStartedAt(run: RunRow) {
  return run.started_at ?? run.startedAt ?? new Date().toISOString();
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

function HistorySkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse p-5">
        <div className="h-10 w-full rounded-[6px] bg-[#161616]" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 w-full rounded-[6px] bg-[#111111]" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function RunsTable() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [topics, setTopics] = useState<string[]>(["all"]);
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    if (topic !== "all") {
      params.set("topic", topic);
    }

    if (status !== "all") {
      params.set("status", status);
    }

    if (fromDate) {
      params.set("fromDate", fromDate);
    }

    if (toDate) {
      params.set("toDate", toDate);
    }

    return params.toString();
  }, [page, topic, status, fromDate, toDate]);

  useEffect(() => {
    const controller = new AbortController();

    const loadRuns = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/runs?${queryString}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = (await response.json()) as RunsResponse;

        if (!response.ok) {
          throw new Error(json.error ?? "Failed to load run history");
        }

        setRuns(json.data ?? []);
        setTotal(json.total ?? 0);
        setTopics(["all", ...(json.topics ?? [])]);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Unknown error"
        );
        setRuns([]);
        setTotal(0);
        setTopics(["all"]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadRuns();

    return () => controller.abort();
  }, [queryString]);

  const copyTx = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedTx(hash);
    window.setTimeout(() => setCopiedTx(null), 1200);
  };

  const handleRowActivate = (runId: string) => {
    router.push(`/run/${runId}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
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
          className="w-full sm:col-span-2 lg:col-span-1"
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

      {loading ? (
        <HistorySkeleton />
      ) : error ? (
        <Card className="border-[#4d1c1c] bg-[#120D0D] p-5">
          <div className="font-mono text-[12px] text-[#EF4444]">Error State</div>
          <div className="mt-2 text-sm text-[#D8D8D8]">{error}</div>
        </Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {runs.length ? (
              runs.map((run) => {
                const txHash = run.tx_hash ?? run.txHash ?? "";

                return (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => handleRowActivate(run.id)}
                    className="flex w-full flex-col gap-3 rounded-[6px] border border-[#222222] bg-[#111111] p-4 text-left transition-colors hover:border-[#444444] hover:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-[11px] text-[#666666]">
                        Run #{getRunNumber(run)}
                      </div>
                      <StatusBadge status={run.status ?? "running"} />
                    </div>
                    <div className="text-[14px] text-[#F0F0F0]">{getArticleTitle(run)}</div>
                    <div className="font-mono text-[11px] text-[#666666]">
                      {formatDateTime(getStartedAt(run))}
                    </div>
                    <div className="font-mono text-[11px] text-[#666666]">
                      {getStepCount(run)} steps {"\u00b7"} {getAceCost(run) > 0 ? `$${getAceCost(run).toFixed(4)}` : "Free"}
                    </div>
                    <div className="font-mono text-[11px] text-[#666666]">
                      {truncateMiddle(txHash, 8, 4)}
                    </div>
                  </button>
                );
              })
            ) : (
              <Card className="px-4 py-14 text-center text-[#666666]">No runs yet.</Card>
            )}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-hidden">
              <table className="min-w-full border-collapse">
                <thead className="border-b border-[#222222] bg-[#0F0F0F]">
                  <tr className="text-left font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                    <th className="px-4 py-3">Run #</th>
                    <th className="px-4 py-3">Topic</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Steps</th>
                    <th className="hidden px-4 py-3 lg:table-cell">ACE Cost</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Tx Hash</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length ? (
                    runs.map((run, index) => {
                      const txHash = run.tx_hash ?? run.txHash ?? "";

                      return (
                        <tr
                          key={run.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open run ${getRunNumber(run)}`}
                          onClick={() => handleRowActivate(run.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleRowActivate(run.id);
                            }
                          }}
                          className={[
                            "border-b border-[#1A1A1A] text-sm transition-colors hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:outline-none",
                            "cursor-pointer",
                            index % 2 === 0 ? "bg-[#0A0A0A]" : "bg-[#0F0F0F]",
                          ].join(" ")}
                        >
                          <td className="px-4 py-3 font-mono text-[#F0F0F0]">
                            #{getRunNumber(run)}
                          </td>
                          <td className="px-4 py-3 text-[#F0F0F0]">{getArticleTitle(run)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={run.status ?? "running"} />
                          </td>
                          <td className="hidden px-4 py-3 font-mono text-[#666666] lg:table-cell">
                            {getStepCount(run)}
                          </td>
                          <td className="hidden px-4 py-3 font-mono text-[#F0F0F0] lg:table-cell">
                            {getAceCost(run) > 0 ? `$${getAceCost(run).toFixed(4)}` : "Free"}
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void copyTx(txHash);
                              }}
                              className="relative min-h-11 min-w-11 font-mono text-[11px] text-[#666666] transition-colors hover:text-[#F5C518]"
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
                            {formatDateTime(getStartedAt(run))}
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
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-[11px] text-[#666666]">
          Showing {runs.length} of {total} runs
          <span className="ml-3 text-[#888888]">
            Page {page} of {totalPages}
          </span>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
