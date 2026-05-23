import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

function openDb() {
  const dbPath = path.resolve(
    process.env.DATABASE_PATH || './data/newsforge.db'
  );
  if (!fs.existsSync(dbPath)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3');
    return new Database(dbPath, { readonly: true });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const db = openDb();
    if (!db) {
      return NextResponse.json({ data: [], error: null });
    }

    const runs = db.prepare(`
      SELECT
        r.*,
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
      LIMIT 50
    `).all();

    return NextResponse.json({ data: runs, error: null });
  } catch (err: any) {
    console.error('[api/runs]', err.message);
    return NextResponse.json(
      { data: [], error: err.message },
      { status: 500 }
    );
  }
}
