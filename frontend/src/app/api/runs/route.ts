import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const dynamic = "force-dynamic";

function getDb() {
  const dbPath = path.resolve(
    process.env.DATABASE_PATH || "./data/newsforge.db"
  );

  return createClient({ url: pathToFileURL(dbPath).href });
}

export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT r.*,
        o.article_title,
        o.article_title AS output_title,
        o.image_path,
        o.audio_path,
        COUNT(s.id) AS step_count
        FROM runs r
        LEFT JOIN steps s ON s.run_id = r.id
        LEFT JOIN outputs o ON o.run_id = r.id
        GROUP BY r.id
        ORDER BY r.started_at DESC
        LIMIT 50`,
      args: [],
    });

    return NextResponse.json({
      data: result.rows,
      error: null,
    });
  } catch (err: any) {
    console.error("[api/runs]", err.message);
    return NextResponse.json(
      { data: [], error: err.message },
      { status: 500 }
    );
  }
}
