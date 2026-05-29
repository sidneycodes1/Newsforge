import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const dynamic = "force-dynamic";

function getDb() {
  const dbPath = path.resolve(process.env.DATABASE_PATH || "./data/newsforge.db");
  return createClient({ url: pathToFileURL(dbPath).href });
}

function zeroStatus() {
  return {
    total_tokens_used: 0,
    tokens_remaining: 5000,
    estimated_runs_remaining: 27,
    warning: false,
    message: "Tokens available",
  };
}

export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT COALESCE(SUM(tokens_used), 0) AS total FROM runs`,
      args: [],
    });
    const totalUsed = Number((result.rows[0] as { total?: number } | undefined)?.total ?? 0);
    const TOTAL_CREDITS = 5000;
    const remaining = Math.max(0, TOTAL_CREDITS - totalUsed);
    const estimatedRunsRemaining = Math.floor(remaining / 180);

    return NextResponse.json({
      total_tokens_used: totalUsed,
      tokens_remaining: remaining,
      estimated_runs_remaining: estimatedRunsRemaining,
      warning: estimatedRunsRemaining <= 10,
      message:
        estimatedRunsRemaining <= 10
          ? `Low credits: ${estimatedRunsRemaining} runs remaining`
          : "Tokens available",
    });
  } catch (err: any) {
    console.warn("[api/token-status]", err.message);
    return NextResponse.json(zeroStatus());
  }
}
