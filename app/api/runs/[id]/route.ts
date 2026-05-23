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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = openDb();
    if (!db) {
      return NextResponse.json(
        { data: null, error: null },
        { status: 200 }
      );
    }

    const run = db.prepare(
      'SELECT * FROM runs WHERE id = ?'
    ).get(params.id);

    if (!run) {
      return NextResponse.json(
        { data: null, error: 'Not found' },
        { status: 404 }
      );
    }

    const steps = db.prepare(
      'SELECT * FROM steps WHERE run_id = ? ORDER BY step_number ASC'
    ).all(params.id);

    const output = db.prepare(
      'SELECT * FROM outputs WHERE run_id = ?'
    ).get(params.id);

    return NextResponse.json({
      data: { run, steps, output },
      error: null,
    });
  } catch (err: any) {
    console.error('[api/runs/[id]]', err.message);
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
