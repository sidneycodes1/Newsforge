import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

export const dynamic = 'force-dynamic';

function openDb() {
  const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(process.cwd(), 'data', 'newsforge.db');

  console.log('[db] opening:', dbPath);

  if (!fs.existsSync(dbPath)) {
    console.log('[db] file not found:', dbPath);
    return null;
  }
  try {
    return new DatabaseSync(dbPath, { readOnly: true });
  } catch (err: any) {
    console.log('[db] error:', err.message);
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
    db.close();

    return NextResponse.json({ data: runs, error: null });
  } catch (err: any) {
    console.error('[api/runs]', err.message);
    return NextResponse.json(
      { data: [], error: err.message },
      { status: 500 }
    );
  }
}
