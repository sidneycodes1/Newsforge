import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const dynamic = "force-dynamic";

function getDb() {
  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'newsforge.db');
  console.log('[DB] Connecting to:', dbPath);
  return createClient({ url: `file:${dbPath}` });
}

export async function GET() {
  try {
    const db = getDb();
    const runResult = await db.execute({
      sql: `SELECT * FROM runs
        WHERE status = 'running'
        ORDER BY started_at DESC LIMIT 1`,
      args: [],
    });
    const run = runResult.rows[0] || null;

    if (!run) {
      return NextResponse.json(
        { data: null, error: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const stepsResult = await db.execute({
      sql: `SELECT * FROM steps
        WHERE run_id = ?
        ORDER BY step_number ASC`,
      args: [run.id as string],
    });

    return NextResponse.json(
      { data: { run, steps: stepsResult.rows }, error: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[api/runs/active]", err.message);
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
