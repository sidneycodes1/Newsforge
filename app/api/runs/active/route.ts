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
      return NextResponse.json(
        { data: null, error: null },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const run = db.prepare(
      "SELECT * FROM runs WHERE status = 'running' ORDER BY started_at DESC LIMIT 1"
    ).get();

    if (!run) {
      return NextResponse.json(
        { data: null, error: null },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const steps = db.prepare(
      'SELECT * FROM steps WHERE run_id = ? ORDER BY step_number ASC'
    ).all((run as any).id);
    db.close();

    return NextResponse.json(
      { data: { run, steps }, error: null },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('[api/runs/active]', err.message);
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
