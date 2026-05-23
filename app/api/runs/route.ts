import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
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
    return NextResponse.json(
      { data: [], error: err.message },
      { status: 500 }
    );
  }
}
