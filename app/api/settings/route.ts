import { NextResponse } from "next/server";

import { defaultSettings, readSettings, saveSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json({
    data: {
      topic: settings.topic,
      schedule: settings.cronSchedule,
      aceConnected: !!process.env.ACE_PLATFORM_TOKEN,
    },
    error: null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await saveSettings({
      topic: body.topic || defaultSettings.topic,
      schedule: body.schedule || defaultSettings.cronSchedule,
    });
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
