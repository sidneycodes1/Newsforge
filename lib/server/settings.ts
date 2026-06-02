import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SettingsRecord } from "@shared/types";

const CONFIG_DIR = path.join(process.cwd(), "config", "runtime");
const CONFIG_PATH = path.join(CONFIG_DIR, "newsforge.json");

const intervalToCron: Record<SettingsRecord["intervalLabel"], string> = {
  "15min": "*/15 * * * *",
  "30min": "*/30 * * * *",
  "1hr": "0 * * * *",
  "6hr": "0 */6 * * *",
};

const intervalToMinutes: Record<SettingsRecord["intervalLabel"], number> = {
  "15min": 15,
  "30min": 30,
  "1hr": 60,
  "6hr": 360,
};

const cronToIntervalLabel: Record<string, SettingsRecord["intervalLabel"]> = {
  "*/15 * * * *": "15min",
  "*/30 * * * *": "30min",
  "0 * * * *": "1hr",
  "0 */6 * * *": "6hr",
};

export const defaultSettings: SettingsRecord = {
  agentName: "NewsForge SAP Agent",
  sapAgentAddress: "8xH3...a1Z7",
  cronSchedule: "*/30 * * * *",
  intervalLabel: "30min",
  topic: "Solana ecosystem",
  synapseRpcEndpoint: "https://rpc.synapse.network/v1",
  acePlatformHealthy: true,
  synapseHealthy: true,
  solanaBalanceSol: 0.0524,
  acePlatformTokenMasked: "nf_demo_token_**********",
  nextRunAt: new Date(Date.now() + 4 * 60 * 1000 + 32 * 1000).toISOString(),
};

function normalizeSettings(input: Partial<SettingsRecord>): SettingsRecord {
  const intervalLabel =
    input.intervalLabel ??
    (input.cronSchedule ? cronToIntervalLabel[input.cronSchedule] : undefined) ??
    defaultSettings.intervalLabel;
  return {
    ...defaultSettings,
    ...input,
    intervalLabel,
    cronSchedule: input.cronSchedule ?? intervalToCron[intervalLabel],
    nextRunAt: input.nextRunAt ?? defaultSettings.nextRunAt,
  };
}

export async function readSettings(): Promise<SettingsRecord> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    return normalizeSettings(JSON.parse(raw) as Partial<SettingsRecord>);
  } catch {
    await mkdir(CONFIG_DIR, { recursive: true });
    await writeFile(CONFIG_PATH, JSON.stringify(defaultSettings, null, 2), "utf8");
    return defaultSettings;
  }
}

export async function saveSettings(
  partial: Partial<
    Pick<SettingsRecord, "intervalLabel" | "topic" | "synapseRpcEndpoint" | "agentName"> & {
      schedule?: string;
    }
  >
) {
  const current = await readSettings();
  const intervalLabel =
    partial.intervalLabel ??
    (partial.schedule ? cronToIntervalLabel[partial.schedule] : undefined) ??
    current.intervalLabel;
  const next: SettingsRecord = {
    ...current,
    ...partial,
    intervalLabel,
    cronSchedule: partial.schedule ?? intervalToCron[intervalLabel],
    nextRunAt: new Date(
      Date.now() + intervalToMinutes[intervalLabel] * 60_000
    ).toISOString(),
  };

  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function getIntervalMinutes(intervalLabel: SettingsRecord["intervalLabel"]) {
  return intervalToMinutes[intervalLabel];
}
