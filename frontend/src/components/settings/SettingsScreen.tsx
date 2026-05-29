"use client";

import { useEffect, useState } from "react";

import { Button } from "@frontend/components/ui/button";
import { Card } from "@frontend/components/ui/card";
import { Input } from "@frontend/components/ui/input";
import { Select } from "@frontend/components/ui/select";
import { Skeleton } from "@frontend/components/ui/skeleton";

function Toast({
  message,
  kind,
}: {
  message: string | null;
  kind: "success" | "error";
}) {
  if (!message) return null;
  return (
    <div
      className={`fixed right-6 top-6 z-50 rounded-[6px] border px-4 py-3 text-sm ${
        kind === "success"
          ? "border-[#22C55E]/20 bg-[#0F1A12] text-[#22C55E]"
          : "border-[#EF4444]/20 bg-[#1B0F0F] text-[#EF4444]"
      }`}
    >
      {message}
    </div>
  );
}

function FieldSkeleton() {
  return <Skeleton className="h-10 w-full" />;
}

function getIntervalLabel(schedule: string) {
  if (schedule === "*/15 * * * *") return "15min";
  if (schedule === "*/30 * * * *") return "30min";
  if (schedule === "0 * * * *") return "1hr";
  if (schedule === "0 */6 * * *") return "6hr";
  return "30min";
}

function getScheduleFromLabel(label: string) {
  if (label === "15min") return "*/15 * * * *";
  if (label === "30min") return "*/30 * * * *";
  if (label === "1hr") return "0 * * * *";
  if (label === "6hr") return "0 */6 * * *";
  return "*/30 * * * *";
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    kind: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "Failed to load settings");
        }
        setSettings({
          ...json.data,
          intervalLabel: getIntervalLabel(json.data.schedule ?? "*/30 * * * *"),
        });
      } catch {
        setToast({ message: "Unable to load settings", kind: "error" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const update = (patch: Record<string, unknown>) => {
    setSettings((current: any) => (current ? { ...current, ...patch } : current));
  };

  const save = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: settings.topic,
          schedule: getScheduleFromLabel(settings.intervalLabel),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to save settings");
      }
      setToast({ message: "Settings saved.", kind: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unknown error",
        kind: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <Toast message={toast?.message ?? null} kind={toast?.kind ?? "success"} />

      <div className="border-b border-[#1A1A1A] pb-4">
        <div className="text-[20px] font-semibold text-[#F0F0F0]">Settings</div>
      </div>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="space-y-4 p-5">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </Card>
          <Card className="space-y-4 p-5">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </Card>
        </div>
      ) : settings ? (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="mb-4 text-[16px] font-semibold text-[#F0F0F0]">Run Schedule</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                    Topic
                  </div>
                  <Input
                    value={settings.topic ?? ""}
                    onChange={(event) => update({ topic: event.target.value })}
                  />
                </div>
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                    Interval
                  </div>
                  <Select
                    value={settings.intervalLabel ?? "30min"}
                    onChange={(event) => update({ intervalLabel: event.target.value })}
                  >
                    <option value="15min">Every 15 minutes</option>
                    <option value="30min">Every 30 minutes</option>
                    <option value="1hr">Every 1 hour</option>
                    <option value="6hr">Every 6 hours</option>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 text-[16px] font-semibold text-[#F0F0F0]">API Status</div>
              <div className="space-y-3">
                <StatusRow
                  label="ACE Platform"
                  connected={Boolean(settings.aceConnected)}
                />
              </div>
            </Card>

            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <div className="mb-3 text-[16px] font-semibold text-[#F0F0F0]">Agent Notes</div>
              <p className="text-sm leading-7 text-[#B5B5B5]">
                The frontend reads this configuration and the worker picks up the saved schedule and topic
                on the next run.
              </p>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusRow({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[6px] border border-[#222222] bg-[#0D0D0D] px-3 py-3">
      <div className="font-mono text-[12px] text-[#666666]">{label}</div>
      <div className="flex items-center gap-2 font-mono text-[12px]">
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-[#22C55E]" : "bg-[#EF4444]"}`} />
        <span className={connected ? "text-[#22C55E]" : "text-[#EF4444]"}>
          {connected ? "Connected" : "Not configured"}
        </span>
      </div>
    </div>
  );
}
