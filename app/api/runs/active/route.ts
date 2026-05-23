import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
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
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
