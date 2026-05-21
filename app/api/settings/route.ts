import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

type ConfigFile = {
  topic: string;
  schedule: string;
  updatedAt: string;
};

const CONFIG_PATH = path.join(process.cwd(), "config.json");

function readConfig(): ConfigFile | null {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as ConfigFile;
  } catch {
    return null;
  }
}

function writeConfig(config: ConfigFile) {
  mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export async function GET() {
  const config = readConfig();
  const settings = {
    topic: config?.topic ?? process.env.AGENT_TOPIC ?? "Solana ecosystem",
    schedule: config?.schedule ?? process.env.CRON_SCHEDULE ?? "*/30 * * * *",
    aceConnected: Boolean(process.env.ACE_PLATFORM_TOKEN),
  };

  return NextResponse.json({
    data: settings,
    error: null,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      topic?: string;
      schedule?: string;
    };

    const current = readConfig();
    const next: ConfigFile = {
      topic:
        body.topic ?? current?.topic ?? process.env.AGENT_TOPIC ?? "Solana ecosystem",
      schedule:
        body.schedule ?? current?.schedule ?? process.env.CRON_SCHEDULE ?? "*/30 * * * *",
      updatedAt: new Date().toISOString(),
    };

    writeConfig(next);

    return NextResponse.json({
      data: { success: true },
      error: null,
    });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: "Unable to save settings",
      },
      { status: 500 }
    );
  }
}
