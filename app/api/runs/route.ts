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

function toInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildFilters(searchParams: URLSearchParams) {
  const where: string[] = [];
  const args: Array<string | number> = [];

  const topic = searchParams.get("topic");
  if (topic && topic !== "all") {
    where.push("r.topic = ?");
    args.push(topic);
  }

  const status = searchParams.get("status");
  if (status && status !== "all") {
    where.push("r.status = ?");
    args.push(status);
  }

  const fromDate = searchParams.get("fromDate");
  if (fromDate) {
    where.push("datetime(r.started_at) >= datetime(?)");
    args.push(fromDate);
  }

  const toDate = searchParams.get("toDate");
  if (toDate) {
    where.push("datetime(r.started_at) <= datetime(?)");
    args.push(`${toDate}T23:59:59`);
  }

  return { where, args };
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = toInt(searchParams.get("page"), 1);
    const limit = Math.min(toInt(searchParams.get("limit"), 10), 100);
    const offset = (page - 1) * limit;
    const { where, args } = buildFilters(searchParams);
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalResult = await db.execute({
      sql: `
        SELECT COUNT(DISTINCT r.id) AS total
        FROM runs r
        LEFT JOIN outputs o ON o.run_id = r.id
        ${whereClause}
      `,
      args,
    });

    const total = Number(
      (totalResult.rows[0] as { total?: number } | undefined)?.total ?? 0
    );

    const runsResult = await db.execute({
      sql: `
        SELECT
          r.*,
          COALESCE(o.article_title, r.topic) AS article_title,
          o.image_path,
          o.audio_path,
          COUNT(DISTINCT s.id) AS step_count
        FROM runs r
        LEFT JOIN steps s ON s.run_id = r.id
        LEFT JOIN outputs o ON o.run_id = r.id
        ${whereClause}
        GROUP BY r.id
        ORDER BY datetime(r.started_at) DESC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    });

    const topicsResult = await db.execute({
      sql: `SELECT DISTINCT topic FROM runs ORDER BY topic ASC`,
      args: [],
    });

    return NextResponse.json({
      data: runsResult.rows,
      total,
      page,
      limit,
      topics: topicsResult.rows.map(
        (row) => (row as { topic?: string }).topic
      ).filter(Boolean),
      error: null,
    });
  } catch (err: any) {
    console.error("[api/runs]", err.message);
    return NextResponse.json(
      { data: [], total: 0, page: 1, limit: 10, topics: [], error: err.message },
      { status: 500 }
    );
  }
}
