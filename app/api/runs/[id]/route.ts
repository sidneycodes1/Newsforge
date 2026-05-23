import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
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
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
