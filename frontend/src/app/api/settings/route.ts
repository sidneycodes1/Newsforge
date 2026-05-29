import { NextResponse } from 'next/server';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    data: {
      topic: process.env.AGENT_TOPIC || 'Solana ecosystem',
      schedule: process.env.CRON_SCHEDULE || '*/15 * * * *',
      aceConnected: !!process.env.ACE_PLATFORM_TOKEN,
    },
    error: null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = {
      topic: body.topic || 'Solana ecosystem',
      schedule: body.schedule || '*/15 * * * *',
      updatedAt: new Date().toISOString(),
    };
    try {
      fs.mkdirSync('./data', { recursive: true });
      fs.writeFileSync(
        './data/config.json',
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    } catch {
      // ignore write errors on read-only filesystems
    }
    return NextResponse.json({
      data: { success: true },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: err.message },
      { status: 500 }
    );
  }
}
