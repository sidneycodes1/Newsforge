import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const dynamic = "force-dynamic";

function getDb() {
  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), '..', 'data', 'newsforge.db');
  console.log('[DB] Connecting to:', dbPath);
  return createClient({ url: `file:${dbPath}` });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();

    const runResult = await db.execute({
      sql: `SELECT * FROM runs WHERE id = ?`,
      args: [params.id],
    });
    const run = runResult.rows[0] || null;

    if (!run) {
      return NextResponse.json(
        { data: null, error: "Not found" },
        { status: 404 }
      );
    }

    const stepsResult = await db.execute({
      sql: `SELECT * FROM steps
        WHERE run_id = ?
        ORDER BY step_number ASC`,
      args: [params.id],
    });

    const outputResult = await db.execute({
      sql: `SELECT * FROM outputs WHERE run_id = ?`,
      args: [params.id],
    });

    return NextResponse.json({
      data: {
        run,
        steps: stepsResult.rows,
        output: outputResult.rows[0] || null,
      },
      error: null,
    });
  } catch (err: any) {
    console.error("[api/runs/[id]]", err.message);
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
