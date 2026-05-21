import { NextResponse } from 'next/server';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    try {
      fs.mkdirSync('./data', { recursive: true });
      fs.writeFileSync('./data/trigger.flag', '1', 'utf-8');
    } catch {
      // ignore on read-only filesystems
    }
    return NextResponse.json({
      data: { triggered: true },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
