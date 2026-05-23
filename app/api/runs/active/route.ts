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
